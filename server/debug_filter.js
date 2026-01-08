const mongoose = require('mongoose');
const Product = require('./models/Product');
const Category = require('./models/Category');

async function check() {
    await mongoose.connect('mongodb://localhost:27017/cms');
    console.log('Connected');

    const products = await Product.find().populate('category');
    console.log(`Total Products: ${products.length}`);

    products.forEach(p => {
        console.log(`Product: ${p.name} | Category: ${p.category ? p.category.name : 'NONE'} (${p.category ? (p.category._id || p.category) : 'N/A'})`);
    });

    const categories = await Category.find();
    console.log('\nCategories:');
    categories.forEach(c => {
        console.log(`- ${c.name}: ${c._id}`);
    });

    mongoose.disconnect();
}

check();
