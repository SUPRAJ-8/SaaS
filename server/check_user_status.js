const mongoose = require('mongoose');
const User = require('./models/User');

// Connect to MongoDB
require('dotenv').config();

const verifyUserStatus = async () => {
    try {
        await mongoose.connect(process.env.MONGO_URI || 'mongodb://localhost:27017/nepalcms');
        console.log('MongoDB Connected');

        // Find the most recently created user
        const user = await User.findOne().sort({ createdAt: -1 });

        if (user) {
            console.log('Latest User:', {
                id: user._id,
                email: user.email,
                isOnboarded: user.isOnboarded,
                hasField: user.toObject().hasOwnProperty('isOnboarded')
            });
        } else {
            console.log('No users found.');
        }

        mongoose.disconnect();
    } catch (err) {
        console.error(err);
        process.exit(1);
    }
};

verifyUserStatus();
