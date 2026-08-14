const multer = require("multer");
const fs = require("fs");
const { DOMParser } = require("xmldom");
let _fileName = "GPX_Upload.js";

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const dir = "files/bikepacking";
    if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
    cb(null, dir);
  },
  filename: (req, file, cb) => {
    _fileName = file.originalname;
    cb(null, file.originalname); // Originalname verwenden
  }
});

const upload = multer({ storage });

// Hilfsfunktion: GPX-Datei parsen und JSON zurückgeben
function parseGpx(filePath, fileName) {
  const gpxData = fs.readFileSync(filePath, "utf8");
  const xml = new DOMParser().parseFromString(gpxData, "text/xml");

  const track = xml.getElementsByTagName("trk")[0];
  const tourName = track?.getElementsByTagName("name")[0]?.textContent || "Unbenannte Tour";

  const trkpts = Array.from(xml.getElementsByTagName("trkpt")).map(pt => ({
    lat: parseFloat(pt.getAttribute("lat")),
    lon: parseFloat(pt.getAttribute("lon")),
    ele: parseFloat(pt.getElementsByTagName("ele")[0]?.textContent || 0)
  }));

  // Distanz + Höhenmeter berechnen
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
};

function bikepackingUpload(app) {

  // Upload-Route (funktioniert wie bisher)
  app.post("/bikepacking/upload", upload.single("gpx"), (req, res) => {
    const parsed = parseGpx(req.file.path, _fileName);
    res.json(parsed);
  });

  // Neue Route: GPX laden von Server
  app.get("/bikepacking/loadGpx/:fileName", (req, res) => {
    const fileName = req.params.fileName;
    const filePath = `files/bikepacking/${fileName}`;

    if (!fs.existsSync(filePath)) {
      return res.status(404).json({ message: "GPX-Datei nicht gefunden" });
    }

    try {
      const parsed = parseGpx(filePath, fileName);
      res.json(parsed);
    } catch (err) {
      console.error(err);
      res.status(500).json({ message: "Fehler beim Parsen der GPX-Datei" });
    }
  });
}

module.exports = { bikepackingUpload };
