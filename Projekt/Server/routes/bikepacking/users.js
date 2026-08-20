const express = require('express');
const mongoose = require('mongoose');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const dotenv = require('dotenv');
dotenv.config();

const router = express.Router();
const User = require('../../models/bikepacking/user.js');
const verifyToken = require('../session/verifyToken.js');

const { COOKIE } = verifyToken;
const SALT_ROUNDS = 12;
const WEEK_MS = 7 * 24 * 60 * 60 * 1000;

const MIN_USERNAME = 3;
const MAX_USERNAME = 32;
const MIN_PASSWORD = 8;
const MAX_PASSWORD = 200;

/**
 * Setzt das Sitzungs-Cookie.
 *
 * `httpOnly` hält den Token aus dem Zugriff von JavaScript, `sameSite: 'lax'`
 * verhindert, dass eine fremde Seite mitgeschickte Cookies für schreibende
 * Anfragen missbraucht. `secure` bleibt lokal aus, weil die App über http
 * läuft — beim Deployment gehört es an (siehe COOKIE_SECURE).
 */
function setSessionCookie(res, user) {
  const token = jwt.sign(
    { id: String(user._id), username: user.username },
    process.env.TOKEN_SECRET,
    { expiresIn: '7d' }
  );

  res.cookie(COOKIE, token, {
    httpOnly: true,
    sameSite: 'lax',
    secure: process.env.COOKIE_SECURE === 'true',
    maxAge: WEEK_MS,
    path: '/'
  });
}

/** Prüft Zugangsdaten, ohne zu verraten, welcher Teil davon falsch war. */
function validateCredentials(body) {
  const errors = [];
  const username = typeof body.username === 'string' ? body.username.trim() : '';
  const password = typeof body.pw === 'string' ? body.pw : '';

  if (username.length < MIN_USERNAME || username.length > MAX_USERNAME) {
    errors.push(`The username must be between ${MIN_USERNAME} and ${MAX_USERNAME} characters.`);
  }
  if (!/^[a-zA-Z0-9._-]+$/.test(username)) {
    errors.push('The username may only contain letters, digits, dots, dashes and underscores.');
  }
  if (password.length < MIN_PASSWORD || password.length > MAX_PASSWORD) {
    errors.push(`The password must be at least ${MIN_PASSWORD} characters.`);
  }

  return { errors, username, password };
}

/** Die öffentliche Sicht auf ein Konto. Nie mehr als das. */
const publicUser = (user) => ({
  _id: user._id,
  username: user.username,
  tours: user.tours || [],
  itemlists: user.itemlists || []
});

/**
 * @swagger
 * tags:
 *   name: Users
 *   description: Konten und Sitzung
 */

/**
 * @swagger
 * /bikepacking/users/register:
 *   post:
 *     summary: Konto anlegen und einloggen
 *     tags: [Users]
 *     responses:
 *       201:
 *         description: Konto angelegt, Sitzungs-Cookie gesetzt
 *       400:
 *         description: Ungültige Zugangsdaten
 *       409:
 *         description: Benutzername vergeben
 */
router.post('/register', async (req, res) => {
  try {
    const { errors, username, password } = validateCredentials(req.body);
    if (errors.length) return res.status(400).json({ message: errors.join(' ') });

    const taken = await User.findOne({ username });
    if (taken) {
      return res.status(409).json({ message: `“${username}” is taken. Pick another name, or log in.` });
    }

    const user = await User.create({
      username,
      pw: await bcrypt.hash(password, SALT_ROUNDS)
    });

    setSessionCookie(res, user);
    res.status(201).json(publicUser(user));
  } catch (err) {
    // Der unique-Index kann trotz Vorabprüfung zuschlagen (zwei Anfragen
    // gleichzeitig) — das ist kein Serverfehler.
    if (err.code === 11000) {
      return res.status(409).json({ message: 'That username is taken.' });
    }
    res.status(400).json({ message: err.message });
  }
});

/**
 * @swagger
 * /bikepacking/users/login:
 *   post:
 *     summary: Einloggen
 *     description: >
 *       Der Vergleich läuft über bcrypt auf dem Server. Das Passwort verlässt
 *       den Server nicht und steht in keiner Antwort.
 *     tags: [Users]
 *     responses:
 *       200:
 *         description: Eingeloggt, Sitzungs-Cookie gesetzt
 *       401:
 *         description: Benutzername oder Passwort falsch
 */
