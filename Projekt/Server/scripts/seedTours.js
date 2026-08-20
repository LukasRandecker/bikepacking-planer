/**
 * Legt die vorgeschlagenen Touren der Startseite an.
 *
 * Beispieldaten, keine echten Fahrten: die Tracks werden hier erzeugt und als
 * `*-demo.gpx` abgelegt, die Packlisten aus dem Katalog zusammengesetzt (siehe
 * seedCatalog.js, das vorher gelaufen sein muss). Der Feed braucht sie, damit
 * die Startseite etwas zu zeigen hat, solange keine Nutzer eigene Touren
 * veröffentlicht haben.
 *
 * Idempotent: erkannt wird eine Tour über ihren Namen.
 *
 *   npm run seed:tours
 */
const fs = require('fs');
const path = require('path');
const mongoose = require('mongoose');
const dotenv = require('dotenv');
dotenv.config({ path: path.join(__dirname, '..', '.env') });

const initDatabaseConnection = require('../dbConnection.js');
const Tour = require('../models/bikepacking/tour.js');
const Itemlist = require('../models/bikepacking/itemlist.js');
const Item = require('../models/bikepacking/item.js');

const GPX_DIR = path.join(__dirname, '..', 'files', 'bikepacking');

/**
 * Ein Track entlang der angegebenen Wegpunkte: die Punkte werden verbunden und
 * mit reproduzierbarem Rauschen versehen, damit die Linie auf der Karte nach
 * Straße aussieht und nicht nach Lineal.
 *
 * Die Höhe ist ein Profil aus `climbs` großen Anstiegen plus einer welligen
 * Oberlagerung. Die Summe der Anstiege bestimmt die Höhenmeter — deshalb steht
 * die Anzahl der Anstiege im Tourspec und nicht eine Frequenz.
 */
function buildTrack({ via, points, baseElevation, climbHeight, climbs, seed }) {
  let state = seed;
  const random = () => {
    // Kleiner LCG: gleicher Seed, gleicher Track bei jedem Lauf.
    state = (state * 1664525 + 1013904223) % 4294967296;
    return state / 4294967296;
  };

  /** Position auf dem Polygonzug durch alle Wegpunkte, t von 0 bis 1. */
  const onRoute = (t) => {
    const legs = via.length - 1;
    const scaled = Math.min(t * legs, legs - 1e-9);
    const leg = Math.floor(scaled);
    const f = scaled - leg;
    return [
      via[leg][0] + (via[leg + 1][0] - via[leg][0]) * f,
      via[leg][1] + (via[leg + 1][1] - via[leg][1]) * f
    ];
  };

  const track = [];
  let driftLat = 0;
  let driftLon = 0;

  for (let i = 0; i < points; i++) {
    const t = i / (points - 1);
    driftLat += (random() - 0.5) * 0.010;
    driftLon += (random() - 0.5) * 0.010;

    // Die Abweichung läuft an beiden Enden wieder auf die Ideallinie zu.
    const taper = Math.sin(Math.PI * t);
    const [baseLat, baseLon] = onRoute(t);
    const lat = baseLat + driftLat * taper;
    const lon = baseLon + driftLon * taper;

    const ele =
      baseElevation +
      climbHeight * 0.5 * (1 - Math.cos(t * 2 * Math.PI * climbs)) +
      climbHeight * 0.015 * Math.sin(t * 2 * Math.PI * climbs * 9);

    track.push([lat, lon, Math.max(0, Math.round(ele))]);
  }

  return track;
}

function writeGpx(fileName, tourName, track) {
  const filePath = path.join(GPX_DIR, fileName);
  fs.mkdirSync(GPX_DIR, { recursive: true });

  const points = track
    .map(
      ([lat, lon, ele]) =>
        `      <trkpt lat="${lat.toFixed(6)}" lon="${lon.toFixed(6)}"><ele>${ele}</ele></trkpt>`
    )
    .join('\n');

  const gpx = `<?xml version="1.0" encoding="UTF-8"?>
<gpx version="1.1" creator="Bikepacking-Planer seed script" xmlns="http://www.topografix.com/GPX/1/1">
  <trk>
    <name>${tourName}</name>
    <trkseg>
${points}
    </trkseg>
  </trk>
</gpx>
`;

  fs.writeFileSync(filePath, gpx);
  return filePath;
}

