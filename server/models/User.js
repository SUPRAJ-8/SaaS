const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
  clientId: { // Links this user to a Client
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Client',
    required: true
  },
  googleId: {
    type: String,
    unique: true,
    sparse: true // Allows for null values, so not every user needs a Google ID
  },
  name: {
    type: String,
    required: true
  },
  email: {
    type: String,
    required: true
  },
  phoneNumber: {
    type: String,
    required: false
  },
  password: {
    type: String,
    required: false // No password needed for OAuth users
  },
  currentSessionId: {
    type: String,
    required: false
  },
  isOnboarded: {
    type: Boolean,
    default: false
  },
  role: {
    type: String,
    enum: ['Admin', 'Manager', 'Staff', 'SuperAdmin'],
    default: 'Admin'
  },
  status: {
    type: String,
    enum: ['Active', 'Inactive', 'Pending'],
    default: 'Active'
  },
  gender: {
    type: String,
    enum: ['male', 'female', 'other'],
    required: false
  },
  avatar: {
    type: String,
    required: false
  },
  emailNotification: {
    type: Boolean,
    default: true
  },
  hasSelectedPlan: {
    type: Boolean,
    default: false
  }
}, { timestamps: true });

// To ensure that a user's email is unique within the scope of a single client
userSchema.index({ clientId: 1, email: 1 }, { unique: true });

const User = mongoose.model('User', userSchema);

module.exports = User;
