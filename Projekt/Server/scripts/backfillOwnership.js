/**
 * Einmalige Migration: Eigentum an Touren nachtragen.
 *
 * Vor der Umstellung auf echte Autorisierung stand nirgends, wem eine Tour
 * gehört — die Verbindung existierte nur in eine Richtung, als Id-Liste am
 * Konto (`user.tours`). Die Routen fragen jetzt `Tour.Owner`, und ohne diesen
 * Lauf wären Alt-Touren für ihr eigenes Konto unsichtbar.
 *
 * Angefasst wird nur, was eindeutig ist: Touren, die an genau einem Konto
 * hängen und noch keinen Owner haben. Besitzerlose Touren bleiben besitzerlos.
 *
 *   npm run migrate:owners
 */
const path = require('path');
const mongoose = require('mongoose');
const dotenv = require('dotenv');
dotenv.config({ path: path.join(__dirname, '..', '.env') });

const initDatabaseConnection = require('../dbConnection.js');
const User = require('../models/bikepacking/user.js');
const Tour = require('../models/bikepacking/tour.js');

async function migrate() {
  await initDatabaseConnection('bikepacking');

  const users = await User.find().lean();

  // Erst zählen, an wie vielen Konten jede Tour hängt.
  const claims = new Map();
  users.forEach((user) => {
    (user.tours || []).forEach((tourId) => {
      const key = String(tourId);
      if (!claims.has(key)) claims.set(key, []);
      claims.get(key).push(user);
    });
  });

  let assigned = 0;
  let ambiguous = 0;
  let alreadySet = 0;

  for (const [tourId, owners] of claims) {
    const tour = await Tour.findById(tourId);
    if (!tour) continue;

    if (tour.Owner) {
      alreadySet += 1;
      continue;
    }
    if (owners.length > 1) {
      ambiguous += 1;
      console.log(
        `  ${tour.Name}: hängt an ${owners.length} Konten (${owners.map((u) => u.username).join(', ')}) — übersprungen`
      );
      continue;
    }

    tour.Owner = owners[0]._id;
    if (!tour.Author) tour.Author = owners[0].username;
    await tour.save();
    assigned += 1;
    console.log(`  ${tour.Name} → ${owners[0].username}`);
  }

  const orphans = await Tour.countDocuments({ Owner: null });

  console.log(`\nZugeordnet:              ${assigned}`);
  console.log(`schon zugeordnet:        ${alreadySet}`);
  if (ambiguous) console.log(`mehrdeutig, offen:       ${ambiguous}`);
  console.log(`ohne Besitzer (Demo):    ${orphans}`);

  await mongoose.connection.close();
}

migrate().catch(async (err) => {
  console.error('Migration fehlgeschlagen:', err.message);
  await mongoose.connection.close().catch(() => {});
  process.exit(1);
});
