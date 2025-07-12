const express = require('express');
const router = express.Router();
const Notification = require('../models/Notification');
const { authenticateUser } = require('../middleware/auth');

// GET /api/notifications - Get user's notifications
router.get('/', authenticateUser, async (req, res) => {
    try {
        const userId = req.user._id;
        const { page = 1, limit = 20, unreadOnly = false } = req.query;

        const pageNum = parseInt(page);
        const limitNum = parseInt(limit);
        const skip = (pageNum - 1) * limitNum;

        // Build query
        let query = { recipient: userId };
        if (unreadOnly === 'true') {
            query.isRead = false;
        }

        // Get notifications
        const notifications = await Notification.find(query)
            .populate('relatedQuestion', 'title')
            .populate('relatedAnswer', 'content')
            .sort({ createdAt: -1 })
            .skip(skip)
            .limit(limitNum)
            .lean();

        // Get unread count
        const unreadCount = await Notification.countDocuments({
            recipient: userId,
            isRead: false
        });

        // Get total count
        const total = await Notification.countDocuments(query);

        // Format notifications
        const formattedNotifications = notifications.map(notification => ({
            id: notification._id,
            type: notification.type,
            message: notification.message,
            isRead: notification.isRead,
            createdAt: notification.createdAt,
            relatedQuestion: notification.relatedQuestion ? {
                id: notification.relatedQuestion._id,
                title: notification.relatedQuestion.title
            } : null,
            relatedAnswer: notification.relatedAnswer ? {
                id: notification.relatedAnswer._id,
                content: notification.relatedAnswer.content.substring(0, 100) + '...'
            } : null
        }));

        res.json({
            notifications: formattedNotifications,
            unreadCount,
            pagination: {
                page: pageNum,
                limit: limitNum,
                total,
                totalPages: Math.ceil(total / limitNum),
                hasNext: pageNum < Math.ceil(total / limitNum),
                hasPrev: pageNum > 1
            }
        });

    } catch (error) {
        console.error('Error fetching notifications:', error);
        res.status(500).json({
            error: 'Server Error',
            message: 'Failed to fetch notifications'
        });
    }
});

// GET /api/notifications/unread-count - Get unread notification count
router.get('/unread-count', authenticateUser, async (req, res) => {
    try {
        const userId = req.user._id;

        const unreadCount = await Notification.countDocuments({
            recipient: userId,
            isRead: false
        });

        res.json({ unreadCount });

    } catch (error) {
        console.error('Error fetching unread count:', error);
        res.status(500).json({
            error: 'Server Error',
            message: 'Failed to fetch unread count'
        });
    }
});

// PUT /api/notifications/:id/read - Mark notification as read
router.put('/:id/read', authenticateUser, async (req, res) => {
    try {
        const notificationId = req.params.id;
        const userId = req.user._id;

        // Find and update notification
        const notification = await Notification.findOneAndUpdate(
            { _id: notificationId, recipient: userId },
            { isRead: true, readAt: new Date() },
            { new: true }
        );

        if (!notification) {
            return res.status(404).json({
                error: 'Notification not found',
                message: 'The notification does not exist or does not belong to you'
            });
        }

        res.json({
            message: 'Notification marked as read',
            notification: {
                id: notification._id,
                isRead: notification.isRead,
                readAt: notification.readAt
            }
        });

    } catch (error) {
        console.error('Error marking notification as read:', error);
        res.status(500).json({
            error: 'Server Error',
            message: 'Failed to mark notification as read'
        });
    }
});

// PUT /api/notifications/mark-all-read - Mark all notifications as read
router.put('/mark-all-read', authenticateUser, async (req, res) => {
    try {
        const userId = req.user._id;

        const result = await Notification.updateMany(
            { recipient: userId, isRead: false },
            { isRead: true, readAt: new Date() }
        );

        res.json({
            message: 'All notifications marked as read',
            updatedCount: result.modifiedCount
        });

    } catch (error) {
        console.error('Error marking all notifications as read:', error);
        res.status(500).json({
            error: 'Server Error',
            message: 'Failed to mark all notifications as read'
        });
    }
});

// DELETE /api/notifications/:id - Delete a notification
router.delete('/:id', authenticateUser, async (req, res) => {
    try {
        const notificationId = req.params.id;
        const userId = req.user._id;

        const notification = await Notification.findOneAndDelete({
            _id: notificationId,
            recipient: userId
        });

        if (!notification) {
            return res.status(404).json({
                error: 'Notification not found',
                message: 'The notification does not exist or does not belong to you'
            });
        }

        res.json({
            message: 'Notification deleted successfully'
        });

    } catch (error) {
        console.error('Error deleting notification:', error);
        res.status(500).json({
            error: 'Server Error',
            message: 'Failed to delete notification'
        });
    }
});

// POST /api/notifications/test - Create test notification (development only)
if (process.env.NODE_ENV === 'development') {
    router.post('/test', authenticateUser, async (req, res) => {
        try {
            const { type = 'answer', message = 'Test notification' } = req.body;
            const userId = req.user._id;

            const notification = await Notification.create({
                recipient: userId,
                type,
                message
            });

            res.json({
                message: 'Test notification created',
                notification
            });

        } catch (error) {
            console.error('Error creating test notification:', error);
            res.status(500).json({
                error: 'Server Error',
                message: 'Failed to create test notification'
            });
        }
    });
}

module.exports = router;
