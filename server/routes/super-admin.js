const express = require('express');
const router = express.Router();
const Client = require('../models/Client');
const User = require('../models/User');
const Product = require('../models/Product');
const Order = require('../models/Order');
const SiteSetting = require('../models/SiteSetting');

// Test route to verify routing works
router.get('/test', (req, res) => {
    console.log('✅ GET /api/super-admin/test route hit');
    res.json({ message: 'Super admin route is working!' });
});

// Root route for debugging
router.get('/', (req, res) => {
    console.log('✅ GET /api/super-admin route hit');
    res.json({ message: 'Super admin routes are available', routes: ['/clients', '/test'] });
});

// @route   GET api/super-admin/clients
// @desc    Get all tenants/clients
// @access  Super Admin (In production, add Auth middleware here)
router.get('/clients', async (req, res) => {
    console.log('✅ GET /api/super-admin/clients route hit');
    try {
        const clients = await Client.find().sort({ createdAt: -1 }).lean();

        if (!clients || clients.length === 0) {
            return res.json([]);
        }

        // Enhance each client with owner info, product count, and order count
        const enhancedClients = await Promise.all(clients.map(async (client) => {
            try {
                // Find owner (the first user created for this client)
                const owner = await User.findOne({ clientId: client._id }).sort({ createdAt: 1 }).lean();

                // Count products
                const productCount = await Product.countDocuments({ clientId: client._id });

                // Count orders
                const orderCount = await Order.countDocuments({ clientId: client._id });

                // Count total stores owned by this user email
                const totalUserStores = client.ownerEmail ? await Client.countDocuments({ ownerEmail: client.ownerEmail }) : 0;

                return {
                    ...client,
                    ownerName: owner ? owner.name : 'Unknown User',
                    ownerPhone: owner ? owner.phoneNumber : 'N/A',
                    productCount: productCount,
                    orderCount: orderCount,
                    totalUserStores: totalUserStores
                };
            } catch (innerErr) {
                console.error(`Error enhancing client ${client._id}:`, innerErr);
                return {
                    ...client,
                    ownerName: 'Error Loading',
                    ownerPhone: 'N/A',
                    productCount: 0,
                    orderCount: 0,
                    totalUserStores: 0
                };
            }
        }));

        res.json(enhancedClients);
    } catch (err) {
        console.error('Error in GET /clients:', err.message);
        res.status(500).send('Server Error');
    }
});
// @route   GET api/super-admin/clients/:id
// @desc    Get client by ID
router.get('/clients/:id', async (req, res) => {
    try {
        const client = await Client.findById(req.params.id);
        if (!client) return res.status(404).json({ msg: 'Client not found' });
        res.json(client);
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server Error');
    }
});
// @desc    Update client subscription
router.patch('/clients/:id', async (req, res) => {
    const { subscriptionPlan, subscriptionStatus, subdomain } = req.body;
    try {
        let client = await Client.findById(req.params.id);
        if (!client) return res.status(404).json({ msg: 'Client not found' });

        if (subscriptionPlan) client.subscriptionPlan = subscriptionPlan;
        if (subscriptionStatus) client.subscriptionStatus = subscriptionStatus;
        if (subdomain) client.subdomain = subdomain;

        await client.save();
        res.json(client);
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server Error');
    }
});
// @route   GET api/super-admin/user-stores/:email
// @desc    Get all stores for a specific owner email
router.get('/user-stores/:email', async (req, res) => {
    try {
        const clients = await Client.find({ ownerEmail: req.params.email.toLowerCase() }).sort({ createdAt: -1 }).lean();

        const enhancedStores = await Promise.all(clients.map(async (client) => {
            const productCount = await Product.countDocuments({ clientId: client._id });
            const orderCount = await Order.countDocuments({ clientId: client._id });

            return {
                ...client,
                productCount,
                orderCount
            };
        }));

        res.json(enhancedStores);
    } catch (err) {
        console.error('Error fetching user stores:', err);
        res.status(500).send('Server Error');
    }
});

// @route   DELETE api/super-admin/clients/:id
// @desc    Delete a tenant and all its associated data
router.delete('/clients/:id', async (req, res) => {
    try {
        const clientId = req.params.id;

        // Verify client exists
        const client = await Client.findById(clientId);
        if (!client) {
            return res.status(404).json({ msg: 'Client not found' });
        }

        // 1. Delete all users associated with this client
        await User.deleteMany({ clientId: clientId });

        // 2. Delete all products associated with this client
        await Product.deleteMany({ clientId: clientId });

        // 3. Delete all orders associated with this client
        await Order.deleteMany({ clientId: clientId });

        // 4. Finally, delete the client itself
        await Client.findByIdAndDelete(clientId);

        res.json({ msg: 'Tenant and all associated data deleted successfully' });
    } catch (err) {
        console.error('Error deleting tenant:', err.message);
        res.status(500).send('Server Error');
    }
});

