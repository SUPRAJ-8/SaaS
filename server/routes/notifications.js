const express = require('express');
const router = express.Router();
const Notification = require('../models/Notification');
const Order = require('../models/Order');
const Product = require('../models/Product');
const User = require('../models/User');
const { ensureAuthenticated } = require('../middleware/auth');

// @route   GET api/notifications
// @desc    Get all notifications for the client
router.get('/', ensureAuthenticated, async (req, res) => {
    try {
        const notifications = await Notification.find({
            clientId: req.user.clientId,
            isDeleted: { $ne: true }
        })
            .sort({ createdAt: -1 })
            .limit(50);

        res.json(notifications);
    } catch (err) {
        console.error('Error fetching notifications:', err);
        res.status(500).json({ msg: 'Server Error' });
    }
});

// @route   POST api/notifications/sync
// @desc    Generate notifications from existing data (initial state)
router.post('/sync', ensureAuthenticated, async (req, res) => {
    try {
        const clientId = req.user.clientId;
        const notifications = [];

        // 1. Check for New Orders (Last 5 orders)
        const recentOrders = await Order.find({ clientId }).sort({ placedOn: -1 }).limit(5);
        for (const order of recentOrders) {
            notifications.push({
                clientId,
                type: 'order',
                title: 'New Order Received',
                message: `Order ${order.orderId} has been placed by ${order.customerDetails?.name || 'a customer'}.`,
                targetLink: '/dashboard/orders',
                createdAt: order.placedOn,
                metadata: { orderId: order._id }
            });
        }

        // 2. Check for Completed Payments (Last 5)
        const paidOrders = await Order.find({
            clientId,
            'invoices.status': 'Paid'
        }).sort({ updatedOn: -1 }).limit(5);
        for (const order of paidOrders) {
            notifications.push({
                clientId,
                type: 'payment',
                title: 'Payment Status: Completed',
                message: `Payment for Order ${order.orderId} has been successfully processed.`,
                targetLink: '/dashboard/orders',
                createdAt: order.updatedOn || order.placedOn,
                metadata: { orderId: order._id }
            });
        }

        // 3. Check for Stock Alerts
        const lowStockProducts = await Product.find({
            clientId,
            $or: [
                { quantity: { $lte: 10 } },
                { 'variants.quantity': { $lte: 10 } }
            ]
        }).limit(20);

        for (const product of lowStockProducts) {
            if (product.hasVariants && product.variants.length > 0) {
                // Find specifically which variants are low
                const lowVariants = product.variants.filter(v => (v.quantity || 0) <= 10);

                for (const variant of lowVariants) {
                    const variantName = `${variant.color || ''}${variant.color && variant.size ? ' / ' : ''}${variant.size || ''}`;
                    notifications.push({
                        clientId,
                        type: 'alert',
                        title: `Stock Alert: ${product.name}`,
                        message: `Variant "${variantName}" is running low. Only ${variant.quantity || 0} remaining.`,
                        targetLink: '/dashboard/products',
                        metadata: { productId: product._id, variantId: variant._id }
                    });
                }
            } else if ((product.quantity || 0) <= 10) {
                // Simple product low stock
                notifications.push({
                    clientId,
                    type: 'alert',
                    title: 'Stock Alert: Low Inventory',
                    message: `Product "${product.name}" is running low on stock. Only ${product.quantity || 0} items remaining.`,
                    targetLink: '/dashboard/products',
                    metadata: { productId: product._id }
                });
            }
        }

        // 4. Check for New Team Members
        const recentUsers = await User.find({ clientId }).sort({ createdAt: -1 }).limit(10);
        for (const user of recentUsers) {
            notifications.push({
                clientId,
                type: 'user',
                title: 'New Team Member Joined',
                message: `${user.name} has joined your team as ${user.role}.`,
                targetLink: '/dashboard/store-user',
                createdAt: user.createdAt || new Date(),
                metadata: { userId: user._id }
            });
        }

        // 5. Fallback: If absolutely nothing, add a Welcome notification
        if (notifications.length === 0) {
            notifications.push({
                clientId,
                type: 'alert',
                title: 'Welcome to your Dashboard!',
                message: 'Your notification system is ready. Recent activities like orders and stock alerts will appear here.',
                targetLink: '/dashboard',
                createdAt: new Date()
            });
        }

        // Filter out duplicates and save
        for (const note of notifications) {
            let query = {
                clientId: note.clientId,
                type: note.type
            };

            // Enhanced deduplication using metadata ID if available
            if (note.metadata) {
                if (note.metadata.orderId) query['metadata.orderId'] = note.metadata.orderId;
                if (note.metadata.productId) query['metadata.productId'] = note.metadata.productId;
                if (note.metadata.variantId) query['metadata.variantId'] = note.metadata.variantId;
                if (note.metadata.userId) query['metadata.userId'] = note.metadata.userId;
            } else {
                // Fallback to message for items without unique metadata IDs
                query.message = note.message;
            }

            const exists = await Notification.findOne(query);

            if (!exists) {
                await new Notification(note).save();
            }
        }

        const finalNotes = await Notification.find({
            clientId,
            isDeleted: { $ne: true }
        }).sort({ createdAt: -1 }).limit(50);
        res.json(finalNotes);
    } catch (err) {
        console.error('Error syncing notifications:', err);
        res.status(500).json({ msg: 'Server Error', error: err.message });
    }
});

// @route   PATCH api/notifications/:id
router.patch('/:id', ensureAuthenticated, async (req, res) => {
    try {
        const notification = await Notification.findOneAndUpdate(
            { _id: req.params.id, clientId: req.user.clientId },
            { status: 'read' },
            { new: true }
        );
        res.json(notification);
    } catch (err) {
        res.status(500).json({ msg: 'Server Error' });
    }
});

// @route   POST api/notifications/mark-all-read
router.post('/mark-all-read', ensureAuthenticated, async (req, res) => {
    try {
        await Notification.updateMany(
            { clientId: req.user.clientId, status: 'unread', isDeleted: { $ne: true } },
            { status: 'read' }
        );
        res.json({ msg: 'All notifications marked as read' });
    } catch (err) {
        res.status(500).json({ msg: 'Server Error' });
    }
});

// @route   DELETE api/notifications/:id
// @desc    Soft delete a notification
router.delete('/:id', ensureAuthenticated, async (req, res) => {
    try {
        await Notification.findOneAndUpdate(
            { _id: req.params.id, clientId: req.user.clientId },
            { isDeleted: true }
        );
        res.json({ msg: 'Notification removed' });
    } catch (err) {
        res.status(500).json({ msg: 'Server Error' });
    }
});

module.exports = router;
