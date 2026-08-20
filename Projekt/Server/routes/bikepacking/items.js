const express = require('express');
const mongoose = require('mongoose');
const router = express.Router();
const Item = require('../../models/bikepacking/item.js');
const { SHARED_SOURCES } = Item;
const verifyToken = require('../session/verifyToken.js');

// Die sechs Kategorien, die die Packliste im Frontend zeichnet. Alles andere
// wird abgelehnt, damit kein Item in einer Kategorie landet, die nie gerendert
// wird und damit unsichtbar bleibt.
const CATEGORIES = [
  'Bike and Bags',
  'Camping Gear',
  'Clothing',
  'Hygiene',
  'Tools',
  'Other'
];

const MAX_NAME = 120;
const MAX_BRAND = 60;
const MAX_KEYWORDS = 300;
const MAX_LINK = 500;
const MAX_QUERY = 80;

/** Für den Regex-Teil der Suche: Nutzereingabe ist kein Muster. */
const escapeRegex = (s) => s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

/**
 * Prüft den Rumpf eines Items. Gibt { errors, value } zurück; `value` enthält
 * nur die Felder, die durchkommen dürfen — kein Durchreichen von req.body,
 * sonst setzt sich der Client sein eigenes `Source` oder `Owner`.
 */
function validateItem(body, { partial = false } = {}) {
  const errors = [];
  const value = {};

  if (!partial || body.Itemname !== undefined) {
    const name = typeof body.Itemname === 'string' ? body.Itemname.trim() : '';
    if (!name) errors.push('Itemname is required.');
    else if (name.length > MAX_NAME) errors.push(`Itemname must be at most ${MAX_NAME} characters.`);
    else value.Itemname = name;
  }

  if (!partial || body.Categorie !== undefined) {
    const cat = typeof body.Categorie === 'string' ? body.Categorie.trim() : '';
    if (!CATEGORIES.includes(cat)) {
      errors.push(`Categorie must be one of: ${CATEGORIES.join(', ')}.`);
    } else {
      value.Categorie = cat;
    }
  }

  for (const key of ['Weight', 'Price']) {
    if (body[key] === undefined || body[key] === '') {
      if (!partial) value[key] = 0;
      continue;
    }
    const n = Number(body[key]);
    if (!Number.isFinite(n) || n < 0) errors.push(`${key} must be a number of at least 0.`);
    else value[key] = n;
  }

  if (body.Link !== undefined) {
    const link = typeof body.Link === 'string' ? body.Link.trim() : '';
    if (!link) {
      value.Link = '';
    } else if (link.length > MAX_LINK || !/^https?:\/\//i.test(link)) {
      errors.push('Link must be an http(s) URL.');
    } else {
      value.Link = link;
    }
  }

  if (body.Brand !== undefined) {
    const brand = typeof body.Brand === 'string' ? body.Brand.trim() : '';
    if (brand.length > MAX_BRAND) errors.push(`Brand must be at most ${MAX_BRAND} characters.`);
    else value.Brand = brand;
  }

  if (body.Keywords !== undefined) {
    const keywords = typeof body.Keywords === 'string' ? body.Keywords.trim() : '';
    if (keywords.length > MAX_KEYWORDS) {
      errors.push(`Keywords must be at most ${MAX_KEYWORDS} characters.`);
    } else {
      value.Keywords = keywords;
    }
  }

  if (body.IMG !== undefined) {
    const img = typeof body.IMG === 'string' ? body.IMG.trim() : '';
    // Nur serverseitig erzeugte Uploadpfade, keine fremden URLs.
    if (img && !img.startsWith('/images/')) errors.push('IMG must be an uploaded image path.');
    else value.IMG = img;
  }

  // `Owner` steht bewusst nicht in dieser Liste: wem ein Item gehört, sagt
  // der Token, nicht der Client.

  return { errors, value };
}

