const express = require('express');
const router = express.Router();
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const Category = require('../models/Category');

// Create uploads directory if it doesn't exist
const uploadsDir = path.resolve(__dirname, '..', 'uploads');
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir);
}

// Set up multer for file storage
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, uploadsDir);
  },
  filename: function (req, file, cb) {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, uniqueSuffix + path.extname(file.originalname));
  }
});

const upload = multer({ storage: storage });

// @route   GET api/categories
// @desc    Get all categories (Filtered by tenant)
// @access  Public
router.get('/', async (req, res) => {
  try {
    const hostname = req.hostname;
    const headerSubdomain = req.headers['x-subdomain'];
    console.log(`📡 [GET] /api/categories | Host: ${hostname} | X-Subdomain: ${headerSubdomain}`);

    const clientId = req.tenantClient?._id || req.query.clientId || (req.user && req.user.clientId);
    console.log(`🔑 Identified ClientId: ${clientId}`);

    if (!clientId) {
      console.log('⚠️ No ClientId found for categories request');
      return res.json([]);
    }
    const categories = await Category.find({ clientId });
    console.log(`✅ Found ${categories.length} categories`);
    res.json(categories);
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server Error');
  }
});

// @route   POST api/categories
// @desc    Create a category
// @access  Public
router.post('/', upload.single('image'), async (req, res) => {
  try {
    const { name, description, status, section } = req.body;

    const clientId = req.user?.clientId || req.body.clientId;
    if (!clientId) {
      return res.status(400).json({ msg: 'ClientId is required' });
    }

    if (!name) {
      return res.status(400).json({ msg: 'Category name is required' });
    }

    const image = req.file ? `/uploads/${req.file.filename}` : req.body.image;

    // Name uniqueness check within the same client
    let category = await Category.findOne({ name, clientId });

    if (category) {
      return res.status(400).json({ msg: 'Category already exists for this store' });
    }

    category = new Category({
      name,
      clientId,
      image,
      description,
      status,
      section
    });

    await category.save();
    res.json(category);
  } catch (err) {
    console.error('Error creating category:', err);
    if (err.code === 11000) {
      return res.status(400).json({ msg: 'Category with this name already exists in your store' });
    }
    res.status(500).json({ msg: 'Server Error', error: err.message });
  }
});

// @route   PUT api/categories/:id
// @desc    Update a category
// @access  Public
router.put('/:id', upload.single('image'), async (req, res) => {
  try {
    const { name, description, status, section } = req.body;

    // Build category object
    const categoryFields = {};
    if (name) categoryFields.name = name;
    if (req.file) {
      categoryFields.image = `/uploads/${req.file.filename}`;
    } else if (req.body.image) {
      categoryFields.image = req.body.image;
    }
    if (description !== undefined) categoryFields.description = description;
    if (status) categoryFields.status = status;
    if (section) categoryFields.section = section;
    if (req.body.subcategories) categoryFields.subcategories = req.body.subcategories;

    let category = await Category.findById(req.params.id);

    if (!category) return res.status(404).json({ msg: 'Category not found' });

    category = await Category.findByIdAndUpdate(
      req.params.id,
      { $set: categoryFields },
      { new: true }
    );

    res.json(category);
  } catch (err) {
    console.error('Error updating category:', err);
    res.status(500).json({ msg: 'Server Error', error: err.message });
  }
});

// @route   DELETE api/categories/:id
// @desc    Delete a category
// @access  Public
router.delete('/:id', async (req, res) => {
  try {
    const category = await Category.findById(req.params.id);
    if (!category) {
      return res.status(404).json({ msg: 'Category not found' });
    }

    await Category.findByIdAndDelete(req.params.id);
    res.json({ msg: 'Category removed' });
  } catch (err) {
    console.error('Error deleting category:', err);
    res.status(500).send('Server Error');
  }
});

// @route   POST api/categories/bulk-delete
// @desc    Delete multiple categories
// @access  Private
router.post('/bulk-delete', async (req, res) => {
  try {
    const { ids } = req.body;
    const clientId = req.user?.clientId || req.body.clientId;

    if (!ids || !Array.isArray(ids)) {
      return res.status(400).json({ msg: 'Invalid IDs' });
    }

    if (!clientId) {
      return res.status(401).json({ msg: 'Unauthorized' });
    }

    await Category.deleteMany({ _id: { $in: ids }, clientId });
    res.json({ msg: 'Categories deleted' });
  } catch (err) {
    console.error('Error bulk deleting categories:', err);
    res.status(500).send('Server Error');
  }
});

// @route   POST api/categories/bulk-status
// @desc    Update status for multiple categories
// @access  Private
router.post('/bulk-status', async (req, res) => {
  try {
    const { ids, status } = req.body;
    const clientId = req.user?.clientId || req.body.clientId;

    if (!ids || !Array.isArray(ids) || !status) {
      return res.status(400).json({ msg: 'Invalid request' });
    }

    if (!clientId) {
      return res.status(401).json({ msg: 'Unauthorized' });
    }

    await Category.updateMany(
      { _id: { $in: ids }, clientId },
      { $set: { status } }
    );

    res.json({ msg: 'Categories status updated' });
  } catch (err) {
    console.error('Error bulk updating categories status:', err);
    res.status(500).send('Server Error');
  }
});

module.exports = router;
