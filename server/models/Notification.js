const mongoose = require('mongoose');

const notificationSchema = new mongoose.Schema({
    clientId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Client',
        required: true
    },
    type: {
        type: String,
        enum: ['order', 'payment', 'alert', 'user'],
        required: true
    },
    title: {
        type: String,
        required: true
    },
    message: {
        type: String,
        required: true
    },
    status: {
        type: String,
        enum: ['read', 'unread'],
        default: 'unread'
    },
    isDeleted: {
        type: Boolean,
        default: false
    },
    targetLink: {
        type: String,
        required: true
    },
    metadata: { // Stoing IDs or extra info
        type: mongoose.Schema.Types.Mixed
    },
    createdAt: {
        type: Date,
        default: Date.now
    }
});

module.exports = mongoose.model('Notification', notificationSchema);