/** Distanz und Höhenmeter wie GPX_Upload.js sie rechnet. */
function measure(track) {
  const toRad = (deg) => (deg * Math.PI) / 180;
  const haversine = (a, b, c, d) => {
    const R = 6371;
    const dLat = toRad(c - a);
    const dLon = toRad(d - b);
    const x =
      Math.sin(dLat / 2) ** 2 +
      Math.cos(toRad(a)) * Math.cos(toRad(c)) * Math.sin(dLon / 2) ** 2;
    return 2 * R * Math.asin(Math.sqrt(x));
  };

  let km = 0;
  let hm = 0;
  for (let i = 1; i < track.length; i++) {
    km += haversine(track[i - 1][0], track[i - 1][1], track[i][0], track[i][1]);
    if (track[i][2] > track[i - 1][2]) hm += track[i][2] - track[i - 1][2];
  }
  return { km: Math.round(km), hm: Math.round(hm) };
}

// Die Packlisten greifen auf Katalogeinträge zu; gesucht wird über den Namen,
// weil die Ids erst beim Seed entstehen.
const TOURS = [
  {
    Name: 'Morocco — Atlas crossing',
    Author: 'lena.k',
    Description:
      'Neun Tage vom Atlantik über den Hohen Atlas. Wasser war das Thema, nicht das Gewicht: zwischen den Pässen liegen lange Etappen ohne Quelle.',
    StartDate: '2026-03-14',
    EndDate: '2026-03-23',
    Biketype: 'GRAVEL',
    Setupstyle: 'OUTDOOR',
    Type: 'BIKEPACKING',
    Mode: 'GROUP',
    Cover: '/IMG/CardImage.webp',
    track: {
      via: [[31.63, -8.0], [31.06, -7.13], [30.93, -6.91], [30.47, -8.88], [30.42, -9.6]],
      points: 800, baseElevation: 700, climbHeight: 1100, climbs: 5, seed: 11
    },
    items: [
      'Fahrrad - Gravelbike', 'Rahmentasche', 'Satteltasche', 'Lenkerrolle', 'Oberrohrtasche',
      'Zelt', 'Isomatte Sommer (Größe: Regular)', 'Schlafsack Frühling/Herbst', 'Kopfkissen',
      'Klicker-Schuhe', 'Trikot (schwarz)', 'Regenjacke', 'Beinlinge', 'Helm',
      'Wasserfilter mit Aktivkohle', 'Gaskocher', 'Titan Becher', 'Klapplöffel',
      'Gesäßcreme', 'Zahnbürste', 'First-Aid-Kit klein (Inhalt ist selbst zusammen gestellt)',
      'Pumpe', 'Multitool', 'Fahrrad GPS Computer', 'Powerbank'
    ]
  },
  {
    Name: 'Kyrgyzstan — Tian Shan loop',
    Author: 'fritz',
    Description:
      'Hochland, Schotter und Nächte unter null. Das Setup ist das Kirgistan-Setup von 2024, ergänzt um den Winterschlafsack.',
    StartDate: '2025-08-02',
    EndDate: '2025-08-19',
    Biketype: 'MTB',
    Setupstyle: 'OUTDOOR',
    Type: 'BIKEPACKING',
    Mode: 'SOLO',
    Cover: '/IMG/Kyrgistan.webp',
    track: {
      via: [[42.87, 74.6], [41.84, 75.13], [41.43, 76.0], [42.49, 78.4], [42.49, 78.39]],
      points: 900, baseElevation: 2000, climbHeight: 1400, climbs: 6, seed: 23
    },
    items: [
      'Oberrohrtasche hinten', 'Oberrohrtasche vorne', 'Snacktasche', 'Satteltasche',
      'Lenkerrolle', 'Stabilisator/Flaschenhalter', 'Aerobar',
      'Zelt', 'Isomatte Winter (Größe: Large)', 'Schlafsack Winter', 'Kopfkissen',
      'Daunenjacke', 'Softshelljacke (oliv/schwarz)', 'Handschuhe Winter', 'Helmmütze',
      'Winterüberschuhe', 'lange Thermo Bib-Short (gepolsterte Fahrradhose)',
      'Wasserfilter klein', 'Kocher Militär', 'Feldflasche', 'Besteck',
      'Dynamo-Frontlicht', 'Dynamo-Rücklicht', 'USB-Ladeeinheit', 'Uhr zum tracken',
      'Multitool', 'Zahnputztabletten', 'Blasenpflaster'
    ]
  },
  {
    Name: 'Across Germany — Flensburg to Oberstdorf',
    Author: 'mo.h',
    Description:
      'Einmal längs, überwiegend auf Radfernwegen. Indoor geschlafen, deshalb kein Schlafsystem an Bord — dafür alles für Regen.',
    StartDate: '2025-05-10',
    EndDate: '2025-05-21',
    Biketype: 'GRAVEL',
    Setupstyle: 'INDOOR',
    Type: 'BIKEPACKING',
    Mode: 'GROUP',
    Cover: '/IMG/Gravel.webp',
    track: {
      via: [[54.78, 9.43], [53.55, 9.99], [52.37, 9.73], [49.79, 9.94], [48.37, 10.9], [47.41, 10.28]],
      points: 950, baseElevation: 80, climbHeight: 340, climbs: 18, seed: 37
    },
    items: [
      'Fahrrad - Gravelbike', 'Rahmentasche', 'Satteltasche', 'Handyhalterung', 'Sattel',
      'Regenjacke', 'Windjacke mit Netzrücken', 'Regenüberschuhe', 'Handschuhe dünn',
      'Trikot (schwarz)', 'Langarm Trikot (oliv)', 'Brille (schwarz)', 'Helm',
      'Fahrradschloss', 'Trinkblase', 'Trinkschlach-Magnet-Clip',
      'Fahrrad GPS Computer', 'Powerbank', 'Kopfhörer',
      'Zahnbürste', 'Gesäßcreme', 'Pumpe', 'Mini Werkzeug-Satteltasche'
    ]
  },
  {
    Name: 'Peak & Planes',
    Author: 'lena.k',
    Description:
      'Vier Tage Rennrad, kein Gepäck außer dem, was in die Trikottaschen passt. Die Liste ist bewusst kurz.',
    StartDate: '2025-09-05',
    EndDate: '2025-09-08',
    Biketype: 'ROAD',
    Setupstyle: 'INDOOR',
    Type: 'RACE',
    Mode: 'SOLO',
    Cover: '/IMG/Peak_Planes.webp',
    track: {
      via: [[46.52, 7.98], [46.5, 8.4], [46.25, 8.15], [46.02, 8.95]],
      points: 620, baseElevation: 600, climbHeight: 1500, climbs: 4, seed: 53
    },
    items: [
      'Rennrad (Rose Xlite06)', 'Satteltasche (Apidura 5l)', 'Oberrohrtasche',
      'Flasche groß', 'Flasche klein',
      'kurze Bib', 'Trikot kurz', 'Armlinge', 'Windjacke', 'Handschuhe kurz',
      'Helm', 'Sonnenbrille', 'Schuhe', 'dünne Socken',
      'Navi', 'Brustgurt', 'Powerbank 20k', 'USB-C Kabel',
      '2x Ersatzschläuche', 'Reifenheber', 'Tool', 'Kettenschloss',
      'Mini Sonnencreme', 'Mini Popocreme (umgefüllt)', 'Pflaster'
    ]
  },
  {
    Name: 'RAAM 2025 — solo',
    Author: 'fritz',
    Description:
      'Race Across America, solo mit Begleitfahrzeug. Am Rad hängt fast nichts; die Liste hier ist, was tatsächlich mitgefahren ist.',
    StartDate: '2025-06-17',
    EndDate: '2025-06-29',
    Biketype: 'ROAD',
    Setupstyle: 'MIXED',
    Type: 'RACE',
    Mode: 'GROUP',
    Cover: '/IMG/RAAM.webp',
    track: {
      via: [[33.2, -117.38], [35.2, -111.65], [37.05, -100.92], [38.62, -90.2], [39.96, -82.99], [38.79, -76.08]],
      points: 1200, baseElevation: 250, climbHeight: 900, climbs: 32, seed: 71
    },
    items: [
      'Rennrad (Rose Xlite06)', 'Reifen', 'Navi- und Lichthalterung', 'Trinkrucksack',
      'kurze Bib', 'Base Layer', 'Thermo Trikot', 'Beinlinge', 'Überschuhe',
      'Helm', 'klare Brille', 'Sonnenbrille', 'Schlauchschal',
      'Frontlicht + Fernbedienung (Lupine SL AF)', 'Rücklicht (Trek Flare RT)',
      'Navi', 'Brustgurt', 'Powerbank 20k', 'CR2032 Batterie',
      'Reiseapotheke/Tabletten', 'Blasenpflaster', '4x Taschentuch',
      'Ventilverlängerung', 'Flicken selbstklebend', 'Autoventil-Adapter'
    ]
  }
];

