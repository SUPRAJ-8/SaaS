const mongoose = require('mongoose');

const customerSchema = new mongoose.Schema({
  clientId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Client',
    required: true
  },
  name: { type: String, required: true },
  email: { type: String, required: false }, // Email is optional
  phone: { type: String, required: true }, // Phone is required
  address: String,
}, { timestamps: true });

// Ensure that the combination of name, phone, and email is unique per client
// Using sparse index to allow multiple customers with no email
customerSchema.index({ clientId: 1, name: 1, phone: 1, email: 1 }, { unique: true, sparse: true });

const Customer = mongoose.model('Customer', customerSchema);

module.exports = Customer;
