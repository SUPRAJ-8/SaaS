const express = require('express');
const router = express.Router();
const Order = require('../models/Order');
const Customer = require('../models/Customer');
const Product = require('../models/Product');
const mongoose = require('mongoose');

// --- AUTH MIDDLEWARE (PLACEHOLDER) ---
const authMiddleware = (req, res, next) => {
  req.user = {
    id: 'someUserId_from_jwt',
    // This should be a real ObjectId of a client in your database.
    clientId: new mongoose.Types.ObjectId('60d5f1b3b3f3b3f3b3f3b3f3') 
  };
  next();
};
router.use(authMiddleware);

// --- CLEANUP ROUTE ---
// Delete all orders with old timestamp-based IDs
router.delete('/cleanup-old-orders', async (req, res) => {
  try {
    // Delete orders with timestamp-based IDs (ORD-followed by 13+ digits)
    const result = await Order.deleteMany({
      orderId: { $regex: /^ORD-\d{13,}$/ }
    });
    
    console.log(`Deleted ${result.deletedCount} orders with old timestamp-based IDs`);
    res.json({ 
      msg: 'Old orders cleaned up successfully', 
      deletedCount: result.deletedCount 
    });
  } catch (error) {
    console.error('Cleanup error:', error);
    res.status(500).json({ msg: 'Failed to cleanup old orders', error: error.message });
  }
});

// --- SEEDING ROUTE ---
router.get('/seed', async (req, res) => {
  try {
    await Order.deleteMany({ clientId: req.user.clientId });

    const seedOrders = [
      {
        orderId: 'ORD-1000',
        clientId: req.user.clientId,
        customerDetails: { name: 'John Doe', email: 'john@example.com', paymentTerms: 'COD' },
        items: [{ name: 'Product A', quantity: 2, price: 50 }, { name: 'Product B', quantity: 1, price: 100 }],
        payment: { total: 200 },
        labels: [{ text: 'Urgent', color: '#f00' }],
        status: 'processing',
        invoices: [{ status: 'Paid' }],
        placedOn: new Date('2023-10-26T10:00:00Z'),
        updatedOn: new Date('2023-10-26T12:30:00Z'),
      },
      {
        orderId: 'ORD-1001',
        clientId: req.user.clientId,
        customerDetails: { name: 'Jane Smith', email: 'jane@example.com', paymentTerms: 'QR' },
        items: [{ name: 'Product C', quantity: 5, price: 20 }],
        payment: { total: 100 },
        labels: [{ text: 'VIP', color: '#00f' }],
        status: 'delivered',
        invoices: [{ status: 'Paid' }],
        placedOn: new Date('2023-10-25T15:20:00Z'),
        updatedOn: new Date('2023-10-25T18:00:00Z'),
      },
    ];

    await Order.insertMany(seedOrders);
    res.status(200).send('Database seeded successfully!');
  } catch (error) {
    console.error('Seeding error:', error);
    res.status(500).send('Failed to seed database.');
  }
});

// --- CRUD ROUTES ---

