const express = require('express');
const mongoose = require('mongoose');
const router = express.Router();
const Itemlist = require('../../models/bikepacking/itemlist.js');
const Item = require('../../models/bikepacking/item.js');
const Tour = require('../../models/bikepacking/tour.js');
const User = require('../../models/bikepacking/user.js');
const verifyToken = require('../session/verifyToken.js');

const MAX_NAME = 120;
const MAX_ITEMS = 300;

/**
 * Lädt die Items einer Liste in der Reihenfolge, in der sie in der Liste
 * stehen. `items` hält Ids als Strings, deshalb kein populate, sondern ein
 * $in und Nachsortieren.
 */
async function loadItems(list) {
  const ids = (list.items || []).filter((id) => mongoose.isValidObjectId(id));
  if (ids.length === 0) return [];

  const found = await Item.find({ _id: { $in: ids } });
  const byId = new Map(found.map((item) => [String(item._id), item]));
  return ids.map((id) => byId.get(String(id))).filter(Boolean);
}

/** Prüft Name und Item-Ids einer Liste. */
function validateList(body, { partial = false } = {}) {
  const errors = [];
  const value = {};

  if (body.Name !== undefined) {
    const name = typeof body.Name === 'string' ? body.Name.trim() : '';
    if (!name) errors.push('Name is required.');
    else if (name.length > MAX_NAME) errors.push(`Name must be at most ${MAX_NAME} characters.`);
    else value.Name = name;
  } else if (!partial) {
    errors.push('Name is required.');
  }

  if (body.items !== undefined) {
    if (!Array.isArray(body.items)) {
      errors.push('items must be an array of item ids.');
    } else if (body.items.length > MAX_ITEMS) {
      errors.push(`A packlist can hold at most ${MAX_ITEMS} items.`);
    } else if (!body.items.every((id) => mongoose.isValidObjectId(id))) {
      errors.push('items must contain valid item ids only.');
    } else {
      value.items = body.items.map(String);
    }
  } else if (!partial) {
    value.items = [];
  }

  return { errors, value };
}

/**
 * Lädt eine Liste und stellt sicher, dass sie am Konto des Anfragenden hängt.
 * Listen kennen ihren Besitzer nicht selbst — die Verbindung steht am Konto.
 */
async function ownList(userId, listId, res) {
  if (!mongoose.isValidObjectId(listId)) {
    res.status(400).json({ message: 'Invalid itemlist id.' });
    return null;
  }

  const user = await User.findById(userId);
  const owns = user && (user.itemlists || []).some((id) => String(id) === String(listId));

  const list = owns ? await Itemlist.findById(listId) : null;
  if (!list) {
    // Gleiche Antwort für "gibt es nicht" und "gehört dir nicht".
    res.status(404).json({ message: 'Itemlist not found' });
    return null;
  }

  return list;
}

/**
 * Darf der Anfragende diese Liste lesen? Die eigene immer — eine fremde nur,
 * wenn sie an einer veröffentlichten Tour hängt und damit ohnehin auf der
 * Tourseite steht.
 */
async function mayRead(req, listId) {
  if (req.user) {
    const user = await User.findById(req.user.id);
    if (user && (user.itemlists || []).some((id) => String(id) === String(listId))) {
      return true;
    }
  }
  return Boolean(await Tour.exists({ Itemlist: listId, Public: true }));
}

/**
 * @swagger
 * components:
 *   schemas:
 *     Itemlist:
 *       type: object
 *       required: [Name, items]
 *       properties:
 *         Name:
 *           type: string
 *         items:
 *           type: array
 *           description: Item-Ids
 *           items:
 *             type: string
 */

/**
 * @swagger
 * tags:
 *   name: Itemlist
 *   description: Packlisten
 */

/**
 * @swagger
 * /bikepacking/itemlists:
 *   post:
 *     summary: Eine Packliste anlegen
 *     description: Die Liste wird direkt mit dem eingeloggten Konto verknüpft.
 *     tags: [Itemlist]
 *     responses:
 *       201:
 *         description: Angelegt
 *       400:
 *         description: Bad Request
 *       401:
 *         description: Nicht eingeloggt
 */
