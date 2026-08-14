const express = require('express');
const router = express.Router();
const Itemlist = require('../../models/bikepacking/itemlist.js');

/**
 * @swagger
 * components:
 *   schemas:
 *     Itemlist:
 *       type: object
 *       required:
 *         - Name
 *         - items
 *       properties:
 *         Name:
 *           type: string
 *           description: Name of the item list
 *         items:
 *           type: array
 *           description: Array of Item IDs
 *           items:
 *             type: string
 *             format: mongoObjectId
 */

/**
 * @swagger
 * tags:
 *   name: Itemlist
 *   description: Item list management
 */

/**
 * @swagger
 * /bikepacking/itemlists:
 *   post:
 *     summary: Create a new Itemlist
 *     tags: [Itemlist]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/Itemlist'
 *     responses:
 *       201:
 *         description: Itemlist successfully created
 *       400:
 *         description: Bad Request
 */
router.post('/', async (req, res) => {
  try {
    const itemlist = new Itemlist(req.body);
    const savedItemlist = await itemlist.save();
    res.status(201).json(savedItemlist);
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
});

/**
 * @swagger
 * /bikepacking/itemlists:
 *   get:
 *     summary: Get all Itemlist
 *     tags: [Itemlist]
 *     responses:
 *       200:
 *         description: List of Itemlist
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/Itemlist'
 */
router.get('/', async (req, res) => {
  try {
    const itemlists = await Itemlist.find();
    res.json(itemlists);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

/**
 * @swagger
 * /bikepacking/itemlists/{id}:
 *   get:
 *     summary: Get an Itemlist by ID
 *     tags: [Itemlist]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Itemlist found
 *       404:
 *         description: Itemlist not found
 */
router.get('/:id', async (req, res) => {
  try {
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
 *     summary: Update an Itemlist by ID
 *     tags: [Itemlist]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/Itemlist'
 *     responses:
 *       200:
 *         description: Itemlist successfully updated
 *       404:
 *         description: Itemlist not found
 */
router.put('/:id', async (req, res) => {
  try {
    const updatedItemlist = await Itemlist.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true, runValidators: true }
    );

    if (!updatedItemlist) {
      return res.status(404).json({ message: 'Itemlist not found' });
    }

    res.json(updatedItemlist);
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
});


/**   
 * @swagger
 * /bikepacking/itemlists/remove-item:
 *   delete:
 *     summary: Remove an item from a list by IDs
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
 *                 description: ID of the list
 *                 example: "694921f8ac72558a19b71247"
 *               itemId:
 *                 type: string
 *                 description: ID of the item to remove
 *                 example: "6957d72c027b5f1820a01728"
 *     responses:
 *       200:
 *         description: Item removed successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 _id:
 *                   type: string
 *                 name:
 *                   type: string
 *                 items:
 *                   type: array
 *                   items:
 *                     type: string
 *       404:
 *         description: List or item not found
 *       500:
 *         description: Server error
 */
router.delete('/remove-item', async (req, res) => {
  const { listId, itemId } = req.body;

  try {
    const list = await Itemlist.findById(listId);
    if (!list) return res.status(404).json({ message: 'List not found' });

    const index = list.items.indexOf(itemId);
    if (index === -1) return res.status(404).json({ message: 'Item not found in list' });

    list.items.splice(index, 1); // Item aus dem Array löschen
    const updatedList = await list.save();

    res.json(updatedList); // gesamte aktualisierte Liste zurückgeben
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});


/**
 * @swagger
 * /bikepacking/itemlists/{id}:
 *   delete:
 *     summary: Delete an Itemlist by ID
 *     tags: [Itemlist]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Itemlist deleted
 *       404:
 *         description: Itemlist not found
 */
router.delete('/:id', async (req, res) => {
  try {
    const deletedItemlist = await Itemlist.findByIdAndDelete(req.params.id);
    if (!deletedItemlist) return res.status(404).json({ message: 'Itemlist not found' });
    res.json({ message: 'Itemlist deleted' });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});


module.exports = router;
