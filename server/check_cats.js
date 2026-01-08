const mongoose = require('mongoose');
require('dotenv').config();

const dbUri = process.env.MONGO_URI || 'mongodb://localhost:27017/nepostore';

const checkData = async () => {
    try {
        await mongoose.connect(dbUri);
        const clientId = "69554fea0baae78d4c838d35"; // NEPO Store

        const Category = mongoose.model('Category', new mongoose.Schema({
            name: String,
            clientId: mongoose.Schema.Types.ObjectId
        }));

        const Product = mongoose.model('Product', new mongoose.Schema({
            name: String,
            category: mongoose.Schema.Types.ObjectId,
            clientId: mongoose.Schema.Types.ObjectId
        }));

        const categories = await Category.find({ clientId });
        console.log('Categories for NEPO Store:');
        categories.forEach(c => console.log(`- ${c.name} (ID: ${c._id})`));

        const products = await Product.find({ clientId });
        console.log('\nProducts for NEPO Store:');
        products.forEach(p => console.log(`- ${p.name} (Cat ID: ${p.category})`));

        await mongoose.disconnect();
    } catch (err) {
        console.error(err);
    }
};

checkData();
