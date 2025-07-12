const mongoose = require('mongoose');

const notificationSchema = new mongoose.Schema({
    recipient: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    sender: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    type: {
        type: String,
        required: true,
        enum: [
            'question_answered',
            'answer_accepted',
            'answer_voted',
            'question_voted',
            'user_mentioned',
            'comment_added'
        ]
    },
    title: {
        type: String,
        required: true
    },
    message: {
        type: String,
        required: true
    },
    relatedQuestion: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Question'
    },
    relatedAnswer: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Answer'
    },
    isRead: {
        type: Boolean,
        default: false
    },
    readAt: {
        type: Date
    }
}, {
    timestamps: true
});

// Method to mark as read
notificationSchema.methods.markAsRead = function () {
    this.isRead = true;
    this.readAt = new Date();
    return this;
};

// Static method to create notification
notificationSchema.statics.createNotification = async function (data) {
    const notification = new this(data);
    await notification.save();
    return notification;
};

// Indexes for better performance
notificationSchema.index({ recipient: 1, isRead: 1 });
notificationSchema.index({ createdAt: -1 });

module.exports = mongoose.model('Notification', notificationSchema);