router.post('/', verifyToken, async (req, res) => {
  try {
    const { errors, value } = validateList(req.body);
    if (errors.length) return res.status(400).json({ message: errors.join(' ') });

    const itemlist = await Itemlist.create(value);
    await User.findByIdAndUpdate(req.user.id, { $addToSet: { itemlists: itemlist._id } });

    res.status(201).json(itemlist);
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
});

/**
 * @swagger
 * /bikepacking/itemlists/mine:
 *   get:
 *     summary: Die eigenen Packlisten
 *     tags: [Itemlist]
 *     responses:
 *       200:
 *         description: Listen des eingeloggten Kontos
 *       401:
 *         description: Nicht eingeloggt
 */
router.get('/mine', verifyToken, async (req, res) => {
  try {
    const user = await User.findById(req.user.id);
    if (!user) return res.status(404).json({ message: 'User not found' });

    const lists = await Itemlist.find({ _id: { $in: user.itemlists || [] } }).lean();
    res.json(
      lists.map((list) => ({
        _id: list._id,
        Name: list.Name || '',
        itemCount: (list.items || []).length
      }))
    );
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

/**
 * @swagger
 * /bikepacking/itemlists/add-item:
 *   put:
 *     summary: Ein Item an eine eigene Liste hängen
 *     description: >
 *       Gegenstück zu remove-item. `replaces` tauscht ein bestehendes Item an
 *       Ort und Stelle aus — das braucht der Fork eines Katalog-Items.
 *     tags: [Itemlist]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               listId:
 *                 type: string
 *               itemId:
 *                 type: string
 *               replaces:
 *                 type: string
 *     responses:
 *       200:
 *         description: Aktualisierte Liste
 *       404:
 *         description: List or item not found
 */
router.put('/add-item', verifyToken, async (req, res) => {
  const { listId, itemId, replaces } = req.body;

  try {
    if (!mongoose.isValidObjectId(itemId)) {
      return res.status(400).json({ message: 'itemId must be a valid id.' });
    }

    const list = await ownList(req.user.id, listId, res);
    if (!list) return;

    const item = await Item.findById(itemId);
    if (!item) return res.status(404).json({ message: 'Item not found' });

    if (list.items.length >= MAX_ITEMS) {
      return res.status(400).json({ message: `A packlist can hold at most ${MAX_ITEMS} items.` });
    }

    const at = replaces ? list.items.indexOf(String(replaces)) : -1;
    if (at !== -1) {
      list.items.splice(at, 1, String(itemId));
    } else if (!list.items.includes(String(itemId))) {
      list.items.push(String(itemId));
    }

    const updatedList = await list.save();
    res.json(updatedList);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

/**
 * @swagger
 * /bikepacking/itemlists/remove-item:
 *   delete:
 *     summary: Ein Item aus einer eigenen Liste nehmen
 *     tags: [Itemlist]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               listId:
 *                 type: string
 *               itemId:
 *                 type: string
 *     responses:
 *       200:
 *         description: Aktualisierte Liste
 *       404:
 *         description: List or item not found
 */
router.delete('/remove-item', verifyToken, async (req, res) => {
  const { listId, itemId } = req.body;

  try {
    if (!mongoose.isValidObjectId(itemId)) {
      return res.status(400).json({ message: 'itemId must be a valid id.' });
    }

    const list = await ownList(req.user.id, listId, res);
    if (!list) return;

    const index = list.items.indexOf(String(itemId));
    if (index === -1) return res.status(404).json({ message: 'Item not found in list' });

    list.items.splice(index, 1);
    const updatedList = await list.save();

    res.json(updatedList);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

/**
 * @swagger
 * /bikepacking/itemlists/{id}/items:
 *   get:
 *     summary: Eine Liste samt ausgeschriebener Items
 *     description: >
 *       Die eigene Liste immer; eine fremde nur, wenn sie an einer
 *       veröffentlichten Tour hängt.
 *     tags: [Itemlist]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Liste mit Items und Summen
 *       404:
 *         description: Itemlist not found
 */
router.get('/:id/items', verifyToken.optionalToken, async (req, res) => {
  try {
    if (!mongoose.isValidObjectId(req.params.id)) {
      return res.status(400).json({ message: 'Invalid itemlist id.' });
    }
    if (!(await mayRead(req, req.params.id))) {
      return res.status(404).json({ message: 'Itemlist not found' });
    }

    const list = await Itemlist.findById(req.params.id);
    if (!list) return res.status(404).json({ message: 'Itemlist not found' });

    const items = await loadItems(list);

    res.json({
      _id: list._id,
      Name: list.Name || '',
      items,
      totalWeight: items.reduce((sum, i) => sum + (i.Weight || 0), 0),
      totalPrice: items.reduce((sum, i) => sum + (i.Price || 0), 0)
    });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

/**
 * @swagger
 * /bikepacking/itemlists/{id}:
 *   get:
 *     summary: Eine Liste holen
 *     tags: [Itemlist]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Itemlist
 *       404:
 *         description: Itemlist not found
 */
router.get('/:id', verifyToken.optionalToken, async (req, res) => {
  try {
    if (!mongoose.isValidObjectId(req.params.id)) {
      return res.status(400).json({ message: 'Invalid itemlist id.' });
    }
    if (!(await mayRead(req, req.params.id))) {
      return res.status(404).json({ message: 'Itemlist not found' });
    }

    const itemlist = await Itemlist.findById(req.params.id);
    if (!itemlist) return res.status(404).json({ message: 'Itemlist not found' });
    res.json(itemlist);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

/**
 * @swagger
 * /bikepacking/itemlists/{id}:
 *   put:
 *     summary: Eine eigene Liste ändern
 *     tags: [Itemlist]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Geändert
 *       404:
 *         description: Itemlist not found
 */
router.put('/:id', verifyToken, async (req, res) => {
  try {
    const list = await ownList(req.user.id, req.params.id, res);
    if (!list) return;

    const { errors, value } = validateList(req.body, { partial: true });
    if (errors.length) return res.status(400).json({ message: errors.join(' ') });

    Object.assign(list, value);
    const saved = await list.save();
    res.json(saved);
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
});

/**
 * @swagger
 * /bikepacking/itemlists/{id}:
 *   delete:
 *     summary: Eine eigene Liste löschen
 *     tags: [Itemlist]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Gelöscht
 *       404:
 *         description: Itemlist not found
 */
router.delete('/:id', verifyToken, async (req, res) => {
  try {
    const list = await ownList(req.user.id, req.params.id, res);
    if (!list) return;

    await list.deleteOne();
    await User.findByIdAndUpdate(req.user.id, { $pull: { itemlists: list._id } });
    // Touren, die daran hingen, verlieren ihre Liste — und damit das Recht,
    // öffentlich zu stehen.
    await Tour.updateMany({ Itemlist: list._id }, { $set: { Itemlist: null, Public: false } });

    res.json({ message: 'Itemlist deleted' });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

/*
 * Entfallen: GET /itemlists — lieferte jede Packliste jedes Kontos aus.
 * Die eigenen stehen unter /mine.
 */

module.exports = router;
