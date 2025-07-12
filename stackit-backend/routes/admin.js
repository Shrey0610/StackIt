const express = require('express');
const router = express.Router();
const User = require('../models/User');
const Question = require('../models/Question');
const Answer = require('../models/Answer');
const { authenticateUser, getCurrentUser, requirePermission } = require('../middleware/auth');

// Simple test route
router.get('/test', (req, res) => {
    res.json({ message: 'Admin routes are working!' });
});

// POST test route
router.post('/test', (req, res) => {
    res.json({
        message: 'Admin POST route is working!',
        body: req.body,
        timestamp: new Date().toISOString()
    });
});

// GET /api/admin/dashboard - Admin dashboard stats
router.get('/dashboard', authenticateUser, getCurrentUser, requirePermission('admin'), async (req, res) => {
    try {
        const [userCount, questionCount, answerCount, todayUsers, todayQuestions] = await Promise.all([
            User.countDocuments(),
            Question.countDocuments({ isActive: true }),
            Answer.countDocuments({ isActive: true }),
            User.countDocuments({
                createdAt: {
                    $gte: new Date(new Date().setHours(0, 0, 0, 0))
                }
            }),
            Question.countDocuments({
                isActive: true,
                createdAt: {
                    $gte: new Date(new Date().setHours(0, 0, 0, 0))
                }
            })
        ]);

        // Get recent activity
        const recentQuestions = await Question.find({ isActive: true })
            .populate('author', 'firstName lastName username')
            .sort({ createdAt: -1 })
            .limit(5)
            .select('title author createdAt');

        const recentUsers = await User.find()
            .sort({ createdAt: -1 })
            .limit(5)
            .select('firstName lastName username email role createdAt');

        res.json({
            stats: {
                totalUsers: userCount,
                totalQuestions: questionCount,
                totalAnswers: answerCount,
                todayUsers,
                todayQuestions
            },
            recentActivity: {
                questions: recentQuestions,
                users: recentUsers
            }
        });

    } catch (error) {
        console.error('Error fetching admin dashboard:', error);
        res.status(500).json({
            error: 'Server Error',
            message: 'Failed to fetch admin dashboard'
        });
    }
});

// POST /api/admin/promote - Auto check if user is admin by email
router.post('/promote', authenticateUser, getCurrentUser, async (req, res) => {
    try {
        const currentUser = req.user;

        // Define your admin email here - CHANGE THIS TO YOUR EMAIL
        const ADMIN_EMAIL = "shrey9435@gmail.com"; // Your actual email address
        console.log('Admin promote request received');
        console.log('Current user email:', currentUser.email);
        console.log('Admin email:', ADMIN_EMAIL);

        // Check if the current user's email matches the admin email
        if (currentUser.email === ADMIN_EMAIL) {
            // Update user role to admin automatically
            const user = await User.findOneAndUpdate(
                { email: currentUser.email },
                { role: 'admin' },
                { new: true }
            ).select('-clerkId');

            if (!user) {
                return res.status(404).json({
                    error: 'User not found',
                    message: 'User profile not found'
                });
            }

            res.json({
                message: 'You are now an admin!',
                user: {
                    id: user._id,
                    firstName: user.firstName,
                    lastName: user.lastName,
                    email: user.email,
                    role: user.role
                }
            });
        } else {
            return res.status(403).json({
                error: 'Access Denied',
                message: 'You are not authorized to become admin'
            });
        }

    } catch (error) {
        console.error('Error checking admin:', error);
        res.status(500).json({
            error: 'Server Error',
            message: 'Failed to verify admin status'
        });
    }
});

// DELETE /api/admin/questions/:id - Delete any question (admin only)
router.delete('/questions/:id', authenticateUser, requirePermission('admin'), async (req, res) => {
    try {
        const questionId = req.params.id;

        const question = await Question.findByIdAndUpdate(
            questionId,
            { isActive: false },
            { new: true }
        );

        if (!question) {
            return res.status(404).json({
                error: 'Question not found',
                message: 'The question does not exist'
            });
        }

        // Also deactivate all answers for this question
        await Answer.updateMany(
            { question: questionId },
            { isActive: false }
        );

        res.json({
            message: 'Question and its answers deleted successfully',
            questionId
        });

    } catch (error) {
        console.error('Error deleting question:', error);
        res.status(500).json({
            error: 'Server Error',
            message: 'Failed to delete question'
        });
    }
});

// DELETE /api/admin/answers/:id - Delete any answer (admin only)
router.delete('/answers/:id', authenticateUser, requirePermission('admin'), async (req, res) => {
    try {
        const answerId = req.params.id;

        const answer = await Answer.findByIdAndUpdate(
            answerId,
            { isActive: false },
            { new: true }
        );

        if (!answer) {
            return res.status(404).json({
                error: 'Answer not found',
                message: 'The answer does not exist'
            });
        }

        // Remove answer from question's answers array
        await Question.findByIdAndUpdate(answer.question, {
            $pull: { answers: answerId }
        });

        res.json({
            message: 'Answer deleted successfully',
            answerId
        });

    } catch (error) {
        console.error('Error deleting answer:', error);
        res.status(500).json({
            error: 'Server Error',
            message: 'Failed to delete answer'
        });
    }
});

// GET /api/admin/users - Get all users (already exists in users.js but duplicated for admin context)
router.get('/users', authenticateUser, requirePermission('admin'), async (req, res) => {
    try {
        const { page = 1, limit = 20, search, role } = req.query;
        const pageNum = parseInt(page);
        const limitNum = parseInt(limit);
        const skip = (pageNum - 1) * limitNum;

        let query = {};
        if (search) {
            query.$or = [
                { firstName: { $regex: search, $options: 'i' } },
                { lastName: { $regex: search, $options: 'i' } },
                { username: { $regex: search, $options: 'i' } },
                { email: { $regex: search, $options: 'i' } }
            ];
        }
        if (role) {
            query.role = role;
        }

        const [users, total] = await Promise.all([
            User.find(query)
                .select('-clerkId')
                .sort({ createdAt: -1 })
                .skip(skip)
                .limit(limitNum),
            User.countDocuments(query)
        ]);

        res.json({
            users: users.map(user => ({
                id: user._id,
                firstName: user.firstName,
                lastName: user.lastName,
                username: user.username,
                email: user.email,
                role: user.role,
                reputation: user.reputation,
                createdAt: user.createdAt
            })),
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
        console.error('Error fetching users:', error);
        res.status(500).json({
            error: 'Server Error',
            message: 'Failed to fetch users'
        });
    }
});

module.exports = router;
