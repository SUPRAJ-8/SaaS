const mongoose = require('mongoose');
require('dotenv').config();

const connectDB = async () => {
  mongoose.set('strictQuery', false);

  if (!process.env.MONGO_URI) {
    throw new Error('MONGO_URI is not defined in environment variables');
  }

  try {
    await mongoose.connect(process.env.MONGO_URI);
    console.log('MongoDB connected successfully.');
  } catch (err) {
    console.error('MongoDB connection error:', err.message || err);
    // Rethrow so the caller can decide how to handle it
    throw err;
  }
};

module.exports = connectDB;
