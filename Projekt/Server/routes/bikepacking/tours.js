const express = require('express');
const mongoose = require('mongoose');
const router = express.Router();
const Tour = require('../../models/bikepacking/tour.js');
const Itemlist = require('../../models/bikepacking/itemlist.js');
const Item = require('../../models/bikepacking/item.js');
const User = require('../../models/bikepacking/user.js');
const verifyToken = require('../session/verifyToken.js');
const fs = require('fs');
const path = require('path');
const { safeName, resolveInside } = require('../../uploadSafety.js');
const { GPX_DIR } = require('../../GPX_Upload.js');
const { IMG_DIR } = require('../../IMG_Upload.js');

const ymd = (d) => (d ? d.toISOString().split('T')[0] : '');

const BIKETYPES = ['MTB', 'ROAD', 'GRAVEL'];
const SETUPSTYLES = ['OUTDOOR', 'INDOOR', 'MIXED'];
const TYPES = ['BIKEPACKING', 'RACE'];
const MODES = ['SOLO', 'GROUP'];

const MAX_NAME = 120;
const MAX_DESCRIPTION = 1000;

// Cover-Bilder sind eigene Uploads (`/images/...`) oder die mitgelieferten
// Blattbilder der Demo-Touren (`/IMG/...`). Fremde URLs kommen nicht auf die
// Startseite, und `..` ist verboten: `/images/../../.env` passte sonst auf das
// Muster, weil Punkt und Schrägstrich beide erlaubte Zeichen sind.
const COVER_PATTERN = /^\/(IMG|images)\/(?!.*\.\.)[A-Za-z0-9._/-]+\.(jpe?g|png|webp|avif|jfif)$/i;

/**
 * Prüft und filtert die Felder einer Tour.
 *
 * Gibt nur zurück, was gesetzt werden darf — `req.body` wandert nie
 * unbesehen in die Datenbank. Sonst setzt sich der Client sein eigenes
 * `Public`, `Owner` oder `Distance`.
 */
function validateTour(body, { partial = false } = {}) {
  const errors = [];
  const value = {};

  const text = (key, max, required) => {
    if (body[key] === undefined) {
      if (required && !partial) errors.push(`${key} is required.`);
      return;
    }
    const v = typeof body[key] === 'string' ? body[key].trim() : '';
    if (required && !v) errors.push(`${key} is required.`);
    else if (v.length > max) errors.push(`${key} must be at most ${max} characters.`);
    else value[key] = v;
  };

  text('Name', MAX_NAME, true);
  text('Description', MAX_DESCRIPTION, false);

  for (const key of ['StartDate', 'EndDate']) {
    if (body[key] === undefined) {
      if (!partial) errors.push(`${key} is required.`);
      continue;
    }
    const d = new Date(body[key]);
    if (Number.isNaN(d.getTime())) errors.push(`${key} is not a valid date.`);
    else value[key] = d;
  }

  if (value.StartDate && value.EndDate && value.EndDate < value.StartDate) {
    errors.push('EndDate cannot fall before StartDate.');
  }

  const enumField = (key, allowed) => {
    if (body[key] === undefined) {
      if (!partial) errors.push(`${key} is required.`);
      return;
    }
    if (!allowed.includes(body[key])) errors.push(`${key} must be one of: ${allowed.join(', ')}.`);
    else value[key] = body[key];
  };

  enumField('Biketype', BIKETYPES);
  enumField('Setupstyle', SETUPSTYLES);
  enumField('Type', TYPES);
  enumField('Mode', MODES);

  if (body.GPX_file !== undefined) {
    const file = body.GPX_file ? safeName(body.GPX_file) : '';
    if (file && !file.toLowerCase().endsWith('.gpx')) errors.push('GPX_file must be a .gpx file.');
    else value.GPX_file = file;
  }

  if (body.Cover !== undefined) {
    const cover = typeof body.Cover === 'string' ? body.Cover.trim() : '';
    if (cover && !COVER_PATTERN.test(cover)) {
      errors.push('Cover must be an image served by this app.');
    } else {
      value.Cover = cover;
    }
  }

  for (const key of ['Distance', 'Elevation']) {
    if (body[key] === undefined) continue;
    const n = Number(body[key]);
    if (!Number.isFinite(n) || n < 0) errors.push(`${key} must be a number of at least 0.`);
    else value[key] = Math.round(n);
  }

  if (body.Public !== undefined) {
    if (typeof body.Public !== 'boolean') errors.push('Public must be true or false.');
    else value.Public = body.Public;
  }

  if (body.Itemlist !== undefined && body.Itemlist !== null && body.Itemlist !== '') {
    if (!mongoose.isValidObjectId(body.Itemlist)) errors.push('Itemlist must be a valid id.');
    else value.Itemlist = body.Itemlist;
  } else if (body.Itemlist === null || body.Itemlist === '') {
    value.Itemlist = null;
  }

  return { errors, value };
}