// @route   GET api/super-admin/site-settings
// @desc    Get global site settings
router.get('/site-settings', async (req, res) => {
    try {
        let settings = await SiteSetting.findOne();
        if (!settings) {
            settings = await SiteSetting.create({ tawkToId: '' });
        }
        res.json(settings);
    } catch (err) {
        console.error('Error fetching site settings:', err);
        res.status(500).send('Server Error');
    }
});

// @route   POST api/super-admin/site-settings
// @desc    Update global site settings
router.post('/site-settings', async (req, res) => {
    const { tawkToId, whatsAppNumber } = req.body;
    try {
        const settings = await SiteSetting.findOneAndUpdate(
            {},
            { tawkToId, whatsAppNumber },
            { upsert: true, new: true, setDefaultsOnInsert: true }
        );
        res.json(settings);
    } catch (err) {
        console.error('Error updating site settings:', err);
        res.status(500).json({ msg: 'Server error updating settings', error: err.message });
    }
});

// @route   GET api/super-admin/dashboard-stats
// @desc    Get aggregated stats for Super Admin Dashboard
router.get('/dashboard-stats', async (req, res) => {
    try {
        const totalStores = await Client.countDocuments();
        const activeSubscriptions = await Client.countDocuments({ subscriptionStatus: 'active' });
        const totalUsers = await User.countDocuments();

        // Calculate Total Platform Revenue (Sum of all orders)
        const allOrders = await Order.find({}, 'payment.total');
        const platformRevenue = allOrders.reduce((acc, order) => acc + (order.payment?.total || 0), 0);

        // Get recent stores
        const recentStores = await Client.find()
            .sort({ createdAt: -1 })
            .limit(5)
            .lean();

        // Get plan distribution
        const planDistribution = await Client.aggregate([
            { $group: { _id: '$subscriptionPlan', count: { $sum: 1 } } }
        ]);

        // Get monthly signups (last 6 months)
        const sixMonthsAgo = new Date();
        sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6);

        const monthlySignups = await Client.aggregate([
            { $match: { createdAt: { $gte: sixMonthsAgo } } },
            {
                $group: {
                    _id: {
                        month: { $month: '$createdAt' },
                        year: { $year: '$createdAt' }
                    },
                    count: { $sum: 1 }
                }
            },
            { $sort: { '_id.year': 1, '_id.month': 1 } }
        ]);

        res.json({
            totalStores,
            activeSubscriptions,
            totalUsers,
            platformRevenue,
            recentStores,
            planDistribution,
            monthlySignups
        });
    } catch (err) {
        console.error('Error fetching dashboard stats:', err);
        res.status(500).send('Server Error');
    }
});

// @route   POST api/super-admin/bulk-delete
// @desc    Bulk delete tenants and all their associated data
router.post('/bulk-delete', async (req, res) => {
    const { ids } = req.body;
    console.log(`🗑️ Bulk delete request received for ${ids?.length} tenants:`, ids);
    try {
        if (!ids || !Array.isArray(ids)) {
            return res.status(400).json({ msg: 'Invalid IDs provided' });
        }

        // For each client ID, delete associated data
        console.log('🔄 Bulk Deleting sub-data (Users, Products, Orders)...');
        const results = await Promise.all(ids.map(async (clientId) => {
            const u = await User.deleteMany({ clientId });
            const p = await Product.deleteMany({ clientId });
            const o = await Order.deleteMany({ clientId });
            return { clientId, users: u.deletedCount, products: p.deletedCount, orders: o.deletedCount };
        }));
        console.log('📊 Bulk Sub-data deletion results:', results);

        // Finally delete the clients
        console.log('🔄 Deleting Client records from DB...');
        const clientDeleteResult = await Client.deleteMany({ _id: { $in: ids } });
        console.log(`✅ Bulk Delete Complete. Deleted ${clientDeleteResult.deletedCount} clients.`);

        res.json({ msg: `${ids.length} tenants and associated data deleted successfully` });
    } catch (err) {
        console.error('Error bulk deleting tenants:', err.message);
        res.status(500).send('Server Error');
    }
});

// @route   POST api/super-admin/bulk-plan
// @desc    Bulk update subscription plans for tenants
router.post('/bulk-plan', async (req, res) => {
    const { ids, plan } = req.body;
    console.log(`📈 Bulk plan update request received for ${ids?.length} tenants to plan: ${plan}`);
    try {
        if (!ids || !Array.isArray(ids) || !plan) {
            return res.status(400).json({ msg: 'Invalid request data' });
        }

        const updateResult = await Client.updateMany(
            { _id: { $in: ids } },
            { $set: { subscriptionPlan: plan } }
        );
        console.log(`✅ Bulk Plan Update Complete. Matched: ${updateResult.matchedCount}, Modified: ${updateResult.modifiedCount}`);

        res.json({
            msg: `Successfully updated ${updateResult.modifiedCount} tenants to ${plan} plan`,
            details: updateResult
        });
    } catch (err) {
        console.error('Error bulk updating plans:', err.message);
        res.status(500).send('Server Error');
    }
});

module.exports = router;
