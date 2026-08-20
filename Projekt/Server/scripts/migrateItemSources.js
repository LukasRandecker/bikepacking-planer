/**
 * Einmalige Migration: Item-Herkunft auf das neue Enum bringen.
 *
 * Früher gab es nur CATALOG und USER, und USER hieß "sieht nur, wem es
 * gehört". Jetzt sind es drei:
 *
 *   CATALOG    Grundkatalog
 *   COMMUNITY  von einem Nutzer beigesteuert, für alle sichtbar
 *   PRIVATE    persönliche Kopie, nur für den Besitzer
 *
 * Altbestand wird zu PRIVATE, nicht zu COMMUNITY: die Einträge wurden
 * angelegt, als "eigenes Item" noch privat bedeutete. Wer sie mit anderen
 * teilen will, entscheidet das selbst — eine Migration stellt niemandem
 * ungefragt seine Sachen ins Schaufenster.
 *
 *   npm run migrate:sources
 */
const path = require('path');
const mongoose = require('mongoose');
const dotenv = require('dotenv');
dotenv.config({ path: path.join(__dirname, '..', '.env') });

const initDatabaseConnection = require('../dbConnection.js');
const Item = require('../models/bikepacking/item.js');

const KNOWN = ['CATALOG', 'COMMUNITY', 'PRIVATE'];

async function migrate() {
  await initDatabaseConnection('bikepacking');

  const legacy = await Item.find({ Source: { $nin: KNOWN } }).lean();

  if (legacy.length === 0) {
    console.log('Nichts zu migrieren — alle Items tragen bereits eine bekannte Herkunft.');
  } else {
    for (const item of legacy) {
      console.log(`  ${item.Itemname} (${item.Source}) → PRIVATE`);
    }
    const res = await Item.updateMany(
      { Source: { $nin: KNOWN } },
      { $set: { Source: 'PRIVATE' } }
    );
    console.log(`\nUmgestellt: ${res.modifiedCount}`);
  }

  const counts = await Item.aggregate([
    { $group: { _id: '$Source', n: { $sum: 1 } } },
    { $sort: { _id: 1 } }
  ]);
  console.log('\nHerkunft in der DB:');
  counts.forEach((row) => console.log(`  ${String(row._id).padEnd(10)} ${row.n}`));

  await mongoose.connection.close();
}

migrate().catch(async (err) => {
  console.error('Migration fehlgeschlagen:', err.message);
  await mongoose.connection.close().catch(() => {});
  process.exit(1);
});
