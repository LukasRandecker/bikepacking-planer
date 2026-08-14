const mongoose = require('mongoose');

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
  GPX_file: { type: String, required: false }
}, { timestamps: false });

module.exports = mongoose.model('Tour', tourSchema);
