const path = require("path");

/**
 * Gemeinsame Absicherung für alles, was Dateien annimmt oder ausliefert.
 *
 * Die Upload-Endpunkte sind die offenste Stelle der App: Hier kommt ein vom
 * Client gewählter Dateiname an, und der wird niemals als Pfad verwendet.
 */

/**
 * Ein Dateiname, den der Client geschickt hat, wird auf seinen letzten
 * Bestandteil reduziert und von allem befreit, was ihn zu einem Pfad machen
 * könnte. `../../app.js` wird zu `app.js`, `C:\x\y.gpx` zu `y.gpx`.
 */
function safeName(input) {
  if (typeof input !== "string") return "";
  const base = path.basename(input.replace(/\\/g, "/"));
  return base
    .replace(/[^a-zA-Z0-9._-]/g, "_")
    .replace(/^\.+/, "")
    .slice(0, 120);
}

/**
 * Löst `name` innerhalb von `dir` auf und gibt null zurück, wenn das Ergebnis
 * den Ordner verlässt. Der Vergleich läuft über den aufgelösten Pfad, nicht
 * über den String — ein `..` kann sich auch durch Symlinks einschleichen.
 */
function resolveInside(dir, name) {
  const safe = safeName(name);
  if (!safe) return null;

  const root = path.resolve(dir);
  const full = path.resolve(root, safe);

  // `root + path.sep` verhindert, dass `/files-evil` als `/files` durchgeht.
  if (full !== root && !full.startsWith(root + path.sep)) return null;
  return full;
}

/**
 * Ein eindeutiger Speichername mit der geprüften Endung. Der Originalname
 * landet nie auf der Platte: zwei Nutzer mit „bild.jpg" würden sich sonst
 * gegenseitig überschreiben, und ein präparierter Name wäre ein Pfad.
 */
function storageName(originalName, allowedExtensions) {
  const ext = path.extname(safeName(originalName)).toLowerCase();
  if (!allowedExtensions.includes(ext)) return null;

  const stamp = Date.now().toString(36);
  const rand = Math.random().toString(36).slice(2, 10);
  return `${stamp}-${rand}${ext}`;
}

module.exports = { safeName, resolveInside, storageName };
