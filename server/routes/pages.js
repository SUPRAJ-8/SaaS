const express = require('express');
const router = express.Router();
const Website = require('../models/Website');
const { check, validationResult } = require('express-validator');

// @route   POST /api/pages/:websiteId
// @desc    Add a new page to a website
// @access  Public (should be Private)
router.post(
    '/:websiteId',
    [
        check('title', 'Title is required').not().isEmpty(),
        check('content', 'Content is required').not().isEmpty(),
        check('slug', 'Slug is required').not().isEmpty(),
    ],
    async (req, res) => {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({ errors: errors.array() });
        }

        try {
            const website = await Website.findById(req.params.websiteId);

            if (!website) {
                return res.status(404).json({ msg: 'Website not found' });
            }

            const newPage = {
                title: req.body.title,
                content: req.body.content,
                slug: req.body.slug,
                metaDescription: req.body.metaDescription,
                status: req.body.status || 'draft',
            };

            website.pages.push(newPage);

            await website.save();

            res.json(website);
        } catch (err) {
            console.error(err.message);
            res.status(500).send('Server Error');
        }
    }
);

// @route   GET /api/pages/:websiteId
// @desc    Get all pages for a website
// @access  Public (should be Private)
router.get('/:websiteId', async (req, res) => {
    try {
        const website = await Website.findById(req.params.websiteId);
        if (!website) return res.status(404).json({ msg: 'Website not found' });

        res.json(website.pages);
    } catch (err) {
        console.error(err.message);
        if (err.kind === 'ObjectId') {
            return res.status(404).json({ msg: 'Website not found' });
        }
        res.status(500).send('Server Error');
    }
});

// @route   PUT /api/pages/:websiteId/:pageId
// @desc    Update a page
// @access  Public (should be Private)
router.put('/:websiteId/:pageId', async (req, res) => {
    try {
        const website = await Website.findById(req.params.websiteId);
        if (!website) return res.status(404).json({ msg: 'Website not found' });

        const page = website.pages.id(req.params.pageId);
        if (!page) return res.status(404).json({ msg: 'Page not found' });

        if (req.body.title) page.title = req.body.title;
        if (req.body.content) page.content = req.body.content;
        if (req.body.slug) page.slug = req.body.slug;
        if (req.body.metaDescription) page.metaDescription = req.body.metaDescription;
        if (req.body.status) page.status = req.body.status;

        await website.save();
        res.json(website);
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server Error');
    }
});

// @route   DELETE /api/pages/:websiteId/:pageId
// @desc    Delete a page
// @access  Public (should be Private)
router.delete('/:websiteId/:pageId', async (req, res) => {
    try {
        const website = await Website.findById(req.params.websiteId);
        if (!website) return res.status(404).json({ msg: 'Website not found' });

        // Filter out the page to delete
        website.pages = website.pages.filter(
            page => page.id.toString() !== req.params.pageId
        );

        await website.save();
        res.json(website);
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server Error');
    }
});

module.exports = router;
