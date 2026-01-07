const mongoose = require('mongoose');

const themeSchema = new mongoose.Schema({
    name: {
        type: String,
        required: true,
        trim: true,
    },
    id: {
        type: String,
        required: true,
        unique: true,
        lowercase: true,
        trim: true,
    },
    description: {
        type: String,
        required: true,
    },
    thumbnail: {
        type: String, // URL to preview image
        required: true,
    },
    version: {
        type: String,
        default: '1.0.0',
    },
    category: {
        type: String,
        enum: ['Ecommerce', 'Portfolio', 'Service', 'Other'],
        default: 'Ecommerce',
    },
    isActive: {
        type: Boolean,
        default: true,
    },
    features: {
        ecommerce: { type: Boolean, default: true },
        checkout: { type: Boolean, default: true },
        categories: { type: Boolean, default: true },
        wishlist: { type: Boolean, default: true },
    },
    blueprint: {
        type: mongoose.Schema.Types.Mixed, // Stores the JSON layout for home page
        required: true,
    },
    customCss: {
        type: String,
        default: '',
    },
    createdAt: {
        type: Date,
        default: Date.now,
    },
    updatedAt: {
        type: Date,
        default: Date.now,
    },
});

themeSchema.pre('save', function (next) {
    this.updatedAt = Date.now();
    next();
});

module.exports = mongoose.model('Theme', themeSchema);
