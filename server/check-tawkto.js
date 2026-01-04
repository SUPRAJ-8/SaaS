// Quick diagnostic script to check tawk.to configuration
// Run this with: node check-tawkto.js

const mongoose = require('mongoose');
require('dotenv').config();

const SiteSettingSchema = new mongoose.Schema({
    tawkToId: {
        type: String,
        default: ''
    },
    whatsAppNumber: {
        type: String,
        default: ''
    }
}, { timestamps: true });

const SiteSetting = mongoose.model('SiteSetting', SiteSettingSchema);

const checkTawkTo = async () => {
    try {
        // Connect to MongoDB
        const mongoURI = process.env.MONGO_URI || 'mongodb://localhost:27017/saas-ecommerce';
        await mongoose.connect(mongoURI);
        console.log('✅ Connected to MongoDB');

        // Fetch settings
        const settings = await SiteSetting.findOne();

        if (!settings) {
            console.log('⚠️  No settings found in database');
            console.log('Creating default settings...');
            const newSettings = await SiteSetting.create({ tawkToId: '', whatsAppNumber: '' });
            console.log('Created:', newSettings);
        } else {
            console.log('\n📊 Current Settings:');
            console.log('==================');
            console.log('Tawk.to ID:', settings.tawkToId || '(not configured)');
            console.log('WhatsApp Number:', settings.whatsAppNumber || '(not configured)');
            console.log('Created At:', settings.createdAt);
            console.log('Updated At:', settings.updatedAt);
            console.log('==================\n');

            if (!settings.tawkToId) {
                console.log('⚠️  Tawk.to ID is empty!');
                console.log('Please configure it in Super Admin → Live Chat');
            } else {
                console.log('✅ Tawk.to ID is configured');
                console.log('Expected script URL:', `https://embed.tawk.to/${settings.tawkToId}/default`);
            }
        }

        await mongoose.connection.close();
        console.log('\n✅ Connection closed');
    } catch (error) {
        console.error('❌ Error:', error);
        process.exit(1);
    }
};

checkTawkTo();
