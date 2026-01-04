const express = require('express');
const router = express.Router();
const SiteSetting = require('../models/SiteSetting');

// @route   GET api/public-settings
// @desc    Get global site settings for public consumption
router.get('/', async (req, res) => {
    try {
        const settings = await SiteSetting.findOne().select('tawkToId whatsAppNumber');
        res.json(settings || { tawkToId: '', whatsAppNumber: '' });
    } catch (err) {
        console.error('Error fetching public settings:', err);
        res.status(500).send('Server Error');
    }
});

module.exports = router;
