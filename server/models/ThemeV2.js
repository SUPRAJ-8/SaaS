const mongoose = require('mongoose');

const themeSchema = new mongoose.Schema({
    id: { type: String, required: true, unique: true },
    name: { type: String, required: true },
    description: String,

    // Version control
    version: { type: String, default: '1.0.0' },
    changelog: [{
        version: String,
        date: { type: Date, default: Date.now },
        changes: String
    }],

    // Section composition (IDs only, not components)
    sections: [{ type: String }], // ["hero-modern", "product-grid-001"]

    // Default data for each section
    defaults: {
        type: Map,
        of: mongoose.Schema.Types.Mixed
        // Example: { "hero-modern": { title: "Welcome", bgColor: "#fff" } }
    },

    // Metadata
    category: { type: String, default: 'General' },
    preview: String, // Screenshot URL
    thumbnail: String,
    author: String,
    isActive: { type: Boolean, default: true },

    // Theme-level assets
    globalCss: String, // Optional theme-wide styles
    fonts: [String], // Google Fonts, etc.

    createdAt: { type: Date, default: Date.now },
    updatedAt: { type: Date, default: Date.now }
});

// IMPORTANT: Theme does NOT store React components or JSX
// It only references section template IDs

module.exports = mongoose.model('Theme', themeSchema);
