const express = require('express');
const router = express.Router();
const Order = require('../models/Order');
const Customer = require('../models/Customer');
const Product = require('../models/Product');
const Client = require('../models/Client');
const Notification = require('../models/Notification');
const mongoose = require('mongoose');

const { ensureAuthenticated } = require('../middleware/auth');

// Note: POST / for creating orders should be public for shoppers
// We will apply auth to individual routes instead of the whole router
// router.use(ensureAuthenticated); 

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

router.post('/', async (req, res) => {
  try {
    const { customerDetails, ...orderDetails } = req.body;

    // Validate required fields
    if (!orderDetails.items || !Array.isArray(orderDetails.items) || orderDetails.items.length === 0) {
      return res.status(400).json({
        msg: 'Order must contain at least one item',
        error: 'Invalid order data'
      });
    }

    if (!customerDetails || !customerDetails.name || !customerDetails.phone) {
      return res.status(400).json({
        msg: 'Customer name and phone are required',
        error: 'Missing customer details'
      });
    }

    // For public order placement (shoppers), we need to identify the client from the subdomain or a header
    let clientId = req.tenantClient?._id || req.body.clientId || req.user?.clientId;

    // If still no clientId, try to get it from the subdomain header or hostname
    if (!clientId) {
      const subdomain = req.headers['x-subdomain'] || req.hostname?.split('.')[0];
      console.log('Attempting to find client by subdomain:', subdomain);

      if (subdomain && subdomain !== 'app' && subdomain !== 'www' && subdomain !== 'localhost' && subdomain !== 'api') {
        try {
          const tenantClient = await Client.findOne({ subdomain });
          if (tenantClient) {
            clientId = tenantClient._id;
            req.tenantClient = tenantClient;
            console.log('Client found by subdomain:', tenantClient.name, 'ID:', clientId);
          } else {
            console.log('No client found with subdomain:', subdomain);
          }
        } catch (err) {
          console.error('Error finding client by subdomain:', err);
        }
      } else {
        // For localhost development, try to get the first available client as fallback
        if (req.hostname === 'localhost' || req.hostname.includes('localhost')) {
          try {
            const firstClient = await Client.findOne({});
            if (firstClient) {
              clientId = firstClient._id;
              console.log('Using first available client for localhost:', firstClient.name, 'ID:', clientId);
            }
          } catch (err) {
            console.error('Error finding fallback client:', err);
          }
        }
      }
    }

    if (!clientId) {
      console.error('Order placement failed - No clientId found. Request details:', {
        hostname: req.hostname,
        subdomain: req.headers['x-subdomain'],
        hasTenantClient: !!req.tenantClient,
        hasBodyClientId: !!req.body.clientId,
        hasUser: !!req.user,
        userClientId: req.user?.clientId
      });
      return res.status(400).json({
        msg: 'Failed to identify store. Please ensure you are accessing the store from the correct subdomain or contact support.',
        error: 'Client identification failed'
      });
    }

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
      image: item.image,
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
        district: customerDetails.district,
        address: customerDetails.streetAddress, // Note: streetAddress from client maps to address in DB
        landmark: customerDetails.landmark,
        toll: customerDetails.toll,
        orderNotes: customerDetails.orderNote, // Note: orderNote from client maps to orderNotes in DB
        paymentTerms: customerDetails.paymentTerms || 'COD' // Set default payment method
      } : {},
      clientId: clientId,
      orderId: `ORD-${nextOrderNumber}`
    });

    const order = await newOrder.save();
    console.log('Order created successfully:', order.orderId);

    // Reduce inventory immediately on placement
    await reduceProductInventory(order.items);

    // Create notification for new order
    await new Notification({
      clientId: clientId,
      type: 'order',
      title: 'New Order Received',
      message: `Order ${order.orderId} has been placed by ${customerDetails?.name || 'a customer'}.`,
      targetLink: '/dashboard/orders',
      metadata: { orderId: order._id }
    }).save();

    res.json(order);
  } catch (err) {
    console.error('Error creating order:', err);
    console.error('Error stack:', err.stack);
    console.error('Request body:', JSON.stringify(req.body, null, 2));

    // Provide more specific error messages
    let errorMsg = 'Server Error';
    if (err.name === 'ValidationError') {
      errorMsg = 'Validation error: ' + Object.values(err.errors).map(e => e.message).join(', ');
    } else if (err.code === 11000) {
      errorMsg = 'Duplicate order ID. Please try again.';
    } else if (err.message) {
      errorMsg = err.message;
    }

    res.status(500).json({
      msg: 'Failed to place order. ' + errorMsg,
      error: err.message || 'Unknown error',
      details: process.env.NODE_ENV === 'development' ? err.stack : undefined
    });
  }
});