/**
 * @swagger
 * components:
 *   schemas:
 *     Item:
 *       type: object
 *       required: [Categorie, Itemname]
 *       properties:
 *         Categorie:
 *           type: string
 *           enum: [Bike and Bags, Camping Gear, Clothing, Hygiene, Tools, Other]
 *         IMG:
 *           type: string
 *           description: Uploadpfad, leer wenn kein Bild hinterlegt ist
 *         Itemname:
 *           type: string
 *         Link:
 *           type: string
 *         Weight:
 *           type: number
 *           description: Gewicht in Gramm
 *         Price:
 *           type: number
 *           description: Preis in Euro, 0 = unbekannt
 *         Section:
 *           type: string
 *           description: Herkunftsabschnitt im Katalog
 *         Source:
 *           type: string
 *           enum: [CATALOG, USER]
 *         Owner:
 *           type: string
 *           description: User-Id bei selbst angelegten Items
 */

/**
 * @swagger
 * tags:
 *   name: Items
 *   description: Item management
 */

/**
 * @swagger
 * /bikepacking/items:
 *   get:
 *     summary: Katalog durchsuchen und filtern
 *     tags: [Items]
 *     parameters:
 *       - in: query
 *         name: q
 *         schema:
 *           type: string
 *         description: Volltext über Itemname und Section
 *       - in: query
 *         name: category
 *         schema:
 *           type: string
 *       - in: query
 *         name: source
 *         schema:
 *           type: string
 *           enum: [CATALOG, USER, ALL]
 *         description: >
 *           Standard CATALOG. USER und ALL liefern zusätzlich die eigenen
 *           Items des eingeloggten Kontos — nie die fremder Konten.
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 40
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *           default: 1
 *     responses:
 *       200:
 *         description: Treffer mit Gesamtzahl
 *       400:
 *         description: Ungültige Suchparameter
 */
