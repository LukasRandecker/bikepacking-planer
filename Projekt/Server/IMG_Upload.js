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

/**
 * Ist das wirklich ein Bild?
 *
 * Endung und gemeldeter MIME-Typ kommen beide vom Client und sagen nichts
 * darueber, was in der Datei steht: eine HTML-Seite als `x.png` mit
 * `image/png` deklariert kam vorher glatt durch und wurde danach unter
 * `/images/...` wieder ausgeliefert. Deshalb hier der Blick auf die ersten
 * Bytes — die kann niemand faelschen, ohne ein echtes Bild zu schicken.
 */
function looksLikeImage(buffer) {
  if (buffer.length < 12) return false;

  // JPEG: FF D8 FF
  if (buffer[0] === 0xff && buffer[1] === 0xd8 && buffer[2] === 0xff) return true;

  // PNG: 89 50 4E 47 0D 0A 1A 0A
  if (buffer.subarray(0, 8).equals(Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]))) {
    return true;
  }

  // WEBP: "RIFF" .... "WEBP"
  if (buffer.subarray(0, 4).toString("ascii") === "RIFF" &&
      buffer.subarray(8, 12).toString("ascii") === "WEBP") {
    return true;
  }

  return false;
}

/** Liest die ersten Bytes einer Datei, ohne sie ganz einzulesen. */
async function readHeader(filePath, bytes = 12) {
  const handle = await fs.promises.open(filePath, "r");
  try {
    const buffer = Buffer.alloc(bytes);
    const { bytesRead } = await handle.read(buffer, 0, bytes, 0);
    return buffer.subarray(0, bytesRead);
  } finally {
    await handle.close();
  }
}

function bikepackingImageUpload(app) {

  app.post("/bikepacking/uploadImage", verifyToken, (req, res) => {
    upload.single("image")(req, res, async (err) => {
      if (err) {
        const tooBig = err.code === "LIMIT_FILE_SIZE";
        return res.status(tooBig ? 413 : 400).json({
          message: tooBig ? "The image is larger than 5 MB." : err.message
        });
      }
      if (!req.file) return res.status(400).json({ message: "Keine Datei hochgeladen" });

      // multer hat die Datei schon geschrieben — was kein Bild ist, fliegt
      // wieder runter, bevor irgendwer davon erfaehrt.
      try {
        if (!looksLikeImage(await readHeader(req.file.path))) {
          await fs.promises.unlink(req.file.path).catch(() => {});
          return res.status(400).json({
            message: "That file is not a JPG, PNG or WEBP image."
          });
        }
      } catch {
        await fs.promises.unlink(req.file.path).catch(() => {});
        return res.status(400).json({ message: "That image could not be read." });
      }

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
