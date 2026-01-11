// Quick diagnostic script to check your stores and their subdomains
// Run this with: node check-stores.js

require('dotenv').config();
const mongoose = require('mongoose');
const Client = require('./models/Client');
const Website = require('./models/Website');

const checkStores = async () => {
    try {
        // Connect to MongoDB
        await mongoose.connect(process.env.MONGO_URI);
        console.log('✅ Connected to MongoDB\n');

        // Find all clients
        const clients = await Client.find({});

        if (clients.length === 0) {
            console.log('❌ No stores found in database!');
            console.log('You need to create a store first through the onboarding process.\n');
        } else {
            console.log(`📊 Found ${clients.length} store(s):\n`);

            for (const client of clients) {
                console.log('─'.repeat(60));
                console.log(`Store Name: ${client.name}`);
                console.log(`Store ID: ${client._id}`);
                console.log(`Subdomain: ${client.subdomain || '(not set)'}`);
                console.log(`Custom Domain: ${client.customDomain || '(not set)'}`);
                console.log(`Owner Email: ${client.ownerEmail}`);
                console.log(`Plan: ${client.subscriptionPlan}`);

                // Check if website exists
                const website = await Website.findOne({ clientId: client._id });
                if (website) {
                    console.log(`Pages: ${website.pages.length} page(s)`);
                    website.pages.forEach(page => {
                        console.log(`  - ${page.title} (slug: "${page.slug || '/'}", status: ${page.status})`);
                    });
                } else {
                    console.log(`Pages: No website created yet`);
                }
                console.log('');
            }
            console.log('─'.repeat(60));

            console.log('\n📝 Access URLs:');
            clients.forEach(client => {
                if (client.subdomain) {
                    console.log(`  - http://${client.subdomain}.localhost:3000`);
                }
                if (client.customDomain) {
                    console.log(`  - http://${client.customDomain}`);
                }
            });
        }

        await mongoose.connection.close();
        console.log('\n✅ Done!');
        process.exit(0);
    } catch (error) {
        console.error('❌ Error:', error.message);
        process.exit(1);
    }
};

checkStores();
