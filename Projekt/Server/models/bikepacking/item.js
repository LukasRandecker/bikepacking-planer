const mongoose = require('mongoose');

/**
 * Ein Ausrüstungsgegenstand.
 *
 * Drei Herkünfte teilen sich diese Collection:
 *
 *   CATALOG    aus dem gepflegten Grundkatalog (data/catalog.json). Gehört
 *              niemandem und wird nie überschrieben.
 *   COMMUNITY  von einem Nutzer angelegt, weil der Katalog es nicht hergab —
 *              und dadurch für alle sichtbar. So wächst die Sammlung mit dem,
 *              was die Leute tatsächlich einpacken. `Owner` sagt, wer es
 *              beigesteuert hat; nur diese Person kann es ändern.
 *   PRIVATE    eine persönliche Kopie eines geteilten Eintrags, entstanden
 *              über /items/:id/fork, weil jemand Gewicht oder Preis für seine
 *              Liste anpassen wollte. Sieht nur, wem sie gehört: eine
 *              angepasste Dublette gehört nicht in den gemeinsamen Katalog.
 */

/** Herkünfte, die in Suche und Vorschlägen für jeden sichtbar sind. */
const SHARED_SOURCES = ['CATALOG', 'COMMUNITY'];

const itemSchema = new mongoose.Schema({
  Categorie: { type: String, required: true },
  IMG: { type: String, required: false, default: '' },
  Itemname: { type: String, required: true },

  // Die Marke steht neben dem Namen: "Oberrohrtasche · Cyclite".
  Brand: { type: String, required: false, default: '', trim: true, maxlength: 60 },

  Link: { type: String, required: false, default: '' },
  Weight: { type: Number, required: false, default: 0, min: 0 },
  Price: { type: Number, required: false, default: 0, min: 0 },

  /**
   * Suchbegriffe, die nicht im Namen stehen.
   *
   * Beim Grundkatalog steht hier die Herkunft aus der Quelle ("Bikepacking ·
   * Gravelbike · Schlafen"), damit "Schlafen" weiterhin alle Schlafsachen
   * findet. Angezeigt wird das Feld nirgends — es trägt nur die Suche.
   */
  Section: { type: String, required: false, default: '' },

  /** Dasselbe für selbst angelegte Items: frei vergebene Suchbegriffe. */
  Keywords: { type: String, required: false, default: '', maxlength: 300 },

  Source: {
    type: String,
    enum: ['CATALOG', 'COMMUNITY', 'PRIVATE'],
    required: true,
    default: 'COMMUNITY'
  },
  Owner: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: false,
    default: null
  }
}, { timestamps: false });

// Trägt die Katalogsuche im Picker.
itemSchema.index({ Source: 1, Categorie: 1 });
itemSchema.index({ Itemname: 1 });
itemSchema.index({ Brand: 1 });

module.exports = mongoose.model('Item', itemSchema);
module.exports.SHARED_SOURCES = SHARED_SOURCES;
