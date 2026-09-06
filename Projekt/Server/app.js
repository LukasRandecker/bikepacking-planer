const express = require('express');
const bodyParser = require('body-parser');
const cookieParser = require('cookie-parser');
const cors = require('cors');
const helmet = require('helmet');
const dotenv = require("dotenv");
dotenv.config();

const initDatabaseConnection = require('./dbConnection.js');
const swaggerDocs = require("./swagger.js");

const { bikepackingUpload } = require('./GPX_Upload.js');
const { bikepackingImageUpload } = require('./IMG_Upload.js');

// Ohne Secret liesse sich jeder Token faelschen — lieber gar nicht starten.
if (!process.env.TOKEN_SECRET || process.env.TOKEN_SECRET.length < 16) {
    console.error("TOKEN_SECRET fehlt oder ist zu kurz (mindestens 16 Zeichen). Siehe Server/.env.");
    process.exit(1);
}

const app = express();

/**
 * Wer den Server ansprechen darf.
 *
 * Stand frueher fest auf dem Dev-Server (:5173) — damit kam der
 * Produktions-Build (:4173) nicht durch und lud keine einzige Tour. Die Liste
 * kommt jetzt aus `CORS_ORIGIN` (kommagetrennt); ohne die Variable gelten die
 * beiden lokalen Adressen, damit `npm run dev` und `npm run preview` ohne
 * Konfiguration laufen.
 */
const ALLOWED_ORIGINS = (process.env.CORS_ORIGIN || "http://localhost:5173,http://localhost:4173")
    .split(",")
    .map((o) => o.trim())
    .filter(Boolean);

app.use(cors({
    origin: (origin, cb) => {
        // Ohne Origin sind es Aufrufe ausserhalb des Browsers (curl, Swagger,
        // ein <img> ohne CORS) — die brauchen keine Freigabe.
        if (!origin || ALLOWED_ORIGINS.includes(origin)) return cb(null, true);
        cb(new Error("Origin not allowed"));
    },
    credentials: true
}));

/**
 * Sicherheits-Header.
 *
 * Zwei Voreinstellungen von helmet muessen weichen, sonst bricht die App:
 * `crossOriginResourcePolicy` steht auf same-origin und wuerde dem Frontend
 * auf einem anderen Port jedes hochgeladene Bild verweigern, und die
 * Standard-CSP verbietet das Inline-Script, mit dem Swagger UI startet.
 * Die CSP gilt hier ohnehin nur fuer das, was dieser Server selbst
 * ausliefert — die Seiten kommen vom Frontend.
 */
app.use(helmet({
    contentSecurityPolicy: {
        directives: {
            defaultSrc: ["'self'"],
            // Uploads sind Bilder und werden als Bilder eingebunden.
            imgSrc: ["'self'", "data:"],
            scriptSrc: ["'self'"],
            styleSrc: ["'self'", "'unsafe-inline'"],
            objectSrc: ["'none'"],
            frameAncestors: ["'none'"],
            upgradeInsecureRequests: null
        }
    },
    crossOriginResourcePolicy: { policy: "cross-origin" },
    referrerPolicy: { policy: "no-referrer" }
}));

// Swagger UI startet ueber ein Inline-Script und braucht deshalb eine eigene,
// etwas weitere CSP. Sie gilt nur unter /docs und ueberschreibt die obige,
// weil sie nach ihr registriert ist.
app.use('/docs', helmet.contentSecurityPolicy({
    directives: {
        defaultSrc: ["'self'"],
        scriptSrc: ["'self'", "'unsafe-inline'"],
        styleSrc: ["'self'", "'unsafe-inline'"],
        imgSrc: ["'self'", "data:"],
        objectSrc: ["'none'"],
        upgradeInsecureRequests: null
    }
}));

// Body Parser. Das Limit deckelt, was ein einzelner Request an JSON schicken
// kann — Uploads laufen ueber multer und haben ihre eigenen Grenzen.
app.use(bodyParser.urlencoded({ extended: false, limit: '100kb' }));
app.use(bodyParser.json({ limit: '100kb' }));
app.use(cookieParser());

// Verraet nicht mehr, dass hier Express laeuft.
app.disable('x-powered-by');

// Statische Bilder
app.use('/images', express.static(__dirname + '/images'));

// Statische GPX-Dateien
app.use('/files/bikepacking', express.static(__dirname + '/files/bikepacking'));

// DB initialisieren
initDatabaseConnection('bikepacking') // feste DB "bikepacking"
    .catch(err => console.error("MongoDB connection error:", err));

// Routes
app.use('/bikepacking/tours', require('./routes/bikepacking/tours'));
app.use('/bikepacking/itemlists', require('./routes/bikepacking/itemlists'));
app.use('/bikepacking/items', require('./routes/bikepacking/items'));
app.use('/bikepacking/users', require('./routes/bikepacking/users'));

bikepackingUpload(app);
bikepackingImageUpload(app);

// Default Route
app.get('/', (req, res) => {
    res.send('Bikepacking API is running');
});

// Swagger
const port = process.env.PORT || 3030;
swaggerDocs(app, port);

/** Was es nicht gibt, antwortet als JSON — nicht als Express-HTML-Seite. */
app.use((req, res) => {
    res.status(404).json({ message: "Not found" });
});

/**
 * Der letzte Halt.
 *
 * Ohne diesen Handler beantwortet Express jeden Fehler mit seiner eigenen
 * HTML-Seite — samt Stacktrace und absoluten Pfaden. Ein 413 verriet so den
 * Benutzernamen und die halbe Ordnerstruktur des Servers. Nach aussen geht
 * jetzt eine kurze Meldung, die Einzelheiten bleiben im Log.
 */
// eslint-disable-next-line no-unused-vars -- Express erkennt den Handler an vier Argumenten
app.use((err, req, res, next) => {
    const status = err.status || err.statusCode || 500;

    if (status >= 500) console.error(err);

    const message =
        err.message === "Origin not allowed"
            ? "Origin not allowed."
            : status === 413
                ? "That request is too large."
                : status < 500
                    ? err.message || "Bad request."
                    : "Something went wrong on the server.";

    if (res.headersSent) return next(err);
    res.status(status).json({ message });
});

// Server starten
app.listen(port, () => {
    console.log(`Server listening at http://localhost:${port}`);
});
