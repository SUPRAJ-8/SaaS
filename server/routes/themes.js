const express = require('express');
const router = express.Router();
const Theme = require('../models/Theme');
const Client = require('../models/Client');
const Website = require('../models/Website');
const { ensureAuthenticated } = require('../middleware/auth');
const multer = require('multer');
const AdmZip = require('adm-zip');
const path = require('path');

// Multer config
const storage = multer.memoryStorage();
const upload = multer({
    storage,
    fileFilter: (req, file, cb) => {
        const ext = path.extname(file.originalname).toLowerCase();
        if (ext !== '.zip') {
            return cb(new Error('Only .zip files are allowed'), false);
        }
        cb(null, true);
    }
});

// @route   POST api/themes/apply/:id
// @desc    Apply a theme to a store and clone blueprint if needed
// @access  Private (Store Admin)
router.post('/apply/:id', ensureAuthenticated, async (req, res) => {
    try {
        const theme = await Theme.findById(req.params.id);
        if (!theme) return res.status(404).json({ msg: 'Theme not found' });

        // 1. Update Client Settings
        const client = await Client.findById(req.user.clientId);
        if (!client) return res.status(404).json({ msg: 'Store not found' });

        if (!client.settings) client.settings = {};
        client.settings.selectedThemeId = theme.id;
        await client.save();

        // 2. Clone Blueprint to Home Page if not exists
        let website = await Website.findOne({ clientId: req.user.clientId });
        if (!website) {
            website = new Website({ clientId: req.user.clientId, pages: [] });
        }

        // Check if this theme already has a home page (slug: '')
        const homePageIndex = website.pages.findIndex(p => p.slug === '' && p.themeId === theme.id);

        if (homePageIndex === -1) {
            // Create home page from blueprint
            website.pages.push({
                title: 'Home',
                slug: '',
                content: JSON.stringify(theme.blueprint),
                themeId: theme.id,
                status: 'published'
            });
            await website.save();
        }

        res.json({ msg: `Theme '${theme.name}' applied successfully`, themeId: theme.id });
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server Error');
    }
});

// @route   GET api/themes
// @desc    Get all themes
// @access  Public (for stores to browse)
router.get('/', async (req, res) => {
    try {
        const themes = await Theme.find({ isActive: true }).sort({ createdAt: -1 });
        res.json(themes);
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server Error');
    }
});

// @route   GET api/themes/admin
// @desc    Get all themes including inactive (for super admin)
// @access  Private (Super Admin)
router.get('/admin', async (req, res) => {
    try {
        const themes = await Theme.find().sort({ createdAt: -1 });
        res.json(themes);
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server Error');
    }
});

// @route   POST api/themes
// @desc    Create a new theme
// @access  Private (Super Admin)
router.post('/', async (req, res) => {
    try {
        const newTheme = new Theme(req.body);
        const theme = await newTheme.save();
        res.json(theme);
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server Error');
    }
});

// @route   PUT api/themes/:id
// @desc    Update a theme
// @access  Private (Super Admin)
router.put('/:id', async (req, res) => {
    try {
        let theme = await Theme.findById(req.params.id);
        if (!theme) return res.status(404).json({ msg: 'Theme not found' });

        theme = await Theme.findByIdAndUpdate(
            req.params.id,
            { $set: req.body },
            { new: true }
        );
        res.json(theme);
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server Error');
    }
});

// @route   DELETE api/themes/:id
// @desc    Delete a theme
// @access  Private (Super Admin)
router.delete('/:id', async (req, res) => {
    try {
        const theme = await Theme.findById(req.params.id);
        if (!theme) return res.status(404).json({ msg: 'Theme not found' });

        await Theme.findByIdAndDelete(req.params.id);
        res.json({ msg: 'Theme removed' });
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server Error');
    }
});

// @route   POST api/themes/upload-zip
// @desc    Upload a theme via ZIP file
// @access  Private (Super Admin)
router.post('/upload-zip', upload.single('themeZip'), async (req, res) => {
    try {
        if (!req.file) {
            return res.status(400).json({ msg: 'Please upload a ZIP file' });
        }

        const zip = new AdmZip(req.file.buffer);
        const zipEntries = zip.getEntries();

        // Find theme.json
        const themeJsonEntry = zipEntries.find(entry => entry.entryName === 'theme.json');

        if (!themeJsonEntry) {
            return res.status(400).json({ msg: 'ZIP package must contain a theme.json file' });
        }

        const themeData = JSON.parse(themeJsonEntry.getData().toString('utf8'));

        // Basic validation
        if (!themeData.name || !themeData.id) {
            return res.status(400).json({ msg: 'theme.json is missing required fields (name, id)' });
        }

        // Normalize Category
        if (themeData.category) {
            const validCategories = ['Ecommerce', 'Portfolio', 'Service', 'Other'];
            const capitalized = themeData.category.charAt(0).toUpperCase() + themeData.category.slice(1).toLowerCase();
            if (validCategories.includes(capitalized)) {
                themeData.category = capitalized;
            } else {
                themeData.category = 'Other'; // Fallback
            }
        }

        // Check if theme with same ID already exists
        let theme = await Theme.findOne({ id: themeData.id });
        if (theme) {
            // Update existing
            theme = await Theme.findOneAndUpdate(
                { id: themeData.id },
                { $set: themeData },
                { new: true }
            );
        } else {
            // Create new
            theme = new Theme(themeData);
            await theme.save();
        }

        res.json({ msg: `Theme '${theme.name}' uploaded and processed successfully`, theme });
    } catch (err) {
        console.error(err);
        if (err.name === 'SyntaxError') {
            return res.status(400).json({ msg: 'Invalid JSON in theme.json' });
        }
        res.status(500).send('Server Error');
    }
});

module.exports = router;
