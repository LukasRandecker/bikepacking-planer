const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
  username: {
    type: String,
    required: true,
    unique: true,
    trim: true,
    minlength: 3,
    maxlength: 32
  },

  /**
   * Der bcrypt-Hash, nie das Passwort.
   *
   * `select: false` heißt: das Feld kommt bei keiner Abfrage mit, solange es
   * nicht ausdrücklich angefordert wird (`.select('+pw')`). Damit kann es
   * nicht mehr aus Versehen in einer Antwort landen — genau das ist vorher
   * über `GET /users` passiert.
   */
  pw: {
    type: String,
    required: true,
    select: false
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

// Zweiter Riegel: selbst wenn ein Dokument mit `pw` serialisiert wird, fällt
// das Feld beim Verwandeln in JSON raus.
userSchema.set('toJSON', {
  transform: (doc, ret) => {
    delete ret.pw;
    delete ret.__v;
    return ret;
  }
});

module.exports = mongoose.model('User', userSchema);
