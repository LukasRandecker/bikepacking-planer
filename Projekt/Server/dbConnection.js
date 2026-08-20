const mongoose = require("mongoose");
const dotenv = require("dotenv");
dotenv.config();

function initDatabaseConnection() {
    const mongoDB = process.env.MONGO_URI;
    if (!mongoDB) {
        console.error("No MONGO_URI defined in .env");
        process.exit(1);
    }

    // Gibt das Promise zurück, damit Skripte (siehe scripts/) auf die
    // Verbindung warten und bei einem Fehler abbrechen können.
    return mongoose.connect(mongoDB)
        .then(() => console.log("MongoDB connected"));
}

module.exports = initDatabaseConnection;