/**
 * Löscht eine hochgeladene Datei, sofern keine Tour sie mehr braucht.
 *
 * `stillUsed` ist die Bedingung, unter der eine andere Tour dieselbe Datei
 * referenziert — erst wenn niemand mehr darauf zeigt, verschwindet sie von der
 * Platte. Schlägt das Löschen fehl, ist das kein Grund, die Anfrage scheitern
 * zu lassen: die Tour ist dann trotzdem weg, es liegt nur eine Datei zu viel
 * herum.
 */
async function dropIfUnused(dir, fileName, stillUsed) {
  if (!fileName) return;

  const filePath = resolveInside(dir, fileName);
  if (!filePath) return;

  if (await Tour.exists(stillUsed)) return;

  try {
    await fs.promises.unlink(filePath);
  } catch {
    // Datei war schon weg oder ist gesperrt — beides unkritisch.
  }
}

/** Lädt eine Tour und stellt sicher, dass sie dem Anfragenden gehört. */
async function ownTour(req, res) {
  if (!mongoose.isValidObjectId(req.params.id)) {
    res.status(400).json({ message: 'Invalid tour id.' });
    return null;
  }

  const tour = await Tour.findById(req.params.id);
  if (!tour) {
    res.status(404).json({ message: 'Tour not found' });
    return null;
  }

  // Gleiche Antwort für "gibt es nicht" und "gehört dir nicht": wer fremde
  // Ids durchprobiert, soll daraus nicht lesen können, welche existieren.
  if (String(tour.Owner) !== req.user.id) {
    res.status(404).json({ message: 'Tour not found' });
    return null;
  }

  return tour;
}

/** Die Packliste einer Tour, ausgeschrieben. */
async function loadPacklist(itemlistId) {
  if (!itemlistId) return null;

  const list = await Itemlist.findById(itemlistId).lean();
  if (!list) return null;

  const ids = (list.items || []).filter((id) => mongoose.isValidObjectId(id));
  const found = ids.length ? await Item.find({ _id: { $in: ids } }).lean() : [];
  const byId = new Map(found.map((item) => [String(item._id), item]));
  const items = ids.map((id) => byId.get(String(id))).filter(Boolean);

  return {
    _id: list._id,
    Name: list.Name || '',
    items,
    totalWeight: items.reduce((sum, i) => sum + (i.Weight || 0), 0),
    totalPrice: items.reduce((sum, i) => sum + (i.Price || 0), 0)
  };
}

/**
 * @swagger
 * tags:
 *   name: Tours
 *   description: Touren
 */

/**
 * @swagger
 * /bikepacking/tours:
 *   post:
 *     summary: Eine Tour anlegen
 *     description: Die Tour gehört dem eingeloggten Konto und ist zunächst privat.
 *     tags: [Tours]
 *     responses:
 *       201:
 *         description: Tour angelegt
 *       400:
 *         description: Bad Request
 *       401:
 *         description: Nicht eingeloggt
 */