// @route   POST api/orders
// @desc    Create a new order
// @access  Public // Should be protected in a real app
router.post('/', async (req, res) => {
  try {
    const { customerDetails, ...orderDetails } = req.body;

    // Get clientId from user or use a default for development
    const clientId = req.user?.clientId || new mongoose.Types.ObjectId('60d5f1b3b3f3b3f3b3f3b3f3');

    let customer;
    // Find or create a customer - ALL THREE fields (name, phone, email) must match exactly
    // If any field is different or missing, create a new customer
    if (customerDetails && customerDetails.name && customerDetails.phone) {
      // Build search query - only match if ALL provided fields are identical
      const searchQuery = {
        name: customerDetails.name,
        phone: customerDetails.phone,
        clientId: clientId
      };
      
      // If email is provided, it must also match. If not provided, only match customers without email
      if (customerDetails.email) {
        searchQuery.email = customerDetails.email;
      } else {
        // Match only customers with no email or empty email
        searchQuery.$or = [
          { email: { $exists: false } },
          { email: null },
          { email: '' }
        ];
      }
      
      customer = await Customer.findOne(searchQuery);
      
      console.log(`Searching for customer with name: ${customerDetails.name}, phone: ${customerDetails.phone}, email: ${customerDetails.email || 'NOT PROVIDED'}`);
      console.log(`Customer found: ${customer ? 'Yes' : 'No'}`);
    }

    // If customer not found (any field doesn't match or is missing), create a new one
    if (!customer && customerDetails) {
      try {
        customer = new Customer({
          name: customerDetails.name,
          email: customerDetails.email || '', // Store empty string if no email provided
          phone: customerDetails.phone,
          address: `${customerDetails.streetAddress || ''}, ${customerDetails.city || ''}`,
          clientId: clientId,
        });
        await customer.save();
        console.log(`New customer created: ${customer.name} (Phone: ${customer.phone}, Email: ${customer.email || 'NOT PROVIDED'})`);
      } catch (customerError) {
        // If customer creation fails due to duplicate, find the existing customer
        if (customerError.code === 11000) {
          console.log('Duplicate customer found, using existing customer');
          // Search again with all fields to find the duplicate
          const searchQuery = {
            name: customerDetails.name,
            phone: customerDetails.phone,
            clientId: clientId
          };
          if (customerDetails.email) {
            searchQuery.email = customerDetails.email;
          }
          customer = await Customer.findOne(searchQuery);
          console.log(`Using existing customer: ${customer ? customer.name : 'Not found'}`);
        } else {
          throw customerError;
        }
      }
    }

    // Generate sequential order ID starting from 1000
    let nextOrderNumber = 1000;
    
    // Find the last order to get the highest order number
    const lastOrder = await Order.findOne({})
      .sort({ orderId: -1 })
      .select('orderId')
      .lean();
    
    if (lastOrder && lastOrder.orderId) {
      // Extract number from orderId (e.g., "ORD-1005" -> 1005)
      const match = lastOrder.orderId.match(/ORD-(\d+)/);
      if (match && match[1]) {
        const lastNumber = parseInt(match[1], 10);
        nextOrderNumber = lastNumber + 1;
      }
    }

    // Transform items to map 'id' to 'product' field for database schema
    const transformedItems = orderDetails.items.map(item => ({
      product: item.id || item.product, // Map 'id' from cart to 'product' for schema
      name: item.name,
      quantity: item.quantity,
      price: item.price,
      variant: item.variant // Keep variant info for inventory reduction
    }));

    const newOrder = new Order({
      ...orderDetails,
      items: transformedItems, // Use transformed items
      customer: customer?._id, // Link to the customer if exists
      customerDetails: customerDetails ? {
        name: customerDetails.name,
        email: customerDetails.email,
        phone: customerDetails.phone,
        province: customerDetails.province,
        city: customerDetails.city,
        address: customerDetails.streetAddress, // Note: streetAddress from client maps to address in DB
        landmark: customerDetails.landmark,
        orderNotes: customerDetails.orderNote, // Note: orderNote from client maps to orderNotes in DB
        paymentTerms: customerDetails.paymentTerms || 'COD' // Set default payment method
      } : {},
      clientId: clientId,
      orderId: `ORD-${nextOrderNumber}`
    });

    const order = await newOrder.save();
    res.json(order);
  } catch (err) {
    console.error('Error creating order:', err);
    console.error('Error stack:', err.stack);
    res.status(500).json({ msg: 'Server Error', error: err.message });
  }
});

router.get('/', async (req, res) => {
  try {
    // Check if mongoose is connected
    if (mongoose.connection.readyState !== 1) {
      console.error('MongoDB is not connected. Connection state:', mongoose.connection.readyState);
      return res.status(503).json({ 
        msg: 'Database not connected', 
        error: 'MongoDB connection is not established' 
      });
    }

    // For development: if no user/clientId, return all orders
    // In production, this should require authentication
    let query = {};
    
    if (req.user && req.user.clientId) {
      // req.user.clientId is already an ObjectId instance from middleware
      // Convert to string for validation, then use the ObjectId instance
      const clientIdStr = req.user.clientId.toString();
      if (mongoose.Types.ObjectId.isValid(clientIdStr)) {
        query.clientId = req.user.clientId;
        console.log('Fetching orders for clientId:', clientIdStr);
      } else {
        console.warn('Invalid clientId format, returning all orders');
      }
    } else {
      console.log('No clientId provided, returning all orders (development mode)');
    }

    // Try to fetch orders - populate customer if it exists, otherwise just get orders
    let orders;
    try {
      orders = await Order.find(query).populate('customer', 'name email phone').lean();
    } catch (populateError) {
      // If populate fails, try without populate
      console.warn('Populate failed, fetching without populate:', populateError.message);
      orders = await Order.find(query).lean();
    }
    
    console.log('Orders found:', orders.length);
    res.json(orders || []);
  } catch (err) {
    console.error('Error fetching orders:', err);
    console.error('Error details:', {
      message: err.message,
      name: err.name,
      stack: err.stack
    });
    res.status(500).json({ 
      msg: 'Server Error', 
      error: err.message,
      details: process.env.NODE_ENV === 'development' ? err.stack : undefined
    });
  }
});