const slug = (s) =>
  s.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');

async function seed() {
  await initDatabaseConnection('bikepacking');

  const catalogSize = await Item.countDocuments({ Source: 'CATALOG' });
  if (catalogSize === 0) {
    throw new Error('Der Katalog ist leer. Erst `npm run seed:catalog` laufen lassen.');
  }

  for (const spec of TOURS) {
    const track = buildTrack(spec.track);
    const fileName = `${slug(spec.Name)}-demo.gpx`;
    writeGpx(fileName, spec.Name, track);
    const { km, hm } = measure(track);

    // Packliste: was der Katalog unter diesen Namen hergibt.
    const matches = await Item.find({
      Source: 'CATALOG',
      Itemname: { $in: spec.items }
    }).select('_id Itemname');

    // Manche Namen stehen im Katalog mehrfach (anderer Abschnitt, anderer
    // Link). Für die Packliste zählt der erste Treffer, sonst stünde das
    // Item doppelt auf der Liste.
    const byName = new Map();
    matches.forEach((item) => {
      if (!byName.has(item.Itemname)) byName.set(item.Itemname, item);
    });

    const items = spec.items.map((name) => byName.get(name)).filter(Boolean);
    const missing = spec.items.filter((name) => !byName.has(name));

    const list = await Itemlist.findOneAndUpdate(
      { Name: `${spec.Name} — packlist` },
      { Name: `${spec.Name} — packlist`, items: items.map((i) => String(i._id)) },
      { new: true, upsert: true }
    );

    await Tour.findOneAndUpdate(
      { Name: spec.Name },
      {
        Name: spec.Name,
        StartDate: spec.StartDate,
        EndDate: spec.EndDate,
        Biketype: spec.Biketype,
        Setupstyle: spec.Setupstyle,
        Type: spec.Type,
        Mode: spec.Mode,
        GPX_file: fileName,
        Itemlist: list._id,
        Author: spec.Author,
        Description: spec.Description,
        Cover: spec.Cover,
        Distance: km,
        Elevation: hm,
        Public: true
      },
      { new: true, upsert: true, runValidators: true }
    );

    console.log(
      `${spec.Name.padEnd(38)} ${String(km).padStart(5)} km  ${String(hm).padStart(6)} hm  ${items.length} Items` +
        (missing.length ? `  (nicht im Katalog: ${missing.join(', ')})` : '')
    );
  }

  const total = await Tour.countDocuments({ Public: true });
  console.log(`\nÖffentliche Touren in der DB: ${total}`);

  await mongoose.connection.close();
}

seed().catch(async (err) => {
  console.error('Seed fehlgeschlagen:', err.message);
  await mongoose.connection.close().catch(() => {});
  process.exit(1);
});
