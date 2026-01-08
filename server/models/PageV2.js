const mongoose = require('mongoose');

const pageSchema = new mongoose.Schema({
    title: { type: String, required: true },
    slug: { type: String, required: true, unique: true },

    // Independent section data (NOT linked to theme after creation)
    sections: [{
        templateId: { type: String, required: true }, // "hero-modern"
        data: { type: mongoose.Schema.Types.Mixed, default: {} } // Editable via builder
    }],

    // Metadata
    status: { type: String, enum: ['draft', 'published'], default: 'draft' },
    createdFrom: { type: String }, // Track which theme was used initially (for analytics only)
    client: { type: mongoose.Schema.Types.ObjectId, ref: 'Client' },

    // SEO
    metaTitle: String,
    metaDescription: String,

    createdAt: { type: Date, default: Date.now },
    updatedAt: { type: Date, default: Date.now }
});

// GOLDEN RULE: After creation, page is fully independent
// Theme changes do NOT affect existing pages

module.exports = mongoose.model('PageV2', pageSchema);
