const express = require('express');
const router = express.Router();
const Product = require('../models/Product');

const products = [
  {
    name: 'Premium Faux Leather Brown Jacket - Stylish & Comfortable',
    sku: 'SP001',
    sellingPrice: 5000.00,
    status: 'Active',
    images: ['/uploads/sample1.jpg'],
  },
  {
    name: 'Jordan Low Panda Edition | 7A Grade Premium Quality Sneakers',
    sku: 'SP002',
    sellingPrice: 2500.00,
    status: 'Active',
    images: ['/uploads/sample2.jpg'],
  },
  {
    name: 'SLIPERS Jordan Low Panda Edition | 7A Grade Premium Quality Sneakers',
    sku: 'SP003',
    sellingPrice: 200.00,
    status: 'Active',
    images: ['/uploads/sample3.jpg'],
  },
    {
    name: 'asdaiusjlfknewjfer',
    sku: 'SP004',
    sellingPrice: 50.00,
    status: 'Active',
    images: ['/uploads/sample4.jpg'],
  },
  {
    name: 'iojerefs',
    sku: 'SP005',
    sellingPrice: 20.00,
    status: 'Active',
    images: ['/uploads/sample5.jpg'],
  }
];

router.post('/import', async (req, res) => {
  try {
    await Product.deleteMany({});
    const createdProducts = await Product.insertMany(products);
    res.status(201).json(createdProducts);
  } catch (error) {
    console.error(`${error}`);
    res.status(500).send('Server Error');
  }
});

module.exports = router;
