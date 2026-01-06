const mongoose = require('mongoose');
const User = require('./models/User');

// Connect to MongoDB
require('dotenv').config();

const setOnboardedTrue = async () => {
    try {
        await mongoose.connect(process.env.MONGO_URI || 'mongodb://localhost:27017/nepalcms');
        console.log('MongoDB Connected');

        // Find the most recently created user
        const user = await User.findOne().sort({ createdAt: -1 });

        if (user) {
            console.log('Found Latest User:', user.email);
            console.log('Current isOnboarded:', user.isOnboarded);

            user.isOnboarded = true;
            const savedUser = await user.save();

            console.log('Updated isOnboarded:', savedUser.isOnboarded);
            console.log('Please ask the user to refresh their dashboard now.');
        } else {
            console.log('No users found.');
        }

        mongoose.disconnect();
    } catch (err) {
        console.error(err);
        process.exit(1);
    }
};

setOnboardedTrue();
