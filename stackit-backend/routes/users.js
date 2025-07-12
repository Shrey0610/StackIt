const express = require('express');
const router = express.Router();
const User = require('../models/User');
const Question = require('../models/Question');
const Answer = require('../models/Answer');
const { authenticateUser, optionalAuth, requirePermission } = require('../middleware/auth');

// GET /api/users/profile - Get current user's profile
router.get('/profile', authenticateUser, async (req, res) => {
    try {
        const userId = req.user._id;

        const user = await User.findById(userId).select('-clerkId');
        if (!user) {
            return res.status(404).json({
                error: 'User not found',
                message: 'User profile not found'
            });
        }

        // Get user's question and answer counts
        const [questionCount, answerCount] = await Promise.all([
            Question.countDocuments({ author: userId, isActive: true }),
            Answer.countDocuments({ author: userId, isActive: true })
        ]);

        res.json({
            user: {
                id: user._id,
                firstName: user.firstName,
                lastName: user.lastName,
                username: user.username,
                email: user.email,
                role: user.role,
                reputation: user.reputation,
                bio: user.bio,
                location: user.location,
                website: user.website,
                watchedTags: user.watchedTags,
                createdAt: user.createdAt,
                questionCount,
                answerCount
            }
        });

    } catch (error) {
        console.error('Error fetching user profile:', error);
        res.status(500).json({
            error: 'Server Error',
            message: 'Failed to fetch user profile'
        });
    }
});

// PUT /api/users/profile - Update current user's profile
router.put('/profile', authenticateUser, async (req, res) => {
    try {
        const userId = req.user._id;
        const { bio, location, website, watchedTags } = req.body;

        // Validate website URL if provided
        if (website && website.trim()) {
            const urlPattern = /^https?:\/\/.+/;
            if (!urlPattern.test(website)) {
                return res.status(400).json({
                    error: 'Validation Error',
                    message: 'Website must be a valid URL starting with http:// or https://'
                });
            }
        }

        // Update user
        const user = await User.findByIdAndUpdate(
            userId,
            {
                bio: bio?.trim() || '',
                location: location?.trim() || '',
                website: website?.trim() || '',
                watchedTags: Array.isArray(watchedTags) ? watchedTags : []
            },
            { new: true, runValidators: true }
        ).select('-clerkId');

        if (!user) {
            return res.status(404).json({
                error: 'User not found',
                message: 'User profile not found'
            });
        }

        res.json({
            message: 'Profile updated successfully',
            user: {
                id: user._id,
                bio: user.bio,
                location: user.location,
                website: user.website,
                watchedTags: user.watchedTags
            }
        });

    } catch (error) {
        console.error('Error updating user profile:', error);
        res.status(500).json({
            error: 'Server Error',
            message: 'Failed to update user profile'
        });
    }
});

// GET /api/users/:id - Get public user profile
router.get('/:id', optionalAuth, async (req, res) => {
    try {
        const userId = req.params.id;

        const user = await User.findById(userId).select('-clerkId -email');
        if (!user) {
            return res.status(404).json({
                error: 'User not found',
                message: 'User not found'
            });
        }

        // Get user's questions and answers with pagination
        const { questionPage = 1, answerPage = 1, limit = 10 } = req.query;
        const limitNum = parseInt(limit);
        const questionSkip = (parseInt(questionPage) - 1) * limitNum;
        const answerSkip = (parseInt(answerPage) - 1) * limitNum;

        const [questions, answers, questionCount, answerCount] = await Promise.all([
            Question.find({ author: userId, isActive: true })
                .select('title tags votes answers createdAt')
                .sort({ createdAt: -1 })
                .skip(questionSkip)
                .limit(limitNum),
            Answer.find({ author: userId, isActive: true })
                .populate('question', 'title')
                .select('content votes isAccepted createdAt question')
                .sort({ createdAt: -1 })
                .skip(answerSkip)
                .limit(limitNum),
            Question.countDocuments({ author: userId, isActive: true }),
            Answer.countDocuments({ author: userId, isActive: true })
        ]);

        res.json({
            user: {
                id: user._id,
                firstName: user.firstName,
                lastName: user.lastName,
                username: user.username,
                role: user.role,
                reputation: user.reputation,
                bio: user.bio,
                location: user.location,
                website: user.website,
                createdAt: user.createdAt,
                questionCount,
                answerCount
            },
            questions: questions.map(q => ({
                id: q._id,
                title: q.title,
                tags: q.tags,
                votes: q.votes.up.length - q.votes.down.length,
                answers: q.answers.length,
                createdAt: q.createdAt
            })),
            answers: answers.map(a => ({
                id: a._id,
                content: a.content.substring(0, 200) + '...',
                votes: a.votes.up.length - a.votes.down.length,
                isAccepted: a.isAccepted,
                createdAt: a.createdAt,
                question: {
                    id: a.question._id,
                    title: a.question.title
                }
            }))
        });

    } catch (error) {
        console.error('Error fetching user:', error);
        res.status(500).json({
            error: 'Server Error',
            message: 'Failed to fetch user'
        });
    }
});

// GET /api/users - Get all users (admin only)
router.get('/', authenticateUser, requirePermission('admin'), async (req, res) => {
    try {
        const { page = 1, limit = 20, search, role } = req.query;
        const pageNum = parseInt(page);
        const limitNum = parseInt(limit);
        const skip = (pageNum - 1) * limitNum;

        // Build query
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

// PUT /api/users/:id/role - Update user role (admin only)
router.put('/:id/role', authenticateUser, requirePermission('admin'), async (req, res) => {
    try {
        const { role } = req.body;
        const userId = req.params.id;

        if (!['guest', 'user', 'admin'].includes(role)) {
            return res.status(400).json({
                error: 'Validation Error',
                message: 'Role must be guest, user, or admin'
            });
        }

        const user = await User.findByIdAndUpdate(
            userId,
            { role },
            { new: true, runValidators: true }
        ).select('-clerkId');

        if (!user) {
            return res.status(404).json({
                error: 'User not found',
                message: 'User not found'
            });
        }

        res.json({
            message: 'User role updated successfully',
            user: {
                id: user._id,
                firstName: user.firstName,
                lastName: user.lastName,
                role: user.role
            }
        });

    } catch (error) {
        console.error('Error updating user role:', error);
        res.status(500).json({
            error: 'Server Error',
            message: 'Failed to update user role'
        });
    }
});

module.exports = router;
