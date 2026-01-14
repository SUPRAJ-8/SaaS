const mongoose = require('mongoose');

const VariantSchema = new mongoose.Schema({
  color: String,
  size: String,
  crossedPrice: { type: Number, default: 0 },
  sellingPrice: { type: Number, default: 0 },
  costPrice: { type: Number, default: 0 },
  weight: { type: Number, default: 0 },
  quantity: { type: Number, default: 0 },
  sku: String,
  image: String
});

const ProductSchema = new mongoose.Schema({
  images: {
    type: [String],
    default: []
  },
  shortDescription: {
    type: String
  },
  longDescription: {
    type: String
  },
  gender: {
    type: String
  },
  category: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'category'
  },
  subcategory: {
    type: String
  },
  hasVariants: {
    type: Boolean,
    default: false
  },
  variants: [VariantSchema],
  variantColors: {
    type: [String],
    default: []
  },
  variantSizes: {
    type: [String],
    default: []
  },
  samePriceForAllVariants: {
    type: Boolean,
    default: false
  },
  name: {
    type: String,
    required: true
  },
  sku: {
    type: String,
    required: true
  },
  crossedPrice: {
    type: Number,
    required: false
  },
  sellingPrice: {
    type: Number,
    required: false
  },
  costPrice: {
    type: Number,
    required: false
  },
  quantity: {
    type: Number,
    required: false
  },
  status: {
    type: String,
    enum: ['Active', 'Draft', 'Archived'],
    default: 'Active'
  },
  section: {
    type: String,
    enum: ['None', 'Popular', 'Featured'],
    default: 'None'
  },
  rating: {
    type: Number,
    default: 0,
    min: 0,
    max: 5
  },
  reviews: {
    type: Number,
    default: 0,
    min: 0
  },
  sold: {
    type: Number,
    default: 0,
    min: 0
  },
  clientId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Client',
    required: true
  },
  date: {
    type: Date,
    default: Date.now
  },
  seoTitle: {
    type: String,
    trim: true
  },
  seoDescription: {
    type: String,
    trim: true
  },
  handle: {
    type: String,
    trim: true
  }
}, { timestamps: true });

// Compound index to ensure SKU is unique only for a specific store/client
ProductSchema.index({ clientId: 1, sku: 1 }, { unique: true });

module.exports = mongoose.model('Product', ProductSchema);
