const express = require('express');
const router = express.Router();
const Customer = require('../models/Customer');
const Order = require('../models/Order');
const mongoose = require('mongoose');

const { ensureAuthenticated } = require('../middleware/auth');

// Apply the authentication middleware to all routes in this file.
router.use(ensureAuthenticated);

// --- CRUD ROUTES FOR CUSTOMERS ---

// GET all customers for the logged-in user's client with order statistics
router.get('/', async (req, res) => {
  try {
    const clientId = req.user.clientId;

    // Fetch all customers
    const customers = await Customer.find({ clientId: clientId }).lean();

    // For each customer, get their order statistics
    const customersWithStats = await Promise.all(
      customers.map(async (customer) => {
        // Get all orders for this customer
        const orders = await Order.find({ customer: customer._id }).lean();

        // Calculate statistics
        const totalOrders = orders.length;
        const totalSpent = orders.reduce((sum, order) => sum + (order.payment?.total || 0), 0);
        const lastOrder = orders.length > 0
          ? orders.sort((a, b) => new Date(b.placedOn) - new Date(a.placedOn))[0].placedOn
          : null;

        return {
          ...customer,
          totalOrders,
          totalSpent,
          lastOrder,
          joinedDate: customer.createdAt
        };
      })
    );

    res.json(customersWithStats);
  } catch (err) {
    console.error('Error fetching customers:', err.message);
    res.status(500).send('Server Error');
  }
});

// POST (create) a new customer for the logged-in user's client
router.post('/', async (req, res) => {
  const { name, email, phone, address } = req.body;
  try {
    const newCustomer = new Customer({
      clientId: req.user.clientId, // Associate with the user's client
      name,
      email,
      phone,
      address
    });
    const customer = await newCustomer.save();
    res.status(201).json(customer);
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server Error');
  }
});

// GET a single customer by its ID with their orders
router.get('/:id', async (req, res) => {
  try {
    const customer = await Customer.findById(req.params.id).lean();

    if (!customer) {
      return res.status(404).json({ message: 'Customer not found' });
    }

    // SECURITY CHECK: Ensure the customer belongs to the user's client
    const clientId = req.user.clientId;
    if (customer.clientId.toString() !== clientId.toString()) {
      return res.status(403).json({ message: 'Access denied: This customer belongs to another store' });
    }

    // Get all orders for this customer
    const orders = await Order.find({ customer: customer._id })
      .sort({ placedOn: -1 })
      .lean();

    // Calculate statistics
    const totalOrders = orders.length;
    const totalSpent = orders.reduce((sum, order) => sum + (order.payment?.total || 0), 0);

    const customerWithOrders = {
      ...customer,
      totalOrders,
      totalSpent,
      orders,
      joinedDate: customer.createdAt
    };

    res.json(customerWithOrders);
  } catch (err) {
    console.error('Error fetching customer:', err.message);
    res.status(500).json({ message: 'Error finding customer' });
  }
});

// PATCH (update) a customer by its ID
router.patch('/:id', getCustomer, async (req, res) => {
  const { name, email, phone, address } = req.body;
  if (name) res.customer.name = name;
  if (email) res.customer.email = email;
  if (phone) res.customer.phone = phone;
  if (address) res.customer.address = address;

  try {
    const updatedCustomer = await res.customer.save();
    res.json(updatedCustomer);
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
});

// DELETE a customer by its ID
router.delete('/:id', async (req, res) => {
  try {
    const customer = await Customer.findById(req.params.id);

    if (!customer) {
      return res.status(404).json({ message: 'Customer not found' });
    }

    // SECURITY CHECK: Ensure the customer belongs to the user's client
    const clientId = req.user.clientId;
    if (customer.clientId.toString() !== clientId.toString()) {
      return res.status(403).json({ message: 'Access denied: This customer belongs to another store' });
    }

    // Delete all orders associated with this customer
    const deleteResult = await Order.deleteMany({ customer: customer._id });
    console.log(`Deleted ${deleteResult.deletedCount} orders for customer ${customer.name}`);

    // Delete the customer
    await customer.deleteOne();

    res.json({
      message: 'Successfully deleted customer and associated orders',
      deletedOrdersCount: deleteResult.deletedCount
    });
  } catch (err) {
    console.error('Error deleting customer:', err.message);
    res.status(500).json({ message: err.message });
  }
});

// BULK DELETE customers
router.post('/bulk-delete', async (req, res) => {
  try {
    const { ids } = req.body;
    const clientId = req.user.clientId;

    if (!ids || !Array.isArray(ids)) {
      return res.status(400).json({ message: 'IDs must be an array' });
    }

    // Verify all customers belong to this client first
    const customers = await Customer.find({ _id: { $in: ids }, clientId });
    if (customers.length !== ids.length) {
      return res.status(403).json({ message: 'Some customers do not belong to you or were not found' });
    }

    // Delete associated orders
    await Order.deleteMany({ customer: { $in: ids } });

    // Delete customers
    await Customer.deleteMany({ _id: { $in: ids } });

    res.json({ message: `Successfully deleted ${ids.length} customers and their orders` });
  } catch (err) {
    console.error('Error bulk deleting customers:', err.message);
    res.status(500).json({ message: 'Server Error' });
  }
});

// BULK UPDATE customer status
router.post('/bulk-update-status', async (req, res) => {
  try {
    const { ids, status } = req.body;
    const clientId = req.user.clientId;

    if (!ids || !Array.isArray(ids)) {
      return res.status(400).json({ message: 'IDs must be an array' });
    }

    if (!['Active', 'Inactive'].includes(status)) {
      return res.status(400).json({ message: 'Invalid status' });
    }

    await Customer.updateMany(
      { _id: { $in: ids }, clientId },
      { $set: { status } }
    );

    res.json({ message: `Successfully updated ${ids.length} customers to ${status}` });
  } catch (err) {
    console.error('Error bulk updating customer status:', err.message);
    res.status(500).json({ message: 'Server Error' });
  }
});

// Middleware to find a customer by ID and verify ownership
async function getCustomer(req, res, next) {
  try {
    const customer = await Customer.findById(req.params.id);

    if (!customer) {
      return res.status(404).json({ message: 'Customer not found' });
    }

    // SECURITY CHECK: Ensure the customer belongs to the user's client
    if (customer.clientId.toString() !== req.user.clientId) {
      return res.status(403).json({ message: 'Access denied' }); // 403 Forbidden
    }

    res.customer = customer;
    next();
  } catch (err) {
    return res.status(500).json({ message: 'Error finding customer' });
  }
}

module.exports = router;
