require('dotenv').config();
const mongoose = require('mongoose');
const connectDB = require('./db');
const Product = require('./models/Product');

connectDB();

const products = [
  {
    name: 'Sample Product 1',
    sku: 'SP001',
    stock: 100,
    price: 19.99,
    status: 'Active',
    section: 'Popular',
    img: 'https://via.placeholder.com/40',
  },
  {
    name: 'Sample Product 2',
    sku: 'SP002',
    stock: 50,
    price: 29.99,
    status: 'Draft',
    section: 'Featured',
    img: 'https://via.placeholder.com/40',
  },
    {
    name: 'Sample Product 3',
    sku: 'SP003',
    stock: 75,
    price: 49.99,
    status: 'Active',
    img: 'https://via.placeholder.com/40',
  },
];

const importData = async () => {
  try {
    await Product.deleteMany();
    await Product.insertMany(products);
    console.log('Data Imported!');
    process.exit();
  } catch (error) {
    console.error(`${error}`);
    process.exit(1);
  }
};

const destroyData = async () => {
  try {
    await Product.deleteMany();
    console.log('Data Destroyed!');
    process.exit();
  } catch (error) {
    console.error(`${error}`);
    process.exit(1);
  }
};

if (process.argv[2] === '-d') {
  destroyData();
} else {
  importData();
}
