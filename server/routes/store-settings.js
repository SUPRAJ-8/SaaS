const express = require('express');
const router = express.Router();
const Client = require('../models/Client');
const { ensureAuthenticated } = require('../middleware/auth');

// @route   GET api/store-settings
// @desc    Get settings for the current authenticated user's active store
// @access  Private
router.get('/', ensureAuthenticated, async (req, res) => {
    try {
        // req.user.clientId comes from the session/user object
        const clientId = req.user.clientId?._id || req.user.clientId;
        const client = await Client.findById(clientId);
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

// @route   GET api/store-settings/my-store
// @desc    Get the full client object for the current user (subdomain, domain etc)
// @access  Private
router.get('/my-store', ensureAuthenticated, async (req, res) => {
    try {
        const clientId = req.user.clientId?._id || req.user.clientId;
        const client = await Client.findById(clientId);
        if (!client) {
            return res.status(404).json({ msg: 'Store not found' });
        }
        res.json(client);
    } catch (err) {
        console.error('Error fetching own client:', err.message);
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
            {
                $set: {
                    settings: settings,
                    seoSettings: settings.seoSettings,
                    subdomain: settings.subdomain?.trim() === '' ? null : settings.subdomain?.toLowerCase(),
                    customDomain: settings.customDomain?.trim() === '' ? null : settings.customDomain?.toLowerCase()
                }
            },
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

// @route   GET api/store-settings/delivery-regions/:subdomain
// @desc    Get delivery regions for a store by subdomain (for checkout page)
// @access  Public
// NOTE: This route MUST come before /public/:subdomain to avoid route conflicts
router.get('/delivery-regions/:subdomain', async (req, res) => {
    try {
        let client = req.tenantClient;

        if (!client) {
            console.log('📍 Fetching delivery regions by subdomain:', req.params.subdomain);
            client = await Client.findOne({
                subdomain: { $regex: new RegExp(`^${req.params.subdomain}$`, 'i') }
            });
        }

        if (!client) {
            console.log('❌ Client not found for domain/subdomain:', req.params.subdomain);
            return res.status(404).json({ msg: 'Store not found' });
        }

        const settingsData = client.settings || {};
        const deliveryCharge = settingsData.deliveryCharge || {};
        const regions = deliveryCharge.allRegions || [];

        console.log('✅ Returning', regions.length, 'delivery regions for', client.name);
        res.json({ regions });
    } catch (err) {
        console.error('Error fetching delivery regions:', err.message);
        res.status(500).send('Server Error');
    }
});

// @route   GET api/store-settings/public/:subdomain
// @desc    Get PUBLIC settings for a store by subdomain
// @access  Public
router.get('/public/:subdomain', async (req, res) => {
    try {
        let client = req.tenantClient;

        if (!client) {
            client = await Client.findOne({
                subdomain: { $regex: new RegExp(`^${req.params.subdomain}$`, 'i') }
            });
        }

        if (!client) {
            return res.status(404).json({ msg: 'Store not found' });
        }

        const settingsData = client.settings || {};
        if (!settingsData.storeName) {
            settingsData.storeName = client.name;
        }
        res.json(settingsData);
    } catch (err) {
        console.error('Error fetching public store settings:', err.message);
        res.status(500).send('Server Error');
    }
});

module.exports = router;
