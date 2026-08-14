const mongoose = require('mongoose');

const itemlistSchema = new mongoose.Schema({
  Name: {
    type: String,
    required: false
  },

  items: [{
    type: String,
    ref: 'Item',
    required: true
  }]
}, { timestamps: false });

module.exports = mongoose.model('Itemlist', itemlistSchema);
