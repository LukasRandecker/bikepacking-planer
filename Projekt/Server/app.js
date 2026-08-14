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

const app = express();

// CORS konfigurieren
app.use(cors({
    origin: "http://localhost:5173",
    credentials: true
}));

// Body Parser
app.use(bodyParser.urlencoded({ extended: false }));
app.use(bodyParser.json());
app.use(cookieParser());

// Statische Bilder
app.use('/images', express.static(__dirname + '/images'));

// Statische GPX-Dateien
app.use('/files/bikepacking', express.static(__dirname + '/files/bikepacking'));

// DB initialisieren
initDatabaseConnection('bikepacking'); // feste DB "bikepacking"

// Routes
require('./routes/session/session')(app);

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
