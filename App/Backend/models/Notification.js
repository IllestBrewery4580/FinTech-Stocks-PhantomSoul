import mongoose from 'mongoose';

const notificationSchema = new mongoose.Schema({
    symbol: {
        type: String,
        required: true,
        uppercase: true
    },
    type: {
        type: String,
        enum: ['INFO', 'WARNING', 'CRITICAL'],
        default: 'INFO'
    },
    message: {
        type: String,
        required: true
    },
    read: {
        type: Boolean,
        default: false
    },
    createdAt: {
        type: Date,
        default: Date.now
    }
});

export default mongoose.model('Notification', notificationSchema);