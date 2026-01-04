const mongoose = require('mongoose');

const SiteSettingSchema = new mongoose.Schema({
    tawkToId: {
        type: String,
        default: ''
    },
    whatsAppNumber: {
        type: String,
        default: ''
    },
    // Future site-wide settings can be added here
}, { timestamps: true });

module.exports = mongoose.model('SiteSetting', SiteSettingSchema);
