const mongoose = require('mongoose');
const Template = require('./models/Template');
const fs = require('fs');
const path = require('path');
require('dotenv').config();

const seed = async () => {
    try {
        await mongoose.connect(process.env.MONGO_URI);
        console.log('Connected to DB');

        // Read the json file from parent dir (project root)
        // Adjust path: executing from 'server' folder, so json is in '../modern-hero-replica.json'
        const jsonPath = path.join(__dirname, '..', 'modern-hero-replica.json');

        if (!fs.existsSync(jsonPath)) {
            console.error('File not found:', jsonPath);
            process.exit(1);
        }

        const rawData = fs.readFileSync(jsonPath, 'utf8');
        const templateData = JSON.parse(rawData);

        console.log(`Seeding template: ${templateData.name}`);

        // Update or Insert
        const result = await Template.findOneAndUpdate(
            { id: templateData.id },
            templateData,
            { upsert: true, new: true }
        );

        console.log('✅ Template seeded successfully!');
        console.log('ID:', result.id);
        console.log('Active:', result.isActive);

    } catch (e) {
        console.error('Error seeding:', e);
    }
    process.exit();
};

seed();
