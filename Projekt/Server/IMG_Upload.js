const multer = require("multer");
const fs = require("fs");
const path = require("path");

const verifyToken = require("./routes/session/verifyToken.js");
const { resolveInside, storageName } = require("./uploadSafety.js");

const IMG_DIR = path.join(__dirname, "images", "bikepacking");
const MAX_BYTES = 5 * 1024 * 1024;
const ALLOWED_EXT = [".jpg", ".jpeg", ".png", ".webp"];
const ALLOWED_MIME = ["image/jpeg", "image/png", "image/webp"];

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    fs.mkdirSync(IMG_DIR, { recursive: true });
    cb(null, IMG_DIR);
  },
  filename: (req, file, cb) => {
    const name = storageName(file.originalname, ALLOWED_EXT);
    if (!name) return cb(new Error("Only JPG, PNG or WEBP images are accepted."));
    cb(null, name);
  }
});

const upload = multer({
  storage,
  limits: { fileSize: MAX_BYTES, files: 1 },
  fileFilter: (req, file, cb) => {
    const ext = path.extname(file.originalname || "").toLowerCase();
    // Endung und gemeldeter Typ müssen beide passen.
    if (!ALLOWED_EXT.includes(ext) || !ALLOWED_MIME.includes(file.mimetype)) {
      return cb(new Error("Only JPG, PNG or WEBP images are accepted."));
    }
    cb(null, true);
  }
});

function bikepackingImageUpload(app) {

  app.post("/bikepacking/uploadImage", verifyToken, (req, res) => {
    upload.single("image")(req, res, (err) => {
      if (err) {
        const tooBig = err.code === "LIMIT_FILE_SIZE";
        return res.status(tooBig ? 413 : 400).json({
          message: tooBig ? "The image is larger than 5 MB." : err.message
        });
      }
      if (!req.file) return res.status(400).json({ message: "Keine Datei hochgeladen" });

      res.json({
        fileName: req.file.filename,
        path: `/images/bikepacking/${req.file.filename}`
      });
    });
  });

  app.get("/bikepacking/loadImage/:fileName", (req, res) => {
    const filePath = resolveInside(IMG_DIR, req.params.fileName);
    const ext = filePath ? path.extname(filePath).toLowerCase() : "";
    if (!filePath || !ALLOWED_EXT.includes(ext)) {
      return res.status(400).json({ message: "Invalid file name." });
    }
    if (!fs.existsSync(filePath)) {
      return res.status(404).json({ message: "Bild nicht gefunden" });
    }

    res.sendFile(filePath);
  });
}

module.exports = { bikepackingImageUpload, IMG_DIR };