router.get('/', verifyToken.optionalToken, async (req, res) => {
  try {
    const { q, category, source = 'CATALOG' } = req.query;
    // Eigene Items sieht nur, wer eingeloggt ist — und nur die eigenen.
    const owner = req.user ? req.user.id : undefined;

    const limit = Math.min(Math.max(parseInt(req.query.limit, 10) || 40, 1), 100);
    const page = Math.max(parseInt(req.query.page, 10) || 1, 1);

    if (q !== undefined && (typeof q !== 'string' || q.length > MAX_QUERY)) {
      return res.status(400).json({
        message: `q must be a string of at most ${MAX_QUERY} characters.`
      });
    }
    if (category !== undefined && !CATEGORIES.includes(category)) {
      return res.status(400).json({
        message: `category must be one of: ${CATEGORIES.join(', ')}.`
      });
    }
    if (!['CATALOG', 'USER', 'ALL'].includes(source)) {
      return res.status(400).json({ message: 'source must be CATALOG, USER or ALL.' });
    }

    // Geteilt ist geteilt: der Grundkatalog und alles, was Nutzer beigesteuert
    // haben, ist für jeden sichtbar. Persönliche Kopien (PRIVATE) sieht nur,
    // wem sie gehören — eine angepasste Dublette ist kein Katalogeintrag.
    const visibility = [];
    if (source === 'CATALOG' || source === 'ALL') {
      visibility.push({ Source: { $in: SHARED_SOURCES } });
    }
    if (source === 'USER') {
      if (!owner) return res.json({ total: 0, page, limit, items: [] });
      visibility.push({ Owner: owner });
    }
    if (source === 'ALL' && owner) {
      visibility.push({ Owner: owner });
    }
    if (visibility.length === 0) {
      return res.json({ total: 0, page, limit, items: [] });
    }

    const filter = { $and: [{ $or: visibility }] };
    if (category) filter.$and.push({ Categorie: category });
    if (q && q.trim()) {
      const rx = new RegExp(escapeRegex(q.trim()), 'i');
      filter.$and.push({
        $or: [{ Itemname: rx }, { Brand: rx }, { Section: rx }, { Keywords: rx }]
      });
    }

    const [items, total] = await Promise.all([
      Item.find(filter)
        .sort({ Itemname: 1 })
        .skip((page - 1) * limit)
        .limit(limit),
      Item.countDocuments(filter)
    ]);

    res.json({ total, page, limit, items });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

/**
 * @swagger
 * /bikepacking/items/brands:
 *   get:
 *     summary: Die Marken, die im Katalog vorkommen
 *     description: >
 *       Füttert die Vorschlagsliste im Anlegen-Formular. Damit tippt niemand
 *       "Gore Wear", "GoreWear" und "gore wear" als drei Marken ein.
 *     tags: [Items]
 *     responses:
 *       200:
 *         description: Alphabetische Markenliste mit Anzahl
 */
router.get('/brands', verifyToken.optionalToken, async (req, res) => {
  try {
    const visibility = [{ Source: { $in: SHARED_SOURCES } }];
    if (req.user) visibility.push({ Owner: req.user.id });

    const brands = await Item.aggregate([
      { $match: { $or: visibility, Brand: { $nin: ['', null] } } },
      { $group: { _id: '$Brand', count: { $sum: 1 } } },
      { $sort: { _id: 1 } }
    ]);

    res.json(brands.map((b) => ({ brand: b._id, count: b.count })));
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

/**
 * @swagger
 * /bikepacking/items:
 *   post:
 *     summary: Eigenes Item anlegen
 *     description: Legt immer ein USER-Item an. Katalogeinträge entstehen nur über den Seed.
 *     tags: [Items]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/Item'
 *     responses:
 *       201:
 *         description: Item angelegt
 *       400:
 *         description: Bad Request
 */
router.post('/', verifyToken, async (req, res) => {
  try {
    const { errors, value } = validateItem(req.body);
    if (errors.length) return res.status(400).json({ message: errors.join(' ') });

    // Selbst angelegte Items gehen in den gemeinsamen Katalog: was einer
    // vermisst hat, vermissen andere auch. Wer es beigesteuert hat, steht in
    // `Owner` und ist der Einzige, der es später ändern kann.
    const item = new Item({ ...value, Source: 'COMMUNITY', Owner: req.user.id });
    const savedItem = await item.save();
    res.status(201).json(savedItem);
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
});

/**
 * @swagger
 * /bikepacking/items/{id}:
 *   get:
 *     summary: Ein Item über seine Id holen
 *     tags: [Items]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Item gefunden
 *       404:
 *         description: Item not found
 */
router.get('/:id', verifyToken.optionalToken, async (req, res) => {
  try {
    if (!mongoose.isValidObjectId(req.params.id)) {
      return res.status(400).json({ message: 'Invalid item id.' });
    }
    const item = await Item.findById(req.params.id);
    if (!item) return res.status(404).json({ message: 'Item not found' });

    // Katalog und beigesteuerte Einträge sind öffentlich; persönliche Kopien
    // gehören nur ihrem Konto.
    const mine = req.user && String(item.Owner) === req.user.id;
    if (!SHARED_SOURCES.includes(item.Source) && !mine) {
      return res.status(404).json({ message: 'Item not found' });
    }

    res.json(item);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

/**
 * @swagger
 * /bikepacking/items/{id}/fork:
 *   post:
 *     summary: Katalog-Item als eigene Kopie übernehmen
 *     description: >
 *       Katalogeinträge sind geteilte Daten und werden nicht überschrieben.
 *       Wer Gewicht oder Preis für seine Liste festhalten will, bekommt hier
 *       eine eigene Kopie, die Kategorie, Link, Bild und Herkunft übernimmt.
 *     tags: [Items]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       201:
 *         description: Kopie angelegt
 *       404:
 *         description: Item not found
 */
router.post('/:id/fork', verifyToken, async (req, res) => {
  try {
    if (!mongoose.isValidObjectId(req.params.id)) {
      return res.status(400).json({ message: 'Invalid item id.' });
    }
    const source = await Item.findById(req.params.id);
    if (!source) return res.status(404).json({ message: 'Item not found' });

    const { errors, value } = validateItem(req.body, { partial: true });
    if (errors.length) return res.status(400).json({ message: errors.join(' ') });

    const copy = new Item({
      Categorie: source.Categorie,
      IMG: source.IMG,
      Itemname: source.Itemname,
      Brand: source.Brand,
      Link: source.Link,
      Weight: source.Weight,
      Price: source.Price,
      Section: source.Section,
      Keywords: source.Keywords,
      ...value,
      // Eine angepasste Kopie ist kein Katalogeintrag, sondern eine Notiz für
      // die eigene Liste — sonst stünde jedes Item bald fünfmal im Katalog.
      Source: 'PRIVATE',
      Owner: req.user.id
    });

    const saved = await copy.save();
    res.status(201).json(saved);
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
});

/**
 * @swagger
 * /bikepacking/items/{id}:
 *   put:
 *     summary: Name, Preis und Gewicht eines eigenen Items ändern
 *     description: >
 *       Nur USER-Items. Katalogeinträge sind geteilt und werden mit 409
 *       abgelehnt — dafür gibt es /fork.
 *     tags: [Items]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Item geändert
 *       400:
 *         description: Bad Request
 *       404:
 *         description: Item not found
 *       409:
 *         description: Katalog-Item, nicht änderbar
 */
router.put('/:id', verifyToken, async (req, res) => {
  try {
    if (!mongoose.isValidObjectId(req.params.id)) {
      return res.status(400).json({ message: 'Invalid item id.' });
    }

    const existing = await Item.findById(req.params.id);
    if (!existing) return res.status(404).json({ message: 'Item not found' });

    if (existing.Source === 'CATALOG') {
      return res.status(409).json({
        message:
          'Catalogue items are shared and cannot be edited. Fork it into your own copy instead.'
      });
    }

    // Beigesteuerte Einträge stehen in fremden Packlisten — ändern darf sie
    // nur, wer sie beigesteuert hat. Für alle anderen gibt es /fork.
    if (String(existing.Owner) !== req.user.id) {
      return existing.Source === 'COMMUNITY'
        ? res.status(409).json({
            message:
              'That item was contributed by someone else. Fork it into your own copy instead.'
          })
        : res.status(404).json({ message: 'Item not found' });
    }

    const { Itemname, Price, Weight } = req.body;
    if (Itemname === undefined || Price === undefined || Weight === undefined) {
      return res.status(400).json({ message: 'Itemname, Price and Weight are required' });
    }

    const { errors, value } = validateItem({ Itemname, Price, Weight }, { partial: true });
    if (errors.length) return res.status(400).json({ message: errors.join(' ') });

    const updatedItem = await Item.findByIdAndUpdate(
      req.params.id,
      { $set: value },
      { new: true, runValidators: true }
    );

    res.json(updatedItem);
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
});

/**
 * @swagger
 * /bikepacking/items/{id}:
 *   delete:
 *     summary: Ein eigenes Item löschen
 *     tags: [Items]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Item gelöscht
 *       404:
 *         description: Item not found
 *       409:
 *         description: Katalog-Item, nicht löschbar
 */
router.delete('/:id', verifyToken, async (req, res) => {
  try {
    if (!mongoose.isValidObjectId(req.params.id)) {
      return res.status(400).json({ message: 'Invalid item id.' });
    }
    const item = await Item.findById(req.params.id);
    if (!item) return res.status(404).json({ message: 'Item not found' });
    if (item.Source === 'CATALOG') {
      return res.status(409).json({
        message: 'Catalogue items are shared and cannot be deleted.'
      });
    }
    if (String(item.Owner) !== req.user.id) {
      return res.status(404).json({ message: 'Item not found' });
    }
    if (item.Source === 'COMMUNITY') {
      // Andere haben den Eintrag womöglich schon auf ihrer Liste.
      const inUse = await require('../../models/bikepacking/itemlist.js').exists({
        items: String(item._id)
      });
      if (inUse) {
        return res.status(409).json({
          message: 'That item is on a packlist already and cannot be removed from the catalogue.'
        });
      }
    }

    await item.deleteOne();
    res.json({ message: 'Item deleted' });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

module.exports = router;
module.exports.CATEGORIES = CATEGORIES;
