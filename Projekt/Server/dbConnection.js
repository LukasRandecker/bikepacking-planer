const mongoose = require("mongoose");
const dotenv = require("dotenv");
dotenv.config();

function initDatabaseConnection() {
    const mongoDB = process.env.MONGO_URI;
    if (!mongoDB) {
        console.error("No MONGO_URI defined in .env");
        process.exit(1);
    }

    mongoose.connect(mongoDB)
        .then(() => console.log("MongoDB connected"))
        .catch(err => console.error("MongoDB connection error:", err));
}

module.exports = initDatabaseConnection;
