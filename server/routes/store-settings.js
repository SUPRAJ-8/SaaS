const express = require('express');
const router = express.Router();
const Client = require('../models/Client');
const { ensureAuthenticated } = require('../middleware/auth');

// @route   GET api/store-settings
// @desc    Get settings for the current authenticated user's active store
// @access  Private
router.get('/', ensureAuthenticated, async (req, res) => {
    try {
        // req.user.clientId comes from the session/user object, which we updated in switch-store
        const client = await Client.findById(req.user.clientId);
        if (!client) {
            return res.status(404).json({ msg: 'Store not found' });
        }
        const settings = client.settings || {};
        if (!settings.storeName) {
            settings.storeName = client.name;
        }
        res.json(settings);
    } catch (err) {
        console.error('Error fetching store settings:', err.message);
        res.status(500).send('Server Error');
    }
});

// @route   PUT api/store-settings
// @desc    Update settings for the current authenticated user's active store
// @access  Private
router.put('/', ensureAuthenticated, async (req, res) => {
    try {
        const settings = req.body;

        // Find by ID and update the settings field
        const client = await Client.findByIdAndUpdate(
            req.user.clientId,
            { $set: { settings: settings } },
            { new: true }
        );

        if (!client) {
            return res.status(404).json({ msg: 'Store not found' });
        }

        console.log(`✅ Settings updated for store: ${client.name}`);
        res.json(client.settings);
    } catch (err) {
        console.error('Error updating store settings:', err.message);
        res.status(500).send('Server Error');
    }
});

// @route   GET api/store-settings/public/:subdomain
// @desc    Get PUBLIC settings for a store by subdomain
// @access  Public
router.get('/public/:subdomain', async (req, res) => {
    try {
        // Case insensitive search for subdomain
        const client = await Client.findOne({
            subdomain: { $regex: new RegExp(`^${req.params.subdomain}$`, 'i') }
        });

        if (!client) {
            return res.status(404).json({ msg: 'Store not found' });
        }

        // Return settings with fallback for storeName
        const settings = client.settings || {};
        if (!settings.storeName) {
            settings.storeName = client.name;
        }
        res.json(settings);
    } catch (err) {
        console.error('Error fetching public store settings:', err.message);
        res.status(500).send('Server Error');
    }
});

module.exports = router;
