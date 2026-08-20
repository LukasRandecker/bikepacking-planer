/**
 * Füllt den Item-Katalog aus data/catalog.json.
 *
 * Der Grundstock ist die geparste Ausrüstungsliste von
 * https://fritzmeinecke.shop/blogs/news/ausrustung; der Rest sind ergänzte
 * Einträge. Bilder gibt es keine: `IMG` ist leer, das Frontend zeichnet dafür
 * ein schwarzes Rechteck.
 *
 * `Section` trägt die Herkunft aus der Quelle und `Keywords` frei vergebene
 * Suchbegriffe — beide werden nirgends angezeigt, sondern nur durchsucht.
 *
 * Der Lauf ist idempotent. Erkannt wird ein Eintrag über Name + Kategorie +
 * Marke, damit ein zweiter Lauf keine Dubletten anlegt und korrigierte Werte
 * nachzieht. Was Nutzer beigesteuert haben (COMMUNITY) und persönliche Kopien
 * (PRIVATE) bleiben unangetastet.
 *
 *   npm run seed:catalog          # anlegen und aktualisieren
 *   npm run seed:catalog -- --prune   # zusätzlich Katalogreste löschen
 */
const path = require('path');
const mongoose = require('mongoose');
const dotenv = require('dotenv');
dotenv.config({ path: path.join(__dirname, '..', '.env') });

const initDatabaseConnection = require('../dbConnection.js');
const Item = require('../models/bikepacking/item.js');
const catalog = require('../data/catalog.json');

const prune = process.argv.includes('--prune');

async function seed() {
  await initDatabaseConnection('bikepacking');

  const operations = catalog.map((entry) => ({
    updateOne: {
      filter: {
        Source: 'CATALOG',
        Itemname: entry.Itemname,
        Categorie: entry.Categorie,
        Brand: entry.Brand || ''
      },
      update: {
        $set: {
          Itemname: entry.Itemname,
          Brand: entry.Brand || '',
          Categorie: entry.Categorie,
          Section: entry.Section || '',
          Keywords: entry.Keywords || '',
          Link: entry.Link || '',
          Weight: entry.Weight || 0,
          Price: entry.Price || 0,
          IMG: '',
          Source: 'CATALOG',
          Owner: null
        }
      },
      upsert: true
    }
  }));

  const result = await Item.bulkWrite(operations, { ordered: false });
  const created = result.upsertedCount || 0;
  const updated = result.modifiedCount || 0;

  let removed = 0;
  if (prune) {
    // Alles, was der Katalog nicht mehr nennt. Nur CATALOG-Items, nie die
    // selbst angelegten Items der Nutzer.
    const keep = catalog.map((e) => ({
      Itemname: e.Itemname,
      Categorie: e.Categorie,
      Brand: e.Brand || ''
    }));
    const del = await Item.deleteMany({
      Source: 'CATALOG',
      $nor: keep
    });
    removed = del.deletedCount || 0;
  }

  const total = await Item.countDocuments({ Source: 'CATALOG' });

  console.log(`Katalog gelesen:    ${catalog.length} Einträge`);
  console.log(`Neu angelegt:       ${created}`);
  console.log(`Aktualisiert:       ${updated}`);
  if (prune) console.log(`Entfernt:           ${removed}`);
  console.log(`Katalog in der DB:  ${total} Items`);

  const byCategory = await Item.aggregate([
    { $match: { Source: 'CATALOG' } },
    { $group: { _id: '$Categorie', n: { $sum: 1 } } },
    { $sort: { _id: 1 } }
  ]);
  byCategory.forEach((row) => console.log(`  ${row._id.padEnd(14)} ${row.n}`));

  const brands = await Item.distinct('Brand', { Source: 'CATALOG', Brand: { $nin: ['', null] } });
  console.log(`Marken im Katalog:  ${brands.length}`);

  await mongoose.connection.close();
}

seed().catch(async (err) => {
  console.error('Seed fehlgeschlagen:', err.message);
  await mongoose.connection.close().catch(() => {});
  process.exit(1);
});