// @route   GET api/orders
// @desc    Get all orders for the current user's client
// @access  Private
router.get('/', ensureAuthenticated, async (req, res) => {
  try {
    const clientId = req.user.clientId;
    const query = { clientId };

    const orders = await Order.find(query)
      .populate('customer', 'name email phone')
      .sort({ placedOn: -1 })
      .lean();

    res.json(orders || []);
  } catch (err) {
    console.error('Error fetching orders:', err);
    res.status(500).json({ msg: 'Server Error' });
  }
});

// Helper function to reduce product inventory
const reduceProductInventory = async (items) => {
  console.log(`[Inventory] Reducing stock for ${items.length} items...`);
  for (const item of items) {
    try {
      const productId = item.product || item.id;
      if (!productId) {
        console.warn(`[Inventory] No product ID found for item: ${item.name}`);
        continue;
      }

      const product = await Product.findById(productId);
      if (!product) {
        console.warn(`[Inventory] Product not found in DB: ${item.name} (${productId})`);
        continue;
      }

      // Check if item has variant information
      if (item.variant && product.hasVariants) {
        // Handle both "Variant: Color/Size" and just "Color/Size"
        const variantStr = item.variant.replace(/Variant:\s*/i, '');
        const parts = variantStr.split('/');

        if (parts.length >= 2) {
          const color = parts[0].trim().toLowerCase();
          const size = parts[1].trim().toLowerCase();

          // Find and update the matching variant
          const variantIndex = product.variants.findIndex(
            v => v.color?.toLowerCase() === color && v.size?.toLowerCase() === size
          );

          if (variantIndex !== -1) {
            const currentQuantity = product.variants[variantIndex].quantity || 0;
            product.variants[variantIndex].quantity = Math.max(0, currentQuantity - item.quantity);
            console.log(`[Inventory] Reduced variant ${color}/${size} of ${product.name} by ${item.quantity}. New qty: ${product.variants[variantIndex].quantity}`);
          } else {
            console.warn(`[Inventory] Variant ${color}/${size} not found for product: ${product.name}. Check available variants:`, product.variants.map(v => `${v.color}/${v.size}`));
            // Fallback: If variant not found but product has no global quantity, maybe it's a data mismatch
          }
        }
      } else {
        // No variant or product doesn't use variants, update main product quantity
        const currentQuantity = product.quantity || 0;
        product.quantity = Math.max(0, currentQuantity - item.quantity);
        console.log(`[Inventory] Reduced ${product.name} by ${item.quantity}. New qty: ${product.quantity}`);
      }

      await product.save();
    } catch (error) {
      console.error(`[Inventory] Error reducing stock for ${item.name}:`, error);
    }
  }
};

