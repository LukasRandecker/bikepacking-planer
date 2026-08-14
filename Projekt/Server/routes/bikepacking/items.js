const express = require('express');
const router = express.Router();
const Item = require('../../models/bikepacking/item.js');

/**
 * @swagger
 * components:
 *   schemas:
 *     Item:
 *       type: object
 *       required:
 *         - Categorie
 *         - Itemname
 *         - Price
 *         - Weight
 *       properties:
 *         Categorie:
 *           type: string
 *           description: The category of the item
 *         IMG:
 *           type: string
 *           description: Image URL of the item
 *         Itemname:
 *           type: string
 *           description: Name of the item
 *         Link:
 *           type: string
 *           description: Link to the item
 *         Weight:
 *           type: number
 *           description: Weight of the item
 *         Price:
 *           type: number
 *           description: Price of the item
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
 *   post:
 *     summary: Create a new Item
 *     tags: [Items]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/Item'
 *     responses:
 *       201:
 *         description: Item successfully created
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Item'
 *       400:
 *         description: Bad Request
 */
router.post('/', async (req, res) => {
  try {
    const item = new Item(req.body);
    const savedItem = await item.save();
    res.status(201).json(savedItem);
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
});

/**
 * @swagger
 * /bikepacking/items:
 *   get:
 *     summary: Get all Items
 *     tags: [Items]
 *     responses:
 *       200:
 *         description: List of Items
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/Item'
 */
router.get('/', async (req, res) => {
  try {
    const items = await Item.find();
    res.json(items);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

/**
 * @swagger
 * /bikepacking/items/{id}:
 *   get:
 *     summary: Get an Item by ID
 *     tags: [Items]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Item ID
 *     responses:
 *       200:
 *         description: Item found
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Item'
 *       404:
 *         description: Item not found
 */
router.get('/:id', async (req, res) => {
  try {
    const item = await Item.findById(req.params.id);
    if (!item) return res.status(404).json({ message: 'Item not found' });
    res.json(item);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

/**
 * @swagger
 * /bikepacking/items/{id}:
 *   put:
 *     summary: Update item name, price and weight
 *     description: Updates only Itemname, Price and Weight. Other fields like IMG or Link remain unchanged.
 *     tags: [Items]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Item ID
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - Itemname
 *               - Price
 *               - Weight
 *             properties:
 *               Itemname:
 *                 type: string
 *                 example: "Zelt"
 *               Price:
 *                 type: number
 *                 example: 199.99
 *               Weight:
 *                 type: number
 *                 example: 1200
 *     responses:
 *       200:
 *         description: Item successfully updated
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Item'
 *       400:
 *         description: Bad Request
 *       404:
 *         description: Item not found
 */
router.put('/:id', async (req, res) => {
  try {
    const { Itemname, Price, Weight } = req.body;

    // 🔒 Explizite Validierung
    if (
      Itemname === undefined ||
      Price === undefined ||
      Weight === undefined
    ) {
      return res.status(400).json({
        message: 'Itemname, Price and Weight are required'
      });
    }

    const updatedItem = await Item.findByIdAndUpdate(
      req.params.id,
      {
        $set: {
          Itemname,
          Price,
          Weight
        }
      },
      {
        new: true,
        runValidators: true
      }
    );

    if (!updatedItem) {
      return res.status(404).json({ message: 'Item not found' });
    }

    res.json(updatedItem);
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
});



/**
 * @swagger
 * /bikepacking/items/{id}:
 *   delete:
 *     summary: Delete an Item by ID
 *     tags: [Items]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Item ID
 *     responses:
 *       200:
 *         description: Item deleted
 *       404:
 *         description: Item not found
 */
router.delete('/:id', async (req, res) => {
  try {
    const deletedItem = await Item.findByIdAndDelete(req.params.id);
    if (!deletedItem) return res.status(404).json({ message: 'Item not found' });
    res.json({ message: 'Item deleted' });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});



module.exports = router;