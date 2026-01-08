const mongoose = require('mongoose');

const CategorySchema = new mongoose.Schema({
  name: {
    type: String,
    required: true
  },
  image: {
    type: String
  },
  description: {
    type: String
  },
  status: {
    type: String,
    default: 'Active'
  },
  section: {
    type: String,
    default: 'shop'
  },
  clientId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Client',
    required: true
  },
  subcategories: [{
    name: String,
    description: String,
    itemCount: { type: Number, default: 0 }
  }],
  date: {
    type: Date,
    default: Date.now
  }
});

// Compound index to ensure category name is unique only for a specific store/client
CategorySchema.index({ clientId: 1, name: 1 }, { unique: true });

module.exports = Category = mongoose.model('category', CategorySchema);