// Helper function to restore product inventory (on cancellation/refund)
const restoreProductInventory = async (items) => {
  console.log(`[Inventory] Restoring stock for ${items.length} items...`);
  for (const item of items) {
    try {
      const productId = item.product || item.id;
      const product = await Product.findById(productId);

      if (!product) {
        console.warn(`[Inventory] Product not found for restock: ${item.name}`);
        continue;
      }

      // Check if item has variant information
      if (item.variant && product.hasVariants) {
        const variantStr = item.variant.replace(/Variant:\s*/i, '');
        const parts = variantStr.split('/');

        if (parts.length >= 2) {
          const color = parts[0].trim().toLowerCase();
          const size = parts[1].trim().toLowerCase();

          const variantIndex = product.variants.findIndex(
            v => v.color?.toLowerCase() === color && v.size?.toLowerCase() === size
          );

          if (variantIndex !== -1) {
            product.variants[variantIndex].quantity = (product.variants[variantIndex].quantity || 0) + item.quantity;
            console.log(`[Inventory] Restored variant ${color}/${size} of ${product.name} by ${item.quantity}.`);
          }
        }
      } else {
        product.quantity = (product.quantity || 0) + item.quantity;
        console.log(`[Inventory] Restored ${product.name} by ${item.quantity}.`);
      }

      await product.save();
    } catch (error) {
      console.error(`[Inventory] Error restoring stock for ${item.name}:`, error);
    }
  }
};

