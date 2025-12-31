const express = require('express');
const router = express.Router();
const Client = require('../models/Client');

// @route   GET api/super-admin/clients
// @desc    Get all tenants/clients
// @access  Super Admin (In production, add Auth middleware here)
router.get('/clients', async (req, res) => {
    try {
        const clients = await Client.find().sort({ createdAt: -1 });
        res.json(clients);
    } catch (err) {
        console.error(err.message);
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
    const { subscriptionPlan, subscriptionStatus } = req.body;
    try {
        let client = await Client.findById(req.params.id);
        if (!client) return res.status(404).json({ msg: 'Client not found' });

        if (subscriptionPlan) client.subscriptionPlan = subscriptionPlan;
        if (subscriptionStatus) client.subscriptionStatus = subscriptionStatus;

        await client.save();
        res.json(client);
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server Error');
    }
});

module.exports = router;
