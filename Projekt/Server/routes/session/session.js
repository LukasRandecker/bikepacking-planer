const User = require('../../models/bikepacking/user');
const SHA256 = require("crypto-js/sha256");
const jwt = require('jsonwebtoken');
const dotenv = require('dotenv');
dotenv.config();

function generateToken(res, email, id) {
    const expiration = 604800000; // 7 Tage in ms
    const token = jwt.sign({ email, id }, process.env.TOKEN_SECRET, {
        expiresIn: '7d',
    });
    return res.cookie('token', token, {
        expires: new Date(Date.now() + expiration),
        secure: false, // auf true setzen, wenn HTTPS
        httpOnly: true
    });
}

module.exports = function (app) {

    app.post('/signup', async (req, res) => {
        try {
            let userData = req.body;
            let user = await User.findOne({ email: userData.email });

            if (!user) {
                // Passwort hashen
                userData.password = SHA256(userData.password).toString();
                let newUser = new User(userData);
                await newUser.save(); // Mongoose 7+ benötigt kein Callback mehr

                generateToken(res, userData.email, newUser._id);
                return res.status(201).send("successfully signed up!");
            } else {
                return res.status(401).send("user already exists");
            }
        } catch (err) {
            console.error(err);
            return res.status(422).send("data are not correct!");
        }
    });

    app.post('/login', async (req, res) => {
        try {
            let userData = req.body;
            let user = await User.findOne({ email: userData.email });

            if (user) {
                let pw = SHA256(userData.password).toString();
                if (user.password === pw) {
                    generateToken(res, userData.email, user._id);
                    return res.status(201).send("successfully signed in!");
                } else {
                    return res.status(401).send("user or password wrong!");
                }
            } else {
                return res.status(401).send("user does not exists");
            }
        } catch (err) {
            console.error(err);
            return res.status(500).send("internal server error");
        }
    });

    app.post('/logout', (req, res) => {
        res.clearCookie('token');
        return res.status(200).send("logout successful");
    });
};