// Helper function to reduce product inventory
const reduceProductInventory = async (items) => {
  for (const item of items) {
    try {
      const product = await Product.findById(item.product || item.id);
      
      if (!product) {
        console.warn(`Product not found for item: ${item.name}`);
        continue;
      }

      // Check if item has variant information
      if (item.variant) {
        // Parse variant string like "Variant: Red/M"
        const variantMatch = item.variant.match(/Variant:\s*(\w+)\/(\w+)/i);
        if (variantMatch && product.hasVariants) {
          const color = variantMatch[1].toLowerCase();
          const size = variantMatch[2].toLowerCase();
          
          // Find and update the matching variant
          const variantIndex = product.variants.findIndex(
            v => v.color.toLowerCase() === color && v.size.toLowerCase() === size
          );
          
          if (variantIndex !== -1) {
            const currentQuantity = product.variants[variantIndex].quantity || 0;
            product.variants[variantIndex].quantity = Math.max(0, currentQuantity - item.quantity);
            console.log(`Reduced variant ${color}/${size} of ${product.name} by ${item.quantity}. New quantity: ${product.variants[variantIndex].quantity}`);
          } else {
            console.warn(`Variant ${color}/${size} not found for product: ${product.name}`);
          }
        }
      } else {
        // No variant, update main product quantity
        const currentQuantity = product.quantity || 0;
        product.quantity = Math.max(0, currentQuantity - item.quantity);
        console.log(`Reduced ${product.name} by ${item.quantity}. New quantity: ${product.quantity}`);
      }

      await product.save();
    } catch (error) {
      console.error(`Error reducing inventory for item ${item.name}:`, error);
      // Continue with other items even if one fails
    }
  }
};

// @route   PUT api/orders/:id
// @desc    Update an order
// @access  Private
router.put('/:id', async (req, res) => {
  try {
    const order = await Order.findById(req.params.id);

    if (!order) {
      return res.status(404).json({ msg: 'Order not found' });
    }

    const previousStatus = order.status;

    // Update order fields
    const {
      status,
      invoices,
      labels,
      customerDetails,
      items,
      payment
    } = req.body;

    if (status) order.status = status;
    if (invoices) order.invoices = invoices;
    if (labels) order.labels = labels;
    if (customerDetails) order.customerDetails = { ...order.customerDetails, ...customerDetails };
    if (items) order.items = items;
    if (payment) order.payment = { ...order.payment, ...payment };
    
    order.updatedOn = Date.now();

    await order.save();

    // If status changed to 'delivered', reduce product quantities
    if (status === 'delivered' && previousStatus !== 'delivered') {
      console.log(`Order ${order.orderId} marked as delivered. Reducing inventory...`);
      await reduceProductInventory(order.items);
    }

    res.json(order);
  } catch (err) {
    console.error('Error updating order:', err.message);
    res.status(500).json({ msg: 'Server Error', error: err.message });
  }
});

// @route   DELETE api/orders/:id
// @desc    Delete an order
// @access  Private
router.delete('/:id', async (req, res) => {
  try {
    const order = await Order.findById(req.params.id);

    if (!order) {
      return res.status(404).json({ msg: 'Order not found' });
    }

    // Ensure the order belongs to the client (flexible for development)
    const clientId = req.user?.clientId || new mongoose.Types.ObjectId('60d5f1b3b3f3b3f3b3f3b3f3');
    if (order.clientId.toString() !== clientId.toString()) {
      return res.status(401).json({ msg: 'Not authorized' });
    }

    await order.deleteOne();
    console.log(`Order ${order.orderId} deleted successfully`);

    res.json({ msg: 'Order removed', orderId: order.orderId });
  } catch (err) {
    console.error('Error deleting order:', err.message);
    res.status(500).json({ msg: 'Server Error', error: err.message });
  }
});

module.exports = router;
