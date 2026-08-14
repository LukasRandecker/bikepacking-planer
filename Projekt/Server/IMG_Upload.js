const multer = require("multer");
const fs = require("fs");
let _fileName = "IMG_Upload.js";

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const dir = "images/bikepacking";
    if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
    cb(null, dir);
  },
  filename: (req, file, cb) => {
    _fileName = file.originalname;  // Originalname behalten
    cb(null, file.originalname);
  }
});

const upload = multer({ storage });

function bikepackingImageUpload(app) {

  // Upload-Route
  app.post("/bikepacking/uploadImage", upload.single("image"), (req, res) => {
    if (!req.file) {
      return res.status(400).json({ message: "Keine Datei hochgeladen" });
    }

    // Rückgabe für Frontend
    res.json({
      fileName: _fileName, // Originalname
      path: `/images/bikepacking/${_fileName}` // Pfad für Vorschau oder API
    });
  });

  // Bild laden von Server
  app.get("/bikepacking/loadImage/:fileName", (req, res) => {
    const fileName = req.params.fileName;
    const filePath = `images/bikepacking/${fileName}`;

    if (!fs.existsSync(filePath)) {
      return res.status(404).json({ message: "Bild nicht gefunden" });
    }

    res.sendFile(filePath, { root: "." });
  });
}

module.exports = { bikepackingImageUpload };
