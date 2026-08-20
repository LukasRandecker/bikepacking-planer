const express = require('express');
const bodyParser = require('body-parser');
const cookieParser = require('cookie-parser');
const cors = require('cors');
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

// CORS konfigurieren
app.use(cors({
    origin: "http://localhost:5173",
    credentials: true
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

// Server starten
app.listen(port, () => {
    console.log(`Server listening at http://localhost:${port}`);
});
