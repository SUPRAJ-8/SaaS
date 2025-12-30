const express = require('express');
const router = express.Router();
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const Product = require('../models/Product');

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

// @route   GET api/products
// @desc    Get all products
// @access  Public
router.get('/', async (req, res) => {
  try {
    const { section, status } = req.query;
    const filter = {};

    if (section && ['Popular', 'Featured', 'None'].includes(section)) {
      filter.section = section;
    }

    // Only filter by status if the status query parameter is provided
    if (status) {
      filter.status = status;
    }

    const products = await Product.find(filter);
    res.json(products);
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server Error');
  }
});


// @route   POST api/products
// @desc    Create a product
// @access  Public
router.post('/', upload.array('images', 10), async (req, res) => {
  try {
    const {
      name, shortDescription, longDescription, gender,
      crossedPrice, sellingPrice, costPrice, quantity, category, sku, status, section,
      variantColors, variantSizes, samePriceForAllVariants
    } = req.body;

    // Validate required fields
    if (!name) {
      return res.status(400).json({ msg: 'Product name is required' });
    }

    // Generate SKU if not provided
    const productSku = sku || `SKU-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;

    // Check if product with SKU already exists
    let existingProduct = await Product.findOne({ sku: productSku });
    if (existingProduct) {
      return res.status(400).json({ msg: 'Product with this SKU already exists' });
    }

    // Parse hasVariants (handle both string and boolean)
    let hasVariants = false;
    if (req.body.hasVariants) {
      if (typeof req.body.hasVariants === 'string') {
        hasVariants = req.body.hasVariants === 'true' || req.body.hasVariants === 'True';
      } else {
        hasVariants = Boolean(req.body.hasVariants);
      }
    }

    // Parse variants
    let variants = [];
    if (hasVariants && req.body.variants) {
      try {
        variants = typeof req.body.variants === 'string' ? JSON.parse(req.body.variants) : req.body.variants;
      } catch (e) {
        console.error('Error parsing variants:', e);
        variants = [];
      }
    }

    // Handle images
    const images = req.files && req.files.length > 0
      ? req.files.map(file => `/uploads/${file.filename}`)
      : [];

    // Convert numeric strings to numbers
    const productData = {
      name,
      shortDescription: shortDescription || '',
      longDescription: longDescription || '',
      gender: gender || 'No use',
      crossedPrice: crossedPrice ? Number(crossedPrice) : 0,
      sellingPrice: sellingPrice ? Number(sellingPrice) : 0,
      costPrice: costPrice ? Number(costPrice) : 0,
      quantity: quantity ? Number(quantity) : 0,
      category: category || null,
      sku: productSku,
      status: status || 'Active',
      section: section || 'None',
      images,
      hasVariants,
      variants,
      variantColors: variantColors ? JSON.parse(variantColors) : [],
      variantSizes: variantSizes ? JSON.parse(variantSizes) : [],
      samePriceForAllVariants: samePriceForAllVariants ? JSON.parse(samePriceForAllVariants) : false
    };

    const product = new Product(productData);
    await product.save();
    res.json(product);
  } catch (err) {
    console.error('Error creating product:', err);
    res.status(500).json({ msg: 'Server Error', error: err.message });
  }
});

// @route   PUT api/products/:id
// @desc    Update a product
// @access  Public
router.put('/:id', upload.array('images', 10), async (req, res) => {
  const {
    name, shortDescription, longDescription, gender,
    crossedPrice, sellingPrice, costPrice, quantity, category, sku, status, section
  } = req.body;

  // Build product object
  const productFields = {};
  if (name) productFields.name = name;
  if (shortDescription) productFields.shortDescription = shortDescription;
  if (longDescription) productFields.longDescription = longDescription;
  if (gender) productFields.gender = gender;
  if (req.body.hasVariants !== undefined) productFields.hasVariants = JSON.parse(req.body.hasVariants);
  if (req.body.variants) productFields.variants = JSON.parse(req.body.variants);
  if (req.body.variantColors) productFields.variantColors = JSON.parse(req.body.variantColors);
  if (req.body.variantSizes) productFields.variantSizes = JSON.parse(req.body.variantSizes);
  if (req.body.samePriceForAllVariants !== undefined) productFields.samePriceForAllVariants = JSON.parse(req.body.samePriceForAllVariants);
  if (category) productFields.category = category;
  if (sku) productFields.sku = sku;
  if (crossedPrice) productFields.crossedPrice = crossedPrice;
  if (sellingPrice) productFields.sellingPrice = sellingPrice;
  if (costPrice) productFields.costPrice = costPrice;
  if (quantity) productFields.quantity = quantity;
  if (status) productFields.status = status;
  if (section !== undefined) productFields.section = section;
  // Handle images merge (existing + new)
  let finalImages = [];

  // 1. Get existing images from the request (sent as JSON string from ProductModal)
  if (req.body.existingImages) {
    try {
      const existing = typeof req.body.existingImages === 'string'
        ? JSON.parse(req.body.existingImages)
        : req.body.existingImages;
      if (Array.isArray(existing)) {
        finalImages = [...existing];
      }
    } catch (e) {
      console.error('Error parsing existingImages:', e);
      if (typeof req.body.existingImages === 'string' && req.body.existingImages.length > 0) {
        finalImages = [req.body.existingImages];
      }
    }
  }

  // 2. Add newly uploaded files
  if (req.files && req.files.length > 0) {
    const newFiles = req.files.map(file => `/uploads/${file.filename}`);
    finalImages = [...finalImages, ...newFiles];
  }

  // 3. Update the product fields ONLY if we have a set of images to update
  // We use req.body.existingImages as a flag that image management was active in the UI
  if (req.body.existingImages !== undefined || (req.files && req.files.length > 0)) {
    productFields.images = finalImages;
  }

  console.log('Received section in request:', req.body.section);
  console.log('FIELDS TO UPDATE:', productFields);

  try {
    let product = await Product.findById(req.params.id);

    if (!product) return res.status(404).json({ msg: 'Product not found' });

    product = await Product.findByIdAndUpdate(
      req.params.id,
      { $set: productFields },
      { new: true }
    );

    res.json(product);
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server Error');
  }
});

// @route   DELETE api/products/:id
// @desc    Delete a product
// @access  Public
router.delete('/:id', async (req, res) => {
  try {
    const product = await Product.findById(req.params.id);

    if (!product) {
      return res.status(404).json({ msg: 'Product not found' });
    }

    await product.deleteOne();

    res.json({ msg: 'Product removed' });
  } catch (err) {
    console.error(err.message);
    if (err.kind === 'ObjectId') {
      return res.status(404).json({ msg: 'Product not found' });
    }
    res.status(500).send('Server Error');
  }
});

// @route   POST api/products/bulk-delete
// @desc    Delete multiple products
// @access  Public
router.post('/bulk-delete', async (req, res) => {
  const { ids } = req.body;
  try {
    await Product.deleteMany({ _id: { $in: ids } });
    res.json({ msg: 'Products deleted' });
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server Error');
  }
});

// @route   POST api/products/bulk-update-status
// @desc    Update status for multiple products
// @access  Public
router.post('/bulk-update-status', async (req, res) => {
  const { ids, status } = req.body;

  // Validate status
  const validStatuses = ['Active', 'Draft', 'Archived'];
  if (!validStatuses.includes(status)) {
    return res.status(400).json({ msg: 'Invalid status value.' });
  }

  try {
    await Product.updateMany({ _id: { $in: ids } }, { $set: { status: status } });
    const updatedProducts = await Product.find({ _id: { $in: ids } });
    res.json(updatedProducts);
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server Error');
  }
});

// @route   GET api/products/:id
// @desc    Get product by ID
// @access  Public
router.get('/:id', async (req, res) => {
  try {
    const product = await Product.findById(req.params.id).populate('category', ['name']);
    if (!product) {
      return res.status(404).json({ msg: 'Product not found' });
    }
    res.json(product);
  } catch (err) {
    console.error(err.message);
    if (err.kind === 'ObjectId') {
      return res.status(404).json({ msg: 'Product not found' });
    }
    res.status(500).send('Server Error');
  }
});

module.exports = router;
