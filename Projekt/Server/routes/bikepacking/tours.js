const express = require('express');
const router = express.Router();
const Tour = require('../../models/bikepacking/tour.js');

/**
 * @swagger
 * components:
 *   schemas:
 *     Tour:
 *       type: object
 *       required:
 *         - Name
 *         - StartDate
 *         - EndDate
 *         - Biketype
 *         - Setupstyle
 *         - Type
 *         - Mode
 *       properties:
 *         Name:
 *           type: string
 *           description: Name of the tour
 *         StartDate:
 *           type: string
 *           format: date
 *           description: Start date of the tour
 *         EndDate:
 *           type: string
 *           format: date
 *           description: End date of the tour
 *         Biketype:
 *           type: string
 *           enum: [MTB, ROAD, GRAVEL]
 *         Setupstyle:
 *           type: string
 *           enum: [OUTDOOR, INDOOR, MIXED]
 *         Type:
 *           type: string
 *           enum: [BIKEPACKING, RACE]
 *         Mode:
 *           type: string
 *           enum: [SOLO, GROUP]
 *         GPX_file:
 *           type: string
 */

/**
 * @swagger
 * tags:
 *   name: Tours
 *   description: Tour management
 */

/**
 * @swagger
 * /bikepacking/tours:
 *   post:
 *     summary: Create a new Tour
 *     tags: [Tours]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/Tour'
 *     responses:
 *       201:
 *         description: Tour successfully created
 *       400:
 *         description: Bad Request
 */
router.post('/', async (req, res) => {
  try {
    const tour = new Tour(req.body);
    const savedTour = await tour.save();
    res.status(201).json(savedTour);
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
});


/**
 * @swagger
 * /bikepacking/tours/find:
 *   post:
 *     summary: Find a Tour by fields and get its ID
 *     tags: [Tours]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - Name
 *               - StartDate
 *               - EndDate
 *               - Biketype
 *               - Setupstyle
 *               - Type
 *               - Mode
 *             properties:
 *               Name:
 *                 type: string
 *               StartDate:
 *                 type: string
 *                 format: date
 *               EndDate:
 *                 type: string
 *                 format: date
 *               Biketype:
 *                 type: string
 *                 enum: [MTB, ROAD, GRAVEL]
 *               Setupstyle:
 *                 type: string
 *                 enum: [OUTDOOR, INDOOR, MIXED]
 *               Type:
 *                 type: string
 *                 enum: [BIKEPACKING, RACE]
 *               Mode:
 *                 type: string
 *                 enum: [SOLO, GROUP]
 *     responses:
 *       200:
 *         description: Tour found, returns its ID
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 tourId:
 *                   type: string
 *       404:
 *         description: Tour not found
 *       400:
 *         description: Bad request
 */
router.post('/find', async (req, res) => {
  try {
    const { Name, StartDate, EndDate, Biketype, Setupstyle, Type, Mode } = req.body;

    // Validierung
    if (!Name || !StartDate || !EndDate || !Biketype || !Setupstyle || !Type || !Mode) {
      return res.status(400).json({ message: "Alle Felder müssen übergeben werden" });
    }

   const tour = await Tour.findOne({
  Name,
  StartDate,
  EndDate,
  Biketype,
  Setupstyle,
  Type,
  Mode
});

if (!tour) return res.status(404).json({ message: "Tour nicht gefunden" });

res.json({ 
  tourId: tour._id,
  StartDate: tour.StartDate ? tour.StartDate.toISOString().split('T')[0] : '',
  EndDate: tour.EndDate ? tour.EndDate.toISOString().split('T')[0] : ''
});
} catch (err) {
    console.error(err);
    res.status(500).json({ message: err.message });
  }
});


/**
 * @swagger
 * /bikepacking/tours:
 *   get:
 *     summary: Get all Tours
 *     tags: [Tours]
 *     responses:
 *       200:
 *         description: List of Tours
 */
router.get('/', async (req, res) => {
  try {
    const tours = await Tour.find();
    res.json(tours);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

/**
 * @swagger
 * /bikepacking/tours/{id}:
 *   get:
 *     summary: Get a Tour by ID
 *     tags: [Tours]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Tour found
 *       404:
 *         description: Tour not found
 */
router.get('/:id', async (req, res) => {
  try {
    const tour = await Tour.findById(req.params.id);
    if (!tour) return res.status(404).json({ message: 'Tour not found' });

    // Datum im Format YYYY-MM-DD für <input type="date">
    const startDate = tour.StartDate ? tour.StartDate.toISOString().split('T')[0] : '';
    const endDate   = tour.EndDate ? tour.EndDate.toISOString().split('T')[0] : '';

    res.json({
      ...tour.toObject(),
      StartDate: startDate,
      EndDate: endDate
    });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});


/**
 * @swagger
 * /bikepacking/tours/{id}:
 *   put:
 *     summary: Update a Tour by ID
 *     tags: [Tours]
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
 *             $ref: '#/components/schemas/Tour'
 *     responses:
 *       200:
 *         description: Tour successfully updated
 *       404:
 *         description: Tour not found
 */
router.put('/:id', async (req, res) => {
  try {
    const updatedTour = await Tour.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true, runValidators: true }
    );

    if (!updatedTour) {
      return res.status(404).json({ message: 'Tour not found' });
    }

    res.json(updatedTour);
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
});

/**
 * @swagger
 * /bikepacking/tours/{id}:
 *   delete:
 *     summary: Delete a Tour by ID
 *     tags: [Tours]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Tour deleted
 *       404:
 *         description: Tour not found
 */
router.delete('/:id', async (req, res) => {
  try {
    const deletedTour = await Tour.findByIdAndDelete(req.params.id);
    if (!deletedTour) return res.status(404).json({ message: 'Tour not found' });
    res.json({ message: 'Tour deleted' });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

module.exports = router;
