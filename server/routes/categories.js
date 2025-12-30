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
// @desc    Get all categories
// @access  Public
router.get('/', async (req, res) => {
  try {
    const categories = await Category.find();
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

    if (!name) {
      return res.status(400).json({ msg: 'Category name is required' });
    }

    const image = req.file ? `/uploads/${req.file.filename}` : req.body.image;

    let category = await Category.findOne({ name });

    if (category) {
      return res.status(400).json({ msg: 'Category already exists' });
    }

    category = new Category({
      name,
      image,
      description,
      status,
      section
    });

    await category.save();
    res.json(category);
  } catch (err) {
    console.error('Error creating category:', err);
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

module.exports = router;
