const mongoose = require('mongoose');

/**
 * Eine Tour.
 *
 * Auf der Startseite ist eine Tour ein öffentlicher Eintrag: sie zeigt ihre
 * Route, ihre Eckdaten und die Packliste, mit der sie gefahren wurde. Dafür
 * hängt an ihr genau eine Itemlist — ohne die gäbe es auf der Detailseite
 * nichts zu sehen außer der Linie auf der Karte.
 *
 * Distance/Elevation werden beim Speichern aus der GPX-Datei übernommen, damit
 * der Feed nicht für jede Kachel eine GPX-Datei parsen muss.
 */
const tourSchema = new mongoose.Schema({
  Name: { type: String, required: true },
  StartDate: { type: Date, required: true },
  EndDate: { type: Date, required: true },
  Biketype: {
    type: String,
    enum: ['MTB', 'ROAD', 'GRAVEL'],
    required: true
  },
  Setupstyle: {
    type: String,
    enum: ['OUTDOOR', 'INDOOR', 'MIXED'],
    required: true
  },
  Type: {
    type: String,
    enum: ['BIKEPACKING', 'RACE'],
    required: true
  },
  Mode: {
    type: String,
    enum: ['SOLO', 'GROUP'],
    required: true
  },
  GPX_file: { type: String, required: false },

  // Die Packliste, mit der diese Tour gefahren wurde.
  Itemlist: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Itemlist',
    required: false,
    default: null
  },

  // Wer die Tour eingestellt hat. Auf der Plattform steht der Name an der Tour.
  Owner: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: false,
    default: null
  },
  Author: { type: String, required: false, default: '' },

  Description: { type: String, required: false, default: '' },
  Cover: { type: String, required: false, default: '' },

  // Aus der GPX-Datei übernommen, in km bzw. Höhenmetern.
  Distance: { type: Number, required: false, default: 0, min: 0 },
  Elevation: { type: Number, required: false, default: 0, min: 0 },

  // Nur öffentliche Touren erscheinen im Feed der Startseite.
  Public: { type: Boolean, required: false, default: false }
}, { timestamps: false });

// Der Feed sortiert zeitlich; ein Index darauf hält das billig.
tourSchema.index({ Public: 1, StartDate: -1 });

module.exports = mongoose.model('Tour', tourSchema);
