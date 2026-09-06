const multer = require("multer");
const fs = require("fs");
const path = require("path");
// @xmldom/xmldom ist der gepflegte Nachfolger des aufgegebenen `xmldom`.
const { DOMParser } = require("@xmldom/xmldom");

const verifyToken = require("./routes/session/verifyToken.js");
const { resolveInside, storageName } = require("./uploadSafety.js");

const GPX_DIR = path.join(__dirname, "files", "bikepacking");
const MAX_BYTES = 10 * 1024 * 1024;
const ALLOWED = [".gpx"];

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    fs.mkdirSync(GPX_DIR, { recursive: true });
    cb(null, GPX_DIR);
  },
  filename: (req, file, cb) => {
    // Nie der Name des Clients: der wäre ein Pfad (`../../app.js`) und würde
    // fremde Uploads gleichen Namens überschreiben.
    const name = storageName(file.originalname, ALLOWED);
    if (!name) return cb(new Error("Only .gpx files are accepted."));
    cb(null, name);
  }
});

const upload = multer({
  storage,
  limits: { fileSize: MAX_BYTES, files: 1 },
  fileFilter: (req, file, cb) => {
    const ext = path.extname(file.originalname || "").toLowerCase();
    if (!ALLOWED.includes(ext)) {
      return cb(new Error("Only .gpx files are accepted."));
    }
    cb(null, true);
  }
});

/** Liest eine GPX-Datei und rechnet Distanz und Höhenmeter aus. */
function parseGpx(filePath, fileName) {
  const gpxData = fs.readFileSync(filePath, "utf8");
  const xml = new DOMParser().parseFromString(gpxData, "text/xml");

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

function bikepackingUpload(app) {

  // Hochladen schreibt auf die Platte — das setzt ein Konto voraus.
  app.post("/bikepacking/upload", verifyToken, (req, res) => {
    upload.single("gpx")(req, res, (err) => {
      if (err) {
        const tooBig = err.code === "LIMIT_FILE_SIZE";
        return res.status(tooBig ? 413 : 400).json({
          message: tooBig ? "The GPX file is larger than 10 MB." : err.message
        });
      }
      if (!req.file) return res.status(400).json({ message: "No GPX file uploaded." });

      try {
        // Der Name kommt aus multer, nicht aus der Anfrage.
        res.json(parseGpx(req.file.path, req.file.filename));
      } catch {
        fs.unlink(req.file.path, () => {});
        res.status(400).json({ message: "That file could not be read as GPX." });
      }
    });
  });

  // Lesen darf jeder — Touren sind öffentlich. Der Dateiname aus der Adresse
  // wird aber nie direkt zu einem Pfad zusammengesetzt.
  app.get("/bikepacking/loadGpx/:fileName", (req, res) => {
    const filePath = resolveInside(GPX_DIR, req.params.fileName);
    if (!filePath || !filePath.toLowerCase().endsWith(".gpx")) {
      return res.status(400).json({ message: "Invalid file name." });
    }
    if (!fs.existsSync(filePath)) {
      return res.status(404).json({ message: "GPX-Datei nicht gefunden" });
    }

    try {
      res.json(parseGpx(filePath, path.basename(filePath)));
    } catch (err) {
      console.error(err);
      res.status(500).json({ message: "Fehler beim Parsen der GPX-Datei" });
    }
  });
}

module.exports = { bikepackingUpload, GPX_DIR };
