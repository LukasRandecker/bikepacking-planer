const mongoose = require('mongoose');

const itemSchema = new mongoose.Schema({
  Categorie: { type: String, required: true },
  IMG: { type: String, required: false },
  Itemname: { type: String, required: true },
  Link: { type: String, required: false },
  Weight: { type: Number, required: false },
  Price: { type: Number, required: true }
}, { timestamps: false });

module.exports = mongoose.model('Item', itemSchema);

