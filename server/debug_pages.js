const mongoose = require('mongoose');
require('dotenv').config();

const dbUri = process.env.MONGO_URI || 'mongodb://localhost:27017/nepostore';

const checkPages = async () => {
    try {
        await mongoose.connect(dbUri);
        const subdomain = "nepostore";

        const Client = mongoose.model('Client', new mongoose.Schema({
            subdomain: String,
            settings: Object
        }));

        const Website = mongoose.model('Website', new mongoose.Schema({
            clientId: mongoose.Schema.Types.ObjectId,
            pages: Array
        }));

        const client = await Client.findOne({ subdomain });
        if (!client) {
            console.log("Client not found for nepostore");
            process.exit(0);
        }

        console.log(`Client Found: ${client._id}`);
        console.log(`Active Theme in DB: ${client.settings?.selectedThemeId}`);

        const website = await Website.findOne({ clientId: client._id });
        if (!website) {
            console.log("No website/pages found for this client");
        } else {
            console.log(`Total Pages: ${website.pages.length}`);
            website.pages.forEach(p => {
                console.log(`- Title: ${p.title} | Slug: "${p.slug}" | Theme: ${p.themeId} | Status: ${p.status}`);
            });
        }

        await mongoose.disconnect();
    } catch (err) {
        console.error(err);
    }
};

checkPages();
