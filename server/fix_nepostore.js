const mongoose = require('mongoose');
require('dotenv').config();

const dbUri = process.env.MONGO_URI || 'mongodb://localhost:27017/nepostore';

const fixClient = async () => {
    try {
        await mongoose.connect(dbUri);
        const Client = mongoose.model('Client', new mongoose.Schema({
            subdomain: String,
            brandName: String,
            storeName: String
        }));

        const id = "69554fea0baae78d4c838d35";
        const client = await Client.findById(id);
        if (client) {
            console.log(`Found Client: ${client.brandName || client.storeName}`);
            console.log(`Current Subdomain: ${client.subdomain}`);
            client.subdomain = "nepostore";
            await client.save();
            console.log("Subdomain updated to 'nepostore'");
        } else {
            console.log("Client not found with ID 69554fea0baae78d4c838d35");
            const all = await Client.find();
            console.log("All clients in DB:");
            all.forEach(c => console.log(`- ${c._id} | ${c.subdomain} | ${c.brandName || c.storeName}`));
        }

        await mongoose.disconnect();
    } catch (err) {
        console.error(err);
    }
};

fixClient();
