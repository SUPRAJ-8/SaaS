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
  }
}, { timestamps: true });

const Client = mongoose.model('Client', clientSchema);

module.exports = Client;
