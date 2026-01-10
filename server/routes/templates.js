const express = require('express');
const router = express.Router();
const Template = require('../models/Template');
const multer = require('multer');

// Configure upload
const storage = multer.memoryStorage();
const upload = multer({ storage: storage });

// @route   GET /api/templates
// @desc    Get all active templates (Public/Client usage)
router.get('/', async (req, res) => {
    try {
        const templates = await Template.find({ isActive: true });
        res.json(templates);
    } catch (err) {
        res.status(500).json({ msg: 'Server error' });
    }
});

// @route   GET /api/templates/admin
// @desc    Get all templates (Super Admin) - Middleware needed later
router.get('/admin', async (req, res) => {
    try {
        const templates = await Template.find().sort({ createdAt: -1 });
        res.json(templates);
    } catch (err) {
        res.status(500).json({ msg: 'Server error' });
    }
});

// @route   POST /api/templates
// @desc    Create a new template
router.post('/', async (req, res) => {
    try {
        const { id, name, type, schema, fields, defaultSettings, structure, styles, baseType, category, description, thumbnail } = req.body;

        // Check if ID exists
        const existing = await Template.findOne({ id });
        if (existing) {
            return res.status(400).json({ msg: 'Template ID already exists' });
        }

        const newTemplate = new Template({
            id: id || name.toLowerCase().replace(/\s+/g, '-'),
            name,
            type: type || 'dynamic',
            schema: schema || [],
            fields: fields || [],
            defaultSettings: defaultSettings || {},
            structure: structure || {},
            styles: styles || '',
            baseType,
            category: category || 'General',
            description,
            thumbnail
        });

        await newTemplate.save();
        res.json(newTemplate);
    } catch (err) {
        console.error(err);
        res.status(500).json({ msg: 'Server error' });
    }
});

// @route   PUT /api/templates/:id
// @desc    Update a template
router.put('/:id', async (req, res) => {
    try {
        // Find by _id or id string
        let template = await Template.findById(req.params.id);
        if (!template) {
            template = await Template.findOne({ id: req.params.id });
        }

        if (!template) {
            return res.status(404).json({ msg: 'Template not found' });
        }

        const { name, schema, fields, defaultSettings, structure, styles, isActive, category, description, thumbnail } = req.body;

        if (name) template.name = name;
        if (schema) template.schema = schema;
        if (fields) template.fields = fields;
        if (defaultSettings) template.defaultSettings = defaultSettings;
        if (structure) template.structure = structure;
        if (styles !== undefined) template.styles = styles;
        if (isActive !== undefined) template.isActive = isActive;
        if (category) template.category = category;
        if (description) template.description = description;
        if (thumbnail) template.thumbnail = thumbnail;

        template.updatedAt = Date.now();

        await template.save();
        res.json(template);
    } catch (err) {
        console.error(err);
        res.status(500).json({ msg: 'Server error' });
    }
});

// @route   DELETE /api/templates/:id
// @desc    Delete a template
router.delete('/:id', async (req, res) => {
    try {
        await Template.findByIdAndDelete(req.params.id);
        res.json({ msg: 'Template removed' });
    } catch (err) {
        res.status(500).json({ msg: 'Server error' });
    }
});

// @route   POST /api/templates/upload
// @desc    Upload a template JSON file
router.post('/upload', upload.single('templateFile'), async (req, res) => {
    try {
        if (!req.file) {
            return res.status(400).json({ msg: 'No file uploaded' });
        }

        // Parse JSON content
        const jsonContent = req.file.buffer.toString('utf8');
        let templateData;
        try {
            templateData = JSON.parse(jsonContent);
        } catch (e) {
            return res.status(400).json({ msg: 'Invalid JSON file' });
        }

        // Basic Validation
        if (!templateData.name || !templateData.id) {
            return res.status(400).json({ msg: 'Template JSON missing required fields (name, id)' });
        }

        // Upsert (Update if exists, Insert if not)
        let template = await Template.findOne({ id: templateData.id });

        if (template) {
            // Update
            Object.assign(template, templateData);
            template.updatedAt = Date.now();
            await template.save();
            res.json({ msg: `Template '${template.name}' updated successfully`, template });
        } else {
            // Create
            template = new Template(templateData);
            if (!template.type) template.type = 'dynamic'; // Default
            await template.save();
            res.json({ msg: `Template '${template.name}' created successfully`, template });
        }

    } catch (err) {
        console.error(err);
        res.status(500).json({ msg: 'Server error processing upload' });
    }
});


module.exports = router;
