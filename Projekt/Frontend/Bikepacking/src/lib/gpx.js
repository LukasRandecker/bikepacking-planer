/**
 * GPX lesen — im Browser statt auf dem Server.
 *
 * Portierung von `parseGpx` aus `Projekt/Server/GPX_Upload.js`. Zwei Zeilen
 * Umgebung aendern sich, die Rechnung keine:
 *
 *   `fs.readFileSync(path, "utf8")`  wird zu  `await file.text()`
 *   `@xmldom/xmldom`                 wird zum nativen `DOMParser`
 *
 * Die Haversine-Formel, die Reihenfolge der Punkte, das Aufsummieren der
 * Anstiege und die Rundung sind Zeichen fuer Zeichen dieselben. Das ist keine
 * Kosmetik: zeigte der Demo-Modus andere Kilometer als der echte Server, waere
 * keiner der beiden Werte noch etwas wert.
 *
 * Rueckgabe deshalb auch in derselben Form: `km` und `hm` sind Strings, weil
 * `toFixed` Strings liefert und das Frontend damit weiterrechnet.
 */

/** Wie `limits.fileSize` in `GPX_Upload.js`. */
export const MAX_GPX_BYTES = 10 * 1024 * 1024;

const ALLOWED = [".gpx"];

/**
 * Wie `storageName()` in `Server/uploadSafety.js`: der Name des Clients wird
 * nie uebernommen, sondern durch einen erzeugten ersetzt. Im Browser gibt es
 * kein Dateisystem, das man damit beschaedigen koennte — der Name steht
 * trotzdem in derselben Form auf dem Blatt wie beim echten Upload, sonst sieht
 * dieselbe Datei je nach Betriebsart anders aus.
 */
function storageName(originalName) {
  const base = String(originalName || "").replace(/\\/g, "/").split("/").pop() || "";
  const safe = base
    .replace(/[^a-zA-Z0-9._-]/g, "_")
    .replace(/^\.+/, "")
    .slice(0, 120);

  const dot = safe.lastIndexOf(".");
  const ext = dot > 0 ? safe.slice(dot).toLowerCase() : "";
  if (!ALLOWED.includes(ext)) return null;

  const stamp = Date.now().toString(36);
  const rand = Math.random().toString(36).slice(2, 10);
  return `${stamp}-${rand}${ext}`;
}

/**
 * Der Kern, wortgleich zum Server.
 *
 * @param {string} gpxData  Inhalt der Datei
 * @param {string} fileName Name, unter dem die Datei gefuehrt wird
 */
export function parseGpxText(gpxData, fileName) {
  const xml = new DOMParser().parseFromString(gpxData, "text/xml");

  // Der native DOMParser wirft nicht, wenn die Datei kaputt ist — er gibt ein
  // Dokument mit einem <parsererror> zurueck. Ohne diese Pruefung liefe eine
  // umbenannte JPEG-Datei stillschweigend als Tour mit 0 km durch, statt die
  // Meldung zu bekommen, die der Server an dieser Stelle liefert.
  if (xml.getElementsByTagName("parsererror").length > 0) {
    throw new Error("That file could not be read as GPX.");
  }

  const track = xml.getElementsByTagName("trk")[0];
  const tourName = track?.getElementsByTagName("name")[0]?.textContent || "Unbenannte Tour";

  const trkpts = Array.from(xml.getElementsByTagName("trkpt")).map(pt => ({
    lat: parseFloat(pt.getAttribute("lat")),
    lon: parseFloat(pt.getAttribute("lon")),
    ele: parseFloat(pt.getElementsByTagName("ele")[0]?.textContent || 0)
  })).filter(p => Number.isFinite(p.lat) && Number.isFinite(p.lon));

  let km = 0;
  let hm = 0;
  const haversine = (a, b, c, d) => {
    const R = 6371;
    const toRad = deg => (deg * Math.PI) / 180;
    const dLat = toRad(c - a);
    const dLon = toRad(d - b);
    const x = Math.sin(dLat / 2) ** 2 + Math.cos(toRad(a)) * Math.cos(toRad(c)) * Math.sin(dLon / 2) ** 2;
    return 2 * R * Math.asin(Math.sqrt(x));
  };

  for (let i = 1; i < trkpts.length; i++) {
    const p1 = trkpts[i - 1];
    const p2 = trkpts[i];
    km += haversine(p1.lat, p1.lon, p2.lat, p2.lon);
    if (p2.ele > p1.ele) hm += p2.ele - p1.ele;
  }

  return {
    tourName,
    km: km.toFixed(2),
    hm: hm.toFixed(0),
    coordinates: trkpts.map(p => [p.lat, p.lon]),
    fileName
  };
}

/**
 * Eine Datei aus einem `<input type="file">` lesen.
 *
 * Endung und Groesse prueft im Normalbetrieb multer auf dem Server. Ohne
 * Server prueft sie sonst niemand — deshalb stehen beide Grenzen hier noch
 * einmal, mit denselben Meldungen.
 */
export async function parseGpxFile(file) {
  if (!file) {
    const err = new Error("No GPX file uploaded.");
    err.status = 400;
    throw err;
  }

  const name = storageName(file.name);
  if (!name) {
    const err = new Error("Only .gpx files are accepted.");
    err.status = 400;
    throw err;
  }

  if (file.size > MAX_GPX_BYTES) {
    const err = new Error("The GPX file is larger than 10 MB.");
    err.status = 413;
    throw err;
  }

  try {
    return parseGpxText(await file.text(), name);
  } catch {
    const err = new Error("That file could not be read as GPX.");
    err.status = 400;
    throw err;
  }
}
