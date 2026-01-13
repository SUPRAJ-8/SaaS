const express = require('express');
const router = express.Router();
const Product = require('../models/Product');
const Category = require('../models/Category');
const Client = require('../models/Client');
const Website = require('../models/Website');
const Template = require('../models/Template');
const { ensureAuthenticated } = require('../middleware/auth');

// @route   GET /api/media
// @desc    Get all media/images used in the store
// @access  Private (Tenant)
router.get('/', ensureAuthenticated, async (req, res) => {
    console.log('🖼️ [Media] fetching all media for tenant...');
    try {
        const clientId = req.tenantId || req.user.clientId;
        if (!clientId) {
            console.error('❌ [Media] No clientId found in request');
            return res.status(400).json({ msg: 'No client/tenant identified' });
        }

        // Parallel fetching
        const [products, categories, client, website, templates] = await Promise.all([
            Product.find({ clientId }),
            Category.find({ clientId }),
            Client.findById(clientId),
            Website.findOne({ clientId }),
            Template.find({ isActive: true }) // Also show images from active templates
        ]);

        const images = new Set();

        // 1. From products
        products.forEach(p => {
            if (p.images && Array.isArray(p.images)) {
                p.images.forEach(img => {
                    if (img) images.add(img);
                });
            }
        });

        // 2. From categories
        categories.forEach(c => {
            if (c.image) images.add(c.image);
        });

        // 3. From client settings
        if (client && client.settings) {
            if (client.settings.logo) images.add(client.settings.logo);
            if (client.settings.favicon) images.add(client.settings.favicon);
        }

        // 4. From website pages
        if (website && website.pages) {
            website.pages.forEach(page => {
                if (page.content) {
                    // Primitive regex to find anything that looks like an upload URL or external image
                    // Matches /uploads/filename.ext or http...filename.ext
                    const regex = /(?:https?:\/\/[^\s"'<>]+\.(?:png|jpg|jpeg|gif|webp|svg)|(?:\/uploads\/[^\s"'<>]+))/gi;
                    const matches = page.content.match(regex);
                    if (matches) {
                        matches.forEach(m => images.add(m));
                    }
                }
            });
        }

        // 5. From templates
        if (templates && Array.isArray(templates)) {
            templates.forEach(t => {
                if (t.thumbnail) images.add(t.thumbnail);

                // If template has default settings with image URLs
                if (t.defaultSettings) {
                    const settingsStr = JSON.stringify(t.defaultSettings);
                    const regex = /(?:https?:\/\/[^\s"'<>]+\.(?:png|jpg|jpeg|gif|webp|svg)|(?:\/uploads\/[^\s"'<>]+))/gi;
                    const matches = settingsStr.match(regex);
                    if (matches) {
                        matches.forEach(m => images.add(m));
                    }
                }
            });
        }

        // Convert set to array and format properly
        // We can also attach metadata like "Used In" later if needed
        const mediaList = Array.from(images).map(url => ({
            url,
            name: url.split('/').pop(),
        }));

        res.json(mediaList);
    } catch (err) {
        console.error('Error fetching media:', err);
        res.status(500).json({ msg: 'Server error' });
    }
});

module.exports = router;