router.post('/', verifyToken, async (req, res) => {
  try {
    const { errors, value } = validateTour(req.body);
    if (errors.length) return res.status(400).json({ message: errors.join(' ') });

    const tour = await Tour.create({
      ...value,
      Owner: req.user.id,
      Author: req.user.username,
      // Veröffentlichen ist ein eigener Schritt, kein Nebeneffekt des Anlegens.
      Public: false
    });

    await User.findByIdAndUpdate(req.user.id, { $addToSet: { tours: tour._id } });

    res.status(201).json(tour);
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
});

/**
 * @swagger
 * /bikepacking/tours/feed:
 *   get:
 *     summary: Vorgeschlagene Touren für die Startseite
 *     description: Öffentliche Touren, zeitlich sortiert (jüngstes Startdatum zuerst).
 *     tags: [Tours]
 *     parameters:
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 12
 *       - in: query
 *         name: order
 *         schema:
 *           type: string
 *           enum: [newest, oldest]
 *     responses:
 *       200:
 *         description: Sortierte Tourenliste
 */
router.get('/feed', async (req, res) => {
  try {
    const limit = Math.min(Math.max(parseInt(req.query.limit, 10) || 12, 1), 50);
    const order = req.query.order === 'oldest' ? 1 : -1;

    const tours = await Tour.find({ Public: true })
      .sort({ StartDate: order })
      .limit(limit)
      .select('-Owner')
      .lean();

    const listIds = tours.map((t) => t.Itemlist).filter(Boolean);
    const lists = listIds.length
      ? await Itemlist.find({ _id: { $in: listIds } }).lean()
      : [];
    const countById = new Map(
      lists.map((l) => [String(l._id), (l.items || []).length])
    );

    res.json(
      tours.map((tour) => ({
        ...tour,
        StartDate: ymd(tour.StartDate),
        EndDate: ymd(tour.EndDate),
        ItemCount: countById.get(String(tour.Itemlist)) || 0
      }))
    );
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

/**
 * @swagger
 * /bikepacking/tours/mine:
 *   get:
 *     summary: Die eigenen Touren
 *     tags: [Tours]
 *     responses:
 *       200:
 *         description: Touren des eingeloggten Kontos
 *       401:
 *         description: Nicht eingeloggt
 */
router.get('/mine', verifyToken, async (req, res) => {
  try {
    const tours = await Tour.find({ Owner: req.user.id })
      .sort({ StartDate: -1 })
      .lean();

    const listIds = tours.map((t) => t.Itemlist).filter(Boolean);
    const lists = listIds.length
      ? await Itemlist.find({ _id: { $in: listIds } }).lean()
      : [];
    const byId = new Map(lists.map((l) => [String(l._id), l]));

    res.json(
      tours.map((tour) => {
        const list = byId.get(String(tour.Itemlist));
        return {
          ...tour,
          StartDate: ymd(tour.StartDate),
          EndDate: ymd(tour.EndDate),
          ItemCount: list ? (list.items || []).length : 0,
          ItemlistName: list ? list.Name || '' : ''
        };
      })
    );
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

/**
 * @swagger
 * /bikepacking/tours/{id}/full:
 *   get:
 *     summary: Eine Tour samt Packliste
 *     description: Öffentliche Touren für jeden, private nur für ihr eigenes Konto.
 *     tags: [Tours]
 *     responses:
 *       200:
 *         description: Tour mit Packliste
 *       404:
 *         description: Tour not found
 */
router.get('/:id/full', verifyToken.optionalToken, async (req, res) => {
  try {
    if (!mongoose.isValidObjectId(req.params.id)) {
      return res.status(400).json({ message: 'Invalid tour id.' });
    }

    const tour = await Tour.findById(req.params.id).lean();
    if (!tour) return res.status(404).json({ message: 'Tour not found' });

    const isOwner = req.user && String(tour.Owner) === req.user.id;
    if (!tour.Public && !isOwner) {
      return res.status(404).json({ message: 'Tour not found' });
    }

    const packlist = await loadPacklist(tour.Itemlist);
    const { Owner, ...publicFields } = tour;

    res.json({
      tour: {
        ...publicFields,
        StartDate: ymd(tour.StartDate),
        EndDate: ymd(tour.EndDate),
        IsOwner: Boolean(isOwner)
      },
      packlist
    });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

/**
 * @swagger
 * /bikepacking/tours/{id}:
 *   get:
 *     summary: Eine Tour zum Weiterbearbeiten laden
 *     tags: [Tours]
 *     responses:
 *       200:
 *         description: Tour
 *       404:
 *         description: Tour not found
 */
router.get('/:id', verifyToken, async (req, res) => {
  try {
    const tour = await ownTour(req, res);
    if (!tour) return;

    res.json({
      ...tour.toObject(),
      StartDate: ymd(tour.StartDate),
      EndDate: ymd(tour.EndDate)
    });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

/**
 * @swagger
 * /bikepacking/tours/{id}:
 *   put:
 *     summary: Eine eigene Tour ändern
 *     tags: [Tours]
 *     responses:
 *       200:
 *         description: Tour geändert
 *       404:
 *         description: Tour not found
 */
router.put('/:id', verifyToken, async (req, res) => {
  try {
    const tour = await ownTour(req, res);
    if (!tour) return;

    const { errors, value } = validateTour(req.body, { partial: true });
    if (errors.length) return res.status(400).json({ message: errors.join(' ') });

    // Eigentum und Autor bleiben, wie sie beim Anlegen gesetzt wurden.
    delete value.Owner;
    delete value.Author;

    // Sichtbarkeit ist kein gewoehnliches Feld: sie geht ausschliesslich ueber
    // PUT /tours/:id/publish, weil nur dort geprueft wird, ob die Tour Track,
    // Cover und eine gefuellte Packliste hat. Ohne diese Zeile liess sich der
    // Gate mit `{"Public": true}` schlicht umgehen — die Tour stand danach mit
    // leerer Kachel im oeffentlichen Index.
    delete value.Public;

    Object.assign(tour, value);
    const saved = await tour.save();
    res.json(saved);
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
});

/**
 * @swagger
 * /bikepacking/tours/{id}/publish:
 *   put:
 *     summary: Eine eigene Tour veröffentlichen oder zurückziehen
 *     description: >
 *       Veröffentlichen setzt voraus, dass die Tour eine Packliste mit Items
 *       hat — ein Beitrag ohne Liste hätte auf der Startseite nichts zu zeigen.
 *     tags: [Tours]
 *     responses:
 *       200:
 *         description: Sichtbarkeit geändert
 *       400:
 *         description: Tour ist noch nicht vollständig
 *       404:
 *         description: Tour not found
 */
router.put('/:id/publish', verifyToken, async (req, res) => {
  try {
    const tour = await ownTour(req, res);
    if (!tour) return;

    if (typeof req.body.Public !== 'boolean') {
      return res.status(400).json({ message: 'Public must be true or false.' });
    }

    if (req.body.Public) {
      // Was eine Kachel im Index mindestens zeigen muss: eine Linie auf der
      // Karte, ein Bild und eine Liste, die tatsächlich etwas enthält.
      const missing = [];
      if (!tour.GPX_file) missing.push('a GPX track');
      if (!tour.Cover) missing.push('a cover photo');
      if (!tour.Itemlist) missing.push('a packlist');

      if (tour.Itemlist) {
        const list = await Itemlist.findById(tour.Itemlist).lean();
        if (!list || (list.items || []).length === 0) missing.push('items on its packlist');
      }

      if (missing.length) {
        const list =
          missing.length < 2
            ? missing[0]
            : `${missing.slice(0, -1).join(', ')} and ${missing[missing.length - 1]}`;
        return res.status(400).json({
          message: `This tour needs ${list} before it can be published.`
        });
      }
    }

    tour.Public = req.body.Public;
    const saved = await tour.save();
    res.json(saved);
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
});

/**
 * @swagger
 * /bikepacking/tours/{id}:
 *   delete:
 *     summary: Eine eigene Tour löschen
 *     tags: [Tours]
 *     responses:
 *       200:
 *         description: Tour gelöscht
 *       404:
 *         description: Tour not found
 */
router.delete('/:id', verifyToken, async (req, res) => {
  try {
    const tour = await ownTour(req, res);
    if (!tour) return;

    const { GPX_file, Cover } = tour;

    await tour.deleteOne();
    await User.findByIdAndUpdate(req.user.id, { $pull: { tours: tour._id } });

    // Die Packliste bleibt: sie steht für sich, hängt am Konto und kann an
    // einer anderen Tour weiterverwendet werden. Die hochgeladenen Dateien
    // dagegen gehörten nur dieser Tour — sofern sie keine andere mehr nutzt.
    await Promise.all([
      dropIfUnused(GPX_DIR, GPX_file, { GPX_file }),
      Cover && Cover.startsWith('/images/bikepacking/')
        ? dropIfUnused(IMG_DIR, path.basename(Cover), { Cover })
        : null
    ]);

    res.json({ message: 'Tour deleted' });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

/*
 * Entfallen: POST /tours/find. Die Route suchte eine Tour über ihre Felder,
 * um nach dem Anlegen an die Id zu kommen — POST /tours gibt die Tour jetzt
 * samt Id zurück, und die Suche hätte fremde Touren gefunden.
 */

module.exports = router;

// Das Konto-Loeschen in users.js raeumt dieselben Dateien weg und soll dafuer
// nicht seine eigene Kopie dieser Logik mitbringen.
module.exports.dropIfUnused = dropIfUnused;
