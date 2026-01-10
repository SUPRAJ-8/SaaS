const mongoose = require('mongoose');

const Schema = mongoose.Schema;

// Template Schema for Dynamic Sections
const templateSchema = new Schema({
    id: { type: String, required: true, unique: true }, // slug-like ID
    name: { type: String, required: true },
    description: { type: String },
    category: { type: String, default: 'General' },

    // "dynamic" means it uses the JSON schema engine. 
    // "component" means it maps to a React component key (legacy/hardcoded).
    type: { type: String, enum: ['dynamic', 'component'], default: 'dynamic' },

    // For "component" type, this maps to SECTION_TEMPLATES key in frontend
    baseType: { type: String },

    // For "dynamic" type, this defines the input fields
    schema: [
        {
            key: { type: String },
            type: { type: String }, // text, color, boolean, image, etc.
            label: { type: String },
            default: { type: Schema.Types.Mixed }, // string, boolean, etc.
            options: [{ label: String, value: String }] // for select
        }
    ],

    // User's simple section template fields
    fields: [
        {
            key: { type: String },
            type: { type: String }, // text, color, boolean, image, etc.
            label: { type: String },
            default: { type: Schema.Types.Mixed },
            options: [{ label: String, value: String }]
        }
    ],
    defaultSettings: { type: Object, default: {} },

    // For "dynamic" type, this defines the HTML structure
    structure: { type: Object }, // JSON tree

    // For "dynamic" type, this defines CSS
    styles: { type: String },

    thumbnail: { type: String },
    isActive: { type: Boolean, default: true },
    version: { type: String, default: '1.0.0' },

    createdAt: { type: Date, default: Date.now },
    updatedAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model('Template', templateSchema);
