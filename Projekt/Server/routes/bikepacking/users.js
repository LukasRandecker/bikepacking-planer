const express = require('express');
const router = express.Router();
const User = require('../../models/bikepacking/user.js');

/**
 * @swagger
 * components:
 *   schemas:
 *     User:
 *       type: object
 *       required:
 *         - username
 *         - pw
 *       properties:
 *         username:
 *           type: string
 *           description: Username of the user
 *         pw:
 *           type: string
 *           description: User password
 *         tours:
 *           type: array
 *           description: Array of Tour IDs
 *           items:
 *             type: string
 *             format: mongoObjectId
 *         itemlists:
 *           type: array
 *           description: Array of Itemlist IDs
 *           items:
 *             type: string
 *             format: mongoObjectId
 */

/**
 * @swagger
 * tags:
 *   name: Users
 *   description: User management
 */

/**
 * @swagger
 * /bikepacking/users:
 *   post:
 *     summary: Create a new User
 *     tags: [Users]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/User'
 *     responses:
 *       201:
 *         description: User successfully created
 *       400:
 *         description: Bad Request
 */
router.post('/', async (req, res) => {
  try {
    const user = new User(req.body);
    const savedUser = await user.save();
    res.status(201).json(savedUser);
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
});

/**
 * @swagger
 * /bikepacking/users:
 *   get:
 *     summary: Get all Users
 *     tags: [Users]
 *     responses:
 *       200:
 *         description: List of Users
 */
router.get('/', async (req, res) => {
  try {
    const users = await User.find();
    res.json(users);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

/**
 * @swagger
 * /bikepacking/users/{id}:
 *   get:
 *     summary: Get a User by ID
 *     tags: [Users]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: User found
 *       404:
 *         description: User not found
 */
router.get('/:id', async (req, res) => {
  try {
    const user = await User.findById(req.params.id);
    if (!user) return res.status(404).json({ message: 'User not found' });
    res.json(user);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

/**
 * @swagger
 * /bikepacking/users/username/{username}:
 *   get:
 *     summary: Get a User by username
 *     tags: [Users]
 *     parameters:
 *       - in: path
 *         name: username
 *         required: true
 *         schema:
 *           type: string
 *         description: Username of the user
 *     responses:
 *       200:
 *         description: User found
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/User'
 *       404:
 *         description: User not found
 */
router.get('/username/:username', async (req, res) => {
  try {
    const user = await User.findOne({ username: req.params.username });

    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    res.json(user);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

/**
 * @swagger
 * /bikepacking/users/{id}/addTours:
 *   put:
 *     summary: Add new Tour IDs to a User
 *     tags: [Users]
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
 *             type: object
 *             properties:
 *               tourIds:
 *                 type: array
 *                 items:
 *                   type: string
 *             required:
 *               - tourIds
 *     responses:
 *       200:
 *         description: Tours successfully added
 *       404:
 *         description: User not found
 */
router.put('/:id/addTours', async (req, res) => {
  try {
    const { tourIds } = req.body;

    if (!Array.isArray(tourIds)) {
      return res.status(400).json({ message: "tourIds muss ein Array sein" });
    }

    const updatedUser = await User.findByIdAndUpdate(
      req.params.id,
      { $addToSet: { tours: { $each: tourIds } } }, // fügt nur neue hinzu, keine Duplikate
      { new: true, runValidators: true }
    );

    if (!updatedUser) return res.status(404).json({ message: "User not found" });

    res.json(updatedUser);
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
});

/**
 * @swagger
 * /bikepacking/users/{id}/addItemlists:
 *   put:
 *     summary: Add new Itemlist IDs to a User
 *     tags: [Users]
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
 *             type: object
 *             properties:
 *               itemlistIds:
 *                 type: array
 *                 items:
 *                   type: string
 *             required:
 *               - itemlistIds
 *     responses:
 *       200:
 *         description: Itemlists successfully added
 *       404:
 *         description: User not found
 */
router.put('/:id/addItemlists', async (req, res) => {
  try {
    const { itemlistIds } = req.body;

    if (!Array.isArray(itemlistIds)) {
      return res.status(400).json({ message: "itemlistIds muss ein Array sein" });
    }

    const updatedUser = await User.findByIdAndUpdate(
      req.params.id,
      { $addToSet: { itemlists: { $each: itemlistIds } } }, // nur neue hinzufügen
      { new: true, runValidators: true }
    );

    if (!updatedUser) return res.status(404).json({ message: "User not found" });

    res.json(updatedUser);
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
});


/**
 * @swagger
 * /bikepacking/users/{id}:
 *   delete:
 *     summary: Delete a User by ID
 *     tags: [Users]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: User deleted
 *       404:
 *         description: User not found
 */
router.delete('/:id', async (req, res) => {
  try {
    const deletedUser = await User.findByIdAndDelete(req.params.id);
    if (!deletedUser) return res.status(404).json({ message: 'User not found' });
    res.json({ message: 'User deleted' });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

module.exports = router;
