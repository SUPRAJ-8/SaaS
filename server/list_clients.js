const mongoose = require('mongoose');
require('dotenv').config();

const dbUri = process.env.MONGO_URI || 'mongodb://localhost:27017/nepostore';

const listClients = async () => {
    try {
        await mongoose.connect(dbUri);
        const Client = mongoose.model('Client', new mongoose.Schema({
            brandName: String,
            storeName: String,
            subdomain: String
        }));

        const clients = await Client.find();
        console.log(`Found ${clients.length} clients:`);
        clients.forEach(c => {
            console.log(`- Name: ${c.brandName || c.storeName} | Subdomain: ${c.subdomain} | ID: ${c._id}`);
        });

        await mongoose.disconnect();
    } catch (err) {
        console.error(err);
    }
};

listClients();
