const express = require('express');
const router = express.Router();
const Website = require('../models/Website');
const Client = require('../models/Client');
const { ensureAuthenticated } = require('../middleware/auth');

// Helper to find or create website for client
const findOrCreateWebsite = async (clientId) => {
    let website = await Website.findOne({ clientId });
    if (!website) {
        website = new Website({ clientId, pages: [] });
        await website.save();
    }
    return website;
};

// @route   GET /api/client-pages
// @desc    Get all pages for the logged-in user's active client
// @access  Private
router.get('/', ensureAuthenticated, async (req, res) => {
    try {
        const website = await findOrCreateWebsite(req.user.clientId);
        res.json(website.pages);
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server Error');
    }
});

// @route   POST /api/client-pages
// @desc    Create or update a page
// @access  Private
router.post('/', ensureAuthenticated, async (req, res) => {
    console.log('📥 [POST] /api/client-pages | Body:', req.body);
    const { id, title, content, slug = '', status, themeId } = req.body;

    try {
        const website = await findOrCreateWebsite(req.user.clientId);

        let pageIndex = -1;

        // If an ID is provided, look for that specific page
        if (id && id.length > 20) { // Check if it looks like a Mongo ID
            pageIndex = website.pages.findIndex(p => p._id.toString() === id);
        } else {
            // Otherwise try to match by slug AND themeId
            pageIndex = website.pages.findIndex(p => p.slug === slug && (p.themeId === themeId || (!p.themeId && themeId === 'nexus')));
        }

        if (pageIndex > -1) {
            // Update existing
            website.pages[pageIndex].title = title;
            website.pages[pageIndex].content = content;
            website.pages[pageIndex].slug = slug;
            website.pages[pageIndex].status = status || website.pages[pageIndex].status;
            website.pages[pageIndex].themeId = themeId || website.pages[pageIndex].themeId || 'nexus';
        } else {
            // Create new
            website.pages.push({
                title,
                content,
                slug,
                status: status || 'published',
                themeId: themeId || 'nexus'
            });
        }

        await website.save();
        res.json(website.pages);
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server Error');
    }
});

// @route   GET /api/client-pages/public/:subdomain
// @desc    Get a specific page or all pages for a subdomain
// @access  Public
router.get('/public/:subdomain', async (req, res) => {
    try {
        const client = await Client.findOne({ subdomain: req.params.subdomain });
        if (!client) {
            return res.status(404).json({ msg: 'Store not found' });
        }

        const website = await Website.findOne({ clientId: client._id });
        if (!website) {
            return res.json([]); // No pages yet
        }

        // Optional: Filter by slug if query param provided
        const { slug } = req.query;

        // Get the active theme from client settings
        const activeThemeId = client.settings?.selectedThemeId || 'ecommerce';

        if (slug !== undefined) {
            const page = website.pages.find(p =>
                p.slug === slug &&
                p.status === 'published' &&
                (p.themeId === activeThemeId || (!p.themeId && activeThemeId === 'nexus'))
            );
            if (!page) return res.status(404).json({ msg: 'Page not found for active theme' });
            return res.json(page);
        }

        // Return all published pages for current theme
        const publishedPages = website.pages.filter(p =>
            p.status === 'published' &&
            (p.themeId === activeThemeId || (!p.themeId && activeThemeId === 'nexus'))
        );
        res.json(publishedPages);
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server Error');
    }
});

module.exports = router;