// @route   PUT api/orders/:id
// @desc    Update an order
// @access  Private
router.put('/:id', ensureAuthenticated, async (req, res) => {
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

    // Inventory logic for status changes
    const newStatus = order.status?.toLowerCase();
    const oldStatus = previousStatus?.toLowerCase();
    const isNowCancelled = newStatus === 'cancelled' || newStatus === 'refunded';
    const wasCancelled = oldStatus === 'cancelled' || oldStatus === 'refunded';

    console.log(`[Inventory] Status change: ${oldStatus} -> ${newStatus} | wasCancelled: ${wasCancelled}, isNowCancelled: ${isNowCancelled}`);

    if (isNowCancelled && !wasCancelled) {
      // Moving TO cancelled/refunded -> Restore stock
      console.log(`[Inventory] Order ${order.orderId} cancelled/refunded. Restoring stock...`);
      await restoreProductInventory(order.items);
    } else if (!isNowCancelled && wasCancelled) {
      // Moving FROM cancelled/refunded back to active -> Decrease stock
      console.log(`[Inventory] Order ${order.orderId} reactivated (${newStatus}). Decreasing stock...`);
      await reduceProductInventory(order.items);
    }

    // Create notification if status is completed
    if (status === 'delivered') {
      await new Notification({
        clientId: order.clientId,
        type: 'order',
        title: 'Order Status: Completed',
        message: `Order ${order.orderId} has been marked as delivered/completed.`,
        targetLink: '/dashboard/orders',
        metadata: { orderId: order._id }
      }).save();
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
router.delete('/:id', ensureAuthenticated, async (req, res) => {
  try {
    const order = await Order.findById(req.params.id);

    if (!order) {
      return res.status(404).json({ msg: 'Order not found' });
    }

    // Ensure the order belongs to the client
    const clientId = req.user.clientId;
    if (order.clientId.toString() !== clientId.toString()) {
      return res.status(401).json({ msg: 'Not authorized: This order belongs to another store' });
    }

    await order.deleteOne();
    console.log(`Order ${order.orderId} deleted successfully`);

    res.json({ msg: 'Order removed', orderId: order.orderId });
  } catch (err) {
    console.error('Error deleting order:', err.message);
    res.status(500).json({ msg: 'Server Error', error: err.message });
  }
});

// @route   GET api/orders/track/:orderId
// @desc    Track an order (Public)
// @access  Public
router.get('/track/:orderId', async (req, res) => {
  try {
    const { orderId } = req.params;

    // Identify client
    let clientId = req.tenantClient?._id;
    if (!clientId) {
      const subdomain = req.headers['x-subdomain'] || req.hostname?.split('.')[0];
      if (subdomain && !['app', 'www', 'api', 'localhost'].includes(subdomain)) {
        const client = await Client.findOne({ subdomain });
        if (client) clientId = client._id;
      }
    }

    // Find order by orderId and clientId
    const query = { orderId };
    if (clientId) query.clientId = clientId;

    const order = await Order.findOne(query).lean();

    if (!order) {
      return res.status(404).json({ msg: 'Order not found' });
    }

    // Return order status and basic info
    res.json({
      orderId: order.orderId,
      status: order.status,
      placedOn: order.placedOn,
      updatedOn: order.updatedOn,
      payment: order.payment,
      customerName: order.customerDetails?.name,
      customerEmail: order.customerDetails?.email,
      customerPhone: order.customerDetails?.phone,
      paymentStatus: (() => {
        const invoices = order.invoices || [];
        if (invoices.length === 0) return 'Unpaid';
        if (invoices.every(inv => inv.status === 'Refunded')) return 'Refunded';
        if (invoices.some(inv => inv.status === 'Paid')) return 'Paid';
        return 'Unpaid';
      })(),
      items: (order.items || []).map(item => ({
        name: item.name,
        quantity: item.quantity,
        price: item.price,
        image: item.image,
        variant: item.variant
      }))
    });

  } catch (err) {
    console.error('Error tracking order:', err);
    res.status(500).json({ msg: 'Server Error' });
  }
});

// @route   POST api/orders/bulk-delete
// @desc    Delete multiple orders
// @access  Private
router.post('/bulk-delete', ensureAuthenticated, async (req, res) => {
  try {
    const { ids } = req.body;
    const clientId = req.user.clientId;

    if (!ids || !Array.isArray(ids)) {
      return res.status(400).json({ msg: 'Invalid IDs' });
    }

    // Delete orders that belong to this client
    const result = await Order.deleteMany({
      _id: { $in: ids },
      clientId: clientId
    });

    res.json({ msg: `${result.deletedCount} orders deleted` });
  } catch (err) {
    console.error('Error bulk deleting orders:', err);
    res.status(500).json({ msg: 'Server Error' });
  }
});

// @route   POST api/orders/bulk-status
// @desc    Update status for multiple orders
// @access  Private
router.post('/bulk-status', ensureAuthenticated, async (req, res) => {
  try {
    const { ids, status, type } = req.body; // type: 'order' or 'payment'
    const clientId = req.user.clientId;

    if (!ids || !Array.isArray(ids) || !status) {
      return res.status(400).json({ msg: 'Invalid request' });
    }

    if (type === 'payment') {
      const orders = await Order.find({ _id: { $in: ids }, clientId });

      for (const order of orders) {
        // Build update object
        const updatedInvoices = order.invoices && order.invoices.length > 0
          ? order.invoices.map(inv => ({ ...inv, status }))
          : [{ status }];

        const updateData = { invoices: updatedInvoices, updatedOn: Date.now() };

        // If payment status is set to Refunded, automatically set order status to refunded
        if (status === 'Refunded') {
          updateData.status = 'cancelled';
        }

        await Order.findByIdAndUpdate(order._id, { $set: updateData });
      }
    } else {
      // Standard order status update
      const orders = await Order.find({ _id: { $in: ids }, clientId });

      for (const order of orders) {
        const previousStatus = order.status;
        order.status = status.toLowerCase();
        order.updatedOn = Date.now();

        await order.save();

        // Handle inventory transitions
        const newStatus = order.status?.toLowerCase();
        const oldStatus = previousStatus?.toLowerCase();
        const isNowCancelled = newStatus === 'cancelled' || newStatus === 'refunded';
        const wasCancelled = oldStatus === 'cancelled' || oldStatus === 'refunded';

        console.log(`[Inventory] Bulk status change: ${oldStatus} -> ${newStatus} | wasCancelled: ${wasCancelled}, isNowCancelled: ${isNowCancelled}`);

        if (isNowCancelled && !wasCancelled) {
          await restoreProductInventory(order.items);
        } else if (!isNowCancelled && wasCancelled) {
          await reduceProductInventory(order.items);
        }

        // Notification for completion
        if (status.toLowerCase() === 'delivered' && previousStatus !== 'delivered') {
          await new Notification({
            clientId: order.clientId,
            type: 'order',
            title: 'Order Status: Completed',
            message: `Order ${order.orderId} has been marked as completed.`,
            targetLink: '/dashboard/orders',
            metadata: { orderId: order._id }
          }).save();
        }
      }
    }

    res.json({ msg: 'Orders status updated' });
  } catch (err) {
    console.error('Error bulk updating order status:', err);
    res.status(500).json({ msg: 'Server Error' });
  }
});

module.exports = router;
