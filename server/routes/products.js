const express = require('express');
const router = express.Router();
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const Product = require('../models/Product');
const { ensureAuthenticated } = require('../middleware/auth');

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
// @desc    Get all products (Filtered by tenant)
// @access  Public (for shop) / Private (for dashboard)
router.get('/', async (req, res) => {
  try {
    const { section, status } = req.query;
    const filter = {};

    // Multi-tenancy isolation
    // Priority: 1. tenantClient (for shop subdomain), 2. authenticated user's clientId (for dashboard), 3. query param
    let clientId = req.tenantClient?._id;

    // If no tenantClient (we're on app subdomain/dashboard), require authentication
    if (!clientId) {
      if (req.user && req.user.clientId) {
        clientId = req.user.clientId;
      } else if (req.query.clientId) {
        clientId = req.query.clientId;
      } else {
        // If on dashboard subdomain without auth, return empty array
        return res.json([]);
      }
    }

    if (!clientId) {
      return res.json([]); // Return empty if no client identified
    }

    filter.clientId = clientId;

    // If coming from shop (tenantClient exists), default to Active products only
    if (req.tenantClient) {
      filter.status = status || 'Active';
    } else if (status) {
      // For dashboard, only filter if status is provided
      filter.status = status;
    }

    if (section && ['Popular', 'Featured', 'None'].includes(section)) {
      filter.section = section;
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
      crossedPrice, sellingPrice, costPrice, quantity, category, subcategory, sku, status, section,
      variantColors, variantSizes, samePriceForAllVariants,
      seoTitle, seoDescription, handle
    } = req.body;

    // Validate required fields
    if (!name) {
      return res.status(400).json({ msg: 'Product name is required' });
    }

    // Multi-tenancy isolation
    const clientId = req.user?.clientId || req.body.clientId;
    if (!clientId) {
      return res.status(400).json({ msg: 'ClientId is required. Are you logged in?' });
    }

    // Generate SKU if not provided
    const productSku = sku || `SKU-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;

    // Check if product with SKU already exists (Within the same client)
    let existingProduct = await Product.findOne({ sku: productSku, clientId });
    if (existingProduct) {
      return res.status(400).json({ msg: 'Product with this SKU already exists in your store' });
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
      clientId,
      shortDescription: shortDescription || '',
      longDescription: longDescription || '',
      gender: gender || 'No use',
      crossedPrice: crossedPrice ? Number(crossedPrice) : 0,
      sellingPrice: sellingPrice ? Number(sellingPrice) : 0,
      costPrice: costPrice ? Number(costPrice) : 0,
      quantity: quantity ? Number(quantity) : 0,
      category: category || null,
      subcategory: subcategory || null,
      sku: productSku,
      status: status || 'Active',
      section: section || 'None',
      images,
      hasVariants,
      variants,
      variantColors: variantColors ? JSON.parse(variantColors) : [],
      variantSizes: variantSizes ? JSON.parse(variantSizes) : [],
      samePriceForAllVariants: samePriceForAllVariants ? JSON.parse(samePriceForAllVariants) : false,
      seoTitle: seoTitle || '',
      seoDescription: seoDescription || '',
      handle: handle || ''
    };

    const product = new Product(productData);
    await product.save();
    res.json(product);
  } catch (err) {
    console.error('Error creating product:', err);
    if (err.code === 11000) {
      return res.status(400).json({ msg: 'Product with this SKU already exists in your store' });
    }
    res.status(500).json({ msg: 'Server Error', error: err.message });
  }
});

// @route   PUT api/products/:id
// @desc    Update a product
// @access  Public
router.put('/:id', upload.array('images', 10), async (req, res) => {
  const {
    name, shortDescription, longDescription, gender,
    crossedPrice, sellingPrice, costPrice, quantity, category, subcategory, sku, status, section,
    seoTitle, seoDescription, handle
  } = req.body;

  try {
    let product = await Product.findById(req.params.id);
    if (!product) return res.status(404).json({ msg: 'Product not found' });

    // Update basic fields if they are provided in req.body
    const fieldsToUpdate = [
      'name', 'shortDescription', 'longDescription', 'gender',
      'category', 'subcategory', 'sku', 'status', 'section',
      'seoTitle', 'seoDescription', 'handle'
    ];

    fieldsToUpdate.forEach(field => {
      if (req.body[field] !== undefined) {
        product[field] = req.body[field];
      }
    });

    // Handle numeric fields separately to allow 0
    const numericFields = ['crossedPrice', 'sellingPrice', 'costPrice', 'quantity'];
    numericFields.forEach(field => {
      if (req.body[field] !== undefined) {
        product[field] = Number(req.body[field]);
      }
    });

    // Handle Booleans
    if (req.body.hasVariants !== undefined) {
      product.hasVariants = req.body.hasVariants === 'true' || req.body.hasVariants === true;
    }
    if (req.body.samePriceForAllVariants !== undefined) {
      product.samePriceForAllVariants = req.body.samePriceForAllVariants === 'true' || req.body.samePriceForAllVariants === true;
    }

    // Handle Arrays (Colors/Sizes)
    if (req.body.variantColors) product.variantColors = JSON.parse(req.body.variantColors);
    if (req.body.variantSizes) product.variantSizes = JSON.parse(req.body.variantSizes);

    // Handle Variants
    if (req.body.variants) {
      const parsedVariants = JSON.parse(req.body.variants);
      console.log('UPDATING VARIANTS:', JSON.stringify(parsedVariants, null, 2));
      product.variants = parsedVariants;
    }

    // Handle Images
    if (req.body.existingImages !== undefined || (req.files && req.files.length > 0)) {
      let finalImages = [];
      if (req.body.existingImages) {
        const existing = typeof req.body.existingImages === 'string'
          ? JSON.parse(req.body.existingImages)
          : req.body.existingImages;
        if (Array.isArray(existing)) finalImages = [...existing];
      }
      if (req.files && req.files.length > 0) {
        const newFiles = req.files.map(file => `/uploads/${file.filename}`);
        finalImages = [...finalImages, ...newFiles];
      }
      product.images = finalImages;
    }

    await product.save();
    res.json(product);
  } catch (err) {
    console.error('Update Error:', err);
    if (err.code === 11000) {
      return res.status(400).json({ msg: 'Product with this SKU already exists' });
    }
    res.status(500).json({ msg: 'Server Error', error: err.message });
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
    let product;
    if (mongoose.Types.ObjectId.isValid(req.params.id)) {
      product = await Product.findById(req.params.id).populate('category', ['name']);
    } else {
      product = await Product.findOne({ handle: req.params.id }).populate('category', ['name']);
    }

    if (!product) {
      return res.status(404).json({ msg: 'Product not found' });
    }

    // Security check
    const currentClientId = req.tenantClient?._id || req.user?.clientId;
    if (currentClientId && product.clientId.toString() !== currentClientId.toString()) {
      return res.status(403).json({ msg: 'Access denied: This product belongs to another store' });
    }

    // For shop context, only show Active products
    if (req.tenantClient && product.status !== 'Active') {
      return res.status(404).json({ msg: 'Product not found or currently unavailable' });
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