router.post('/login', async (req, res) => {
  try {
    const username = typeof req.body.username === 'string' ? req.body.username.trim() : '';
    const password = typeof req.body.pw === 'string' ? req.body.pw : '';

    if (!username || !password) {
      return res.status(400).json({ message: 'Enter both a username and a password.' });
    }

    const user = await User.findOne({ username }).select('+pw');

    // Eine Antwort für beide Fälle: Wer raten will, soll nicht erfahren,
    // welche Benutzernamen es gibt.
    const ok = user && (await bcrypt.compare(password, user.pw));
    if (!ok) {
      return res.status(401).json({ message: 'That username and password do not match.' });
    }

    setSessionCookie(res, user);
    res.json(publicUser(user));
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

/**
 * @swagger
 * /bikepacking/users/logout:
 *   post:
 *     summary: Ausloggen
 *     tags: [Users]
 *     responses:
 *       200:
 *         description: Cookie gelöscht
 */
router.post('/logout', (req, res) => {
  res.clearCookie(COOKIE, { path: '/' });
  res.json({ message: 'Logged out.' });
});

/**
 * @swagger
 * /bikepacking/users/me:
 *   get:
 *     summary: Das eigene Konto
 *     description: Die einzige Route, die ein Konto ausliefert — und zwar nur das eigene.
 *     tags: [Users]
 *     responses:
 *       200:
 *         description: Konto
 *       401:
 *         description: Nicht eingeloggt
 */
router.get('/me', verifyToken, async (req, res) => {
  try {
    const user = await User.findById(req.user.id);
    if (!user) {
      res.clearCookie(COOKIE, { path: '/' });
      return res.status(401).json({ message: 'That account no longer exists.' });
    }
    res.json(publicUser(user));
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

/**
 * @swagger
 * /bikepacking/users/me/tours:
 *   put:
 *     summary: Touren mit dem eigenen Konto verknüpfen
 *     tags: [Users]
 *     responses:
 *       200:
 *         description: Aktualisiertes Konto
 */
router.put('/me/tours', verifyToken, async (req, res) => {
  try {
    const { tourIds } = req.body;
    if (!Array.isArray(tourIds) || !tourIds.every((id) => mongoose.isValidObjectId(id))) {
      return res.status(400).json({ message: 'tourIds must be an array of valid ids.' });
    }

    const user = await User.findByIdAndUpdate(
      req.user.id,
      { $addToSet: { tours: { $each: tourIds } } },
      { new: true, runValidators: true }
    );
    if (!user) return res.status(404).json({ message: 'User not found' });

    res.json(publicUser(user));
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
});

/**
 * @swagger
 * /bikepacking/users/me/itemlists:
 *   put:
 *     summary: Packlisten mit dem eigenen Konto verknüpfen
 *     tags: [Users]
 *     responses:
 *       200:
 *         description: Aktualisiertes Konto
 */
router.put('/me/itemlists', verifyToken, async (req, res) => {
  try {
    const { itemlistIds } = req.body;
    if (!Array.isArray(itemlistIds) || !itemlistIds.every((id) => mongoose.isValidObjectId(id))) {
      return res.status(400).json({ message: 'itemlistIds must be an array of valid ids.' });
    }

    const user = await User.findByIdAndUpdate(
      req.user.id,
      { $addToSet: { itemlists: { $each: itemlistIds } } },
      { new: true, runValidators: true }
    );
    if (!user) return res.status(404).json({ message: 'User not found' });

    res.json(publicUser(user));
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
});

/**
 * @swagger
 * /bikepacking/users/me:
 *   delete:
 *     summary: Das eigene Konto löschen
 *     tags: [Users]
 *     responses:
 *       200:
 *         description: Konto gelöscht
 */
router.delete('/me', verifyToken, async (req, res) => {
  try {
    const deleted = await User.findByIdAndDelete(req.user.id);
    if (!deleted) return res.status(404).json({ message: 'User not found' });

    res.clearCookie(COOKIE, { path: '/' });
    res.json({ message: 'User deleted' });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

/*
 * Bewusst nicht mehr vorhanden:
 *   GET /users                  — lieferte jedes Konto samt Passwort aus
 *   GET /users/:id              — jedes fremde Konto, ebenfalls mit Passwort
 *   GET /users/username/:name   — trug den Login-Vergleich in den Client
 *   PUT /users/:id/addTours     — schrieb auf jedes beliebige Konto
 *   PUT /users/:id/addItemlists — dito
 * Ersetzt durch /me und /me/*, die immer nur das Konto aus dem Token treffen.
 */

module.exports = router;
