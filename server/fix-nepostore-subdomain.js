// Script to add subdomain to store with custom domain
// Run this with: node fix-nepostore-subdomain.js

require('dotenv').config();
const mongoose = require('mongoose');
const Client = require('./models/Client');

const fixNepostoreSubdomain = async () => {
    try {
        // Connect to MongoDB
        await mongoose.connect(process.env.MONGO_URI);
        console.log('✅ Connected to MongoDB\n');

        // Find the store with custom domain suprajshrestha.com.np
        const store = await Client.findOne({ customDomain: 'suprajshrestha.com.np' });

        if (!store) {
            console.log('❌ No store found with custom domain: suprajshrestha.com.np');
            console.log('\nLet me show you all stores with custom domains:');
            const storesWithDomains = await Client.find({ customDomain: { $exists: true, $ne: null } });
            storesWithDomains.forEach(s => {
                console.log(`  - ${s.name}: ${s.customDomain} (subdomain: ${s.subdomain || 'NOT SET'})`);
            });
        } else {
            console.log(`📦 Found store: ${store.name}`);
            console.log(`   Current subdomain: ${store.subdomain || '(not set)'}`);
            console.log(`   Custom domain: ${store.customDomain}`);

            if (store.subdomain === 'nepostore') {
                console.log('\n✅ Subdomain is already set to "nepostore". No changes needed!');
            } else {
                // Check if subdomain 'nepostore' is already taken
                const existingNepostore = await Client.findOne({ subdomain: 'nepostore' });
                if (existingNepostore && existingNepostore._id.toString() !== store._id.toString()) {
                    console.log(`\n⚠️  WARNING: Subdomain "nepostore" is already used by: ${existingNepostore.name}`);
                    console.log('Please choose a different subdomain or remove it from the other store first.');
                } else {
                    // Update the store
                    store.subdomain = 'nepostore';
                    await store.save();
                    console.log('\n✅ Successfully updated subdomain to "nepostore"!');
                    console.log(`\nYou can now access your store at:`);
                    console.log(`  - http://nepostore.localhost:3000`);
                    console.log(`  - http://suprajshrestha.com.np (when DNS is configured)`);
                }
            }
        }

        await mongoose.connection.close();
        console.log('\n✅ Done!');
        process.exit(0);
    } catch (error) {
        console.error('❌ Error:', error.message);
        process.exit(1);
    }
};

fixNepostoreSubdomain();
