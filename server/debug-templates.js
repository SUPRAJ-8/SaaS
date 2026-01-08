const mongoose = require('mongoose');
const Template = require('./models/Template');
require('dotenv').config();

const check = async () => {
    try {
        await mongoose.connect(process.env.MONGO_URI);
        const templates = await Template.find({});
        console.log('--- TEMPLATES IN DB ---');
        console.log(`Total count: ${templates.length}`);
        templates.forEach(t => {
            console.log(`- [${t.id}] ${t.name} (Category: ${t.category}, Active: ${t.isActive})`);
        });
        console.log('-----------------------');
    } catch (e) {
        console.error(e);
    }
    process.exit();
};
check();
