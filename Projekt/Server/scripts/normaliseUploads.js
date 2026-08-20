/**
 * Einmalige Migration: Alt-Uploads auf sichere Dateinamen bringen.
 *
 * Bis zur Härtung der Upload-Routen landete der Dateiname des Clients
 * unverändert auf der Platte — inklusive Leerzeichen und Sonderzeichen. Die
 * Leseroute normalisiert Namen jetzt (`safeName`), bevor sie einen Pfad daraus
 * baut. Für Altdateien heißt das: sie liegen unter einem Namen, den die Route
 * nie erzeugt, und sind damit nicht mehr erreichbar.
 *
 * Dieser Lauf benennt sie auf der Platte um und zieht die Verweise in der
 * Datenbank nach (`Tour.GPX_file`, `Item.IMG`). Dateien, deren Name schon
 * passt, bleiben unberührt; der Lauf ist wiederholbar.
 *
 *   npm run migrate:uploads
 */
const fs = require('fs');
const path = require('path');
const mongoose = require('mongoose');
const dotenv = require('dotenv');
dotenv.config({ path: path.join(__dirname, '..', '.env') });

const initDatabaseConnection = require('../dbConnection.js');
const Tour = require('../models/bikepacking/tour.js');
const Item = require('../models/bikepacking/item.js');
const { safeName } = require('../uploadSafety.js');

const GPX_DIR = path.join(__dirname, '..', 'files', 'bikepacking');
const IMG_DIR = path.join(__dirname, '..', 'images', 'bikepacking');

/**
 * Benennt um und gibt die Zuordnung alt → neu zurück. Kollidiert der neue Name
 * mit einer anderen Datei, bekommt er eine Nummer angehängt, statt sie zu
 * überschreiben.
 */
function normaliseDir(dir) {
  if (!fs.existsSync(dir)) return new Map();

  const renames = new Map();
  for (const current of fs.readdirSync(dir)) {
    if (!fs.statSync(path.join(dir, current)).isFile()) continue;

    let target = safeName(current);
    if (!target || target === current) continue;

    let candidate = target;
    let n = 1;
    while (fs.existsSync(path.join(dir, candidate))) {
      const ext = path.extname(target);
      candidate = `${path.basename(target, ext)}-${n}${ext}`;
      n += 1;
    }

    fs.renameSync(path.join(dir, current), path.join(dir, candidate));
    renames.set(current, candidate);
    console.log(`  ${current}\n    → ${candidate}`);
  }
  return renames;
}

async function migrate() {
  await initDatabaseConnection('bikepacking');

  console.log('GPX-Dateien:');
  const gpxRenames = normaliseDir(GPX_DIR);
  if (gpxRenames.size === 0) console.log('  nichts umzubenennen');

  console.log('Bilder:');
  const imgRenames = normaliseDir(IMG_DIR);
  if (imgRenames.size === 0) console.log('  nichts umzubenennen');

  let tours = 0;
  for (const [from, to] of gpxRenames) {
    const res = await Tour.updateMany({ GPX_file: from }, { $set: { GPX_file: to } });
    tours += res.modifiedCount || 0;
  }

  let items = 0;
  for (const [from, to] of imgRenames) {
    const res = await Item.updateMany(
      { IMG: `/images/bikepacking/${from}` },
      { $set: { IMG: `/images/bikepacking/${to}` } }
    );
    items += res.modifiedCount || 0;
  }

  // Cover-Bilder zeigen auf denselben Ordner.
  let covers = 0;
  for (const [from, to] of imgRenames) {
    const res = await Tour.updateMany(
      { Cover: `/images/bikepacking/${from}` },
      { $set: { Cover: `/images/bikepacking/${to}` } }
    );
    covers += res.modifiedCount || 0;
  }

  console.log(`\nTouren mit neuem GPX-Verweis:  ${tours}`);
  console.log(`Items mit neuem Bildverweis:   ${items}`);
  console.log(`Cover mit neuem Verweis:       ${covers}`);

  await mongoose.connection.close();
}

migrate().catch(async (err) => {
  console.error('Migration fehlgeschlagen:', err.message);
  await mongoose.connection.close().catch(() => {});
  process.exit(1);
});
