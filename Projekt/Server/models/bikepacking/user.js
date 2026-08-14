const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
  username: {
    type: String,
    required: true,
    unique: true
  },

  pw: {
    type: String,
    required: true
  },

  tours: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Tour',
    required: false,
    default: []
  }],

  itemlists: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Itemlist',
    required: false,
    default: []
  }]
}, { timestamps: false });

module.exports = mongoose.model('User', userSchema);
