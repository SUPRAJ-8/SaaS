const mongoose = require('mongoose');

const ItemSchema = new mongoose.Schema({
  product: { type: mongoose.Schema.Types.ObjectId, ref: 'Product' },
  name: String,
  quantity: Number,
  price: Number,
  image: String,
  variant: String, // Store variant information (e.g., "Variant: Red/M")
});

const LabelSchema = new mongoose.Schema({
  text: String,
  color: String,
});

const InvoiceSchema = new mongoose.Schema({
  status: String, // e.g., 'Paid', 'Unpaid', 'Refunded'
});

const OrderSchema = new mongoose.Schema({
  orderId: { type: String, required: true, unique: true },
  customer: { type: mongoose.Schema.Types.ObjectId, ref: 'Customer' },
  customerDetails: {
    name: String,
    email: String,
    phone: String,
    province: String,
    city: String,
    address: String,
    landmark: String,
    orderNotes: String,
    paymentTerms: String,
  },
  items: [ItemSchema],
  payment: {
    total: Number,
  },
  labels: [LabelSchema],
  status: {
    type: String,
    enum: ['pending', 'processing', 'shipping', 'delivered', 'cancelled', 'refunded'],
    default: 'pending',
  },
  invoices: [InvoiceSchema],
  placedOn: { type: Date, default: Date.now },
  updatedOn: { type: Date, default: Date.now },
  // Keeping clientId for multi-tenancy
  clientId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Client',
    required: true
  },
});

module.exports = mongoose.model('Order', OrderSchema);
