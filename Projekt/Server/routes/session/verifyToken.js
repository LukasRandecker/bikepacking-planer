const jwt = require('jsonwebtoken');
const dotenv = require('dotenv');
dotenv.config();

const COOKIE = 'token';

/**
 * Der Token wird ausschließlich aus dem httpOnly-Cookie gelesen.
 *
 * Früher stand hier zusätzlich `req.headers['authorization']`. Das ist wieder
 * raus: ein Token, den JavaScript setzen kann, kann JavaScript auch stehlen —
 * und mit zwei Quellen gilt immer die schwächere.
 */
function verifyToken(req, res, next) {
    const token = req.cookies?.[COOKIE];
    if (!token) {
        return res.status(401).json({ message: 'Log in to do that.' });
    }

    jwt.verify(token, process.env.TOKEN_SECRET, (err, decoded) => {
        if (err) {
            return res.status(401).json({ message: 'Your session has expired. Log in again.' });
        }
        // Ab hier ist `req.user.id` die einzige Quelle dafür, wer schreibt —
        // nie eine Id aus dem Body oder aus der Adresse.
        req.user = { id: decoded.id, username: decoded.username };
        next();
    });
}

/**
 * Wie verifyToken, lässt aber auch Anfragen ohne Token durch. Für Routen, die
 * eingeloggt mehr zeigen als ausgeloggt, ohne dass Ausgeloggte draußen bleiben.
 */
function optionalToken(req, res, next) {
    const token = req.cookies?.[COOKIE];
    if (!token) return next();

    jwt.verify(token, process.env.TOKEN_SECRET, (err, decoded) => {
        if (!err) req.user = { id: decoded.id, username: decoded.username };
        next();
    });
}

module.exports = verifyToken;
module.exports.optionalToken = optionalToken;
module.exports.COOKIE = COOKIE;
