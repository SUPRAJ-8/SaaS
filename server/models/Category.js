const mongoose = require('mongoose');

const CategorySchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    unique: true
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

module.exports = Category = mongoose.model('category', CategorySchema);
