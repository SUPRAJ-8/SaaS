const mongoose = require('mongoose');

const clientSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    trim: true
  },
  storeType: {
    type: String,
    required: false
  },
  ownerEmail: {
    type: String,
    required: true,
    // Removed unique constraint to allow users to have multiple stores
    trim: true,
    lowercase: true
  },
  subdomain: {
    type: String,
    unique: true,
    sparse: true,
    trim: true,
    lowercase: true
  },
  customDomain: {
    type: String,
    unique: true,
    sparse: true,
    trim: true,
    lowercase: true
  },
  customDomainStatus: {
    type: String,
    enum: ['pending', 'verified', 'error', 'none'],
    default: 'none'
  },
  subscriptionPlan: {
    type: String,
    enum: ['free', 'basic', 'pro', 'platinum', 'enterprise'],
    default: 'free'
  },
  subscriptionStatus: {
    type: String,
    enum: ['active', 'trialing', 'past_due', 'cancelled'],
    default: 'trialing'
  },
  stripeCustomerId: {
    type: String,
    unique: true,
    sparse: true // Allows multiple documents to have a null value for this field
  },
  settings: {
    type: Object,
    default: {}
  },
  seoSettings: {
    metaTitle: { type: String, trim: true },
    metaDescription: { type: String, trim: true },
    ogImage: { type: String },
    keywords: { type: [String], default: [] }
  },
  navbar: {
    layout: { type: String, default: 'basic' },
    navbarStyle: { type: String, default: 'basic' },
    showSearch: { type: Boolean, default: true },
    longSearch: { type: Boolean, default: false },
    sticky: { type: Boolean, default: false },
    showLogo: { type: Boolean, default: true },
    showStoreName: { type: Boolean, default: true },
    showIcons: { type: Boolean, default: true },
    menuAlignment: { type: String, default: 'center' },
    menuItems: { type: Array, default: [] },
    settings: { type: Object, default: {} }
  }
}, { timestamps: true });

const Client = mongoose.model('Client', clientSchema);

module.exports = Client;
