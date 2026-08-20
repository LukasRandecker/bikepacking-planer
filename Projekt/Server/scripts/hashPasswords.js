/**
 * Einmalige Migration: Klartext-Passwörter in bcrypt-Hashes überführen.
 *
 * Vor der Umstellung auf einen echten Login lagen die Passwörter im Klartext
 * in der Datenbank (und wurden über `GET /users` sogar ausgeliefert). Ohne
 * diesen Lauf käme kein Altkonto mehr durch den Login, weil bcrypt.compare
 * gegen einen Klartextwert immer fehlschlägt.
 *
 * Erkannt wird ein bereits gehashter Wert am bcrypt-Präfix ($2a$/$2b$/$2y$);
 * der Lauf ist dadurch wiederholbar.
 *
 * Die Klartext-Passwörter werden dabei nicht ausgegeben.
 *
 *   npm run migrate:passwords
 */
const path = require('path');
const mongoose = require('mongoose');
const bcrypt = require('bcrypt');
const dotenv = require('dotenv');
dotenv.config({ path: path.join(__dirname, '..', '.env') });

const initDatabaseConnection = require('../dbConnection.js');
const User = require('../models/bikepacking/user.js');

const SALT_ROUNDS = 12;
const BCRYPT = /^\$2[aby]\$\d{2}\$/;

async function migrate() {
  await initDatabaseConnection('bikepacking');

  const users = await User.find().select('+pw');
  let hashed = 0;
  let already = 0;

  for (const user of users) {
    if (!user.pw) {
      console.log(`  ${user.username}: kein Passwort gesetzt — übersprungen`);
      continue;
    }
    if (BCRYPT.test(user.pw)) {
      already += 1;
      continue;
    }

    user.pw = await bcrypt.hash(user.pw, SALT_ROUNDS);
    await user.save();
    hashed += 1;
    console.log(`  ${user.username}: gehasht`);
  }

  console.log(`\nKonten gesamt:      ${users.length}`);
  console.log(`neu gehasht:        ${hashed}`);
  console.log(`schon gehasht:      ${already}`);
  if (hashed > 0) {
    console.log('\nDie bisherigen Passwörter gelten weiter — sie liegen jetzt nur nicht mehr im Klartext.');
  }

  await mongoose.connection.close();
}

migrate().catch(async (err) => {
  console.error('Migration fehlgeschlagen:', err.message);
  await mongoose.connection.close().catch(() => {});
  process.exit(1);
});
