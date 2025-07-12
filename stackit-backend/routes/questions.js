const express = require('express');
const router = express.Router();
const Question = require('../models/Question');
const Answer = require('../models/Answer');
const { optionalAuth, authenticateUser, getCurrentUser, requirePermission } = require('../middleware/auth');
const { postLimiter, voteLimiter } = require('../middleware/rateLimiter');

// GET /api/questions - Get all questions with pagination and filters
router.get('/', optionalAuth, async (req, res) => {
    try {
        const {
            page = 1,
            limit = 10,
            sortBy = 'newest',
            tags,
            search,
            unanswered
        } = req.query;

        const pageNum = parseInt(page);
        const limitNum = parseInt(limit);
        const skip = (pageNum - 1) * limitNum;

        // Build query
        let query = { isActive: true };

        // Tag filter
        if (tags) {
            const tagArray = tags.split(',').map(tag => tag.trim().toLowerCase());
            query.tags = { $in: tagArray };
        }

        // Search filter
        if (search) {
            query.$or = [
                { title: { $regex: search, $options: 'i' } },
                { description: { $regex: search, $options: 'i' } },
                { tags: { $regex: search, $options: 'i' } }
            ];
        }

        // Unanswered filter
        if (unanswered === 'true') {
            query.answers = { $size: 0 };
        }

        // Sort options
        let sortOptions = {};
        switch (sortBy) {
            case 'newest':
                sortOptions = { createdAt: -1 };
                break;
            case 'oldest':
                sortOptions = { createdAt: 1 };
                break;
            case 'votes':
                sortOptions = { 'votes.up': -1 };
                break;
            case 'views':
                sortOptions = { 'views.count': -1 };
                break;
            case 'activity':
                sortOptions = { lastActivity: -1 };
                break;
            default:
                sortOptions = { createdAt: -1 };
        }

        // Execute query
        const questions = await Question.find(query)
            .populate('author', 'firstName lastName username reputation')
            .populate('acceptedAnswer')
            .sort(sortOptions)
            .skip(skip)
            .limit(limitNum)
            .lean();

        // Get total count for pagination
        const total = await Question.countDocuments(query);

        // Format response
        const formattedQuestions = questions.map(question => ({
            id: question._id,
            title: question.title,
            description: question.description,
            tags: question.tags,
            author: {
                id: question.author._id,
                name: `${question.author.firstName} ${question.author.lastName}`.trim(),
                username: question.author.username,
                reputation: question.author.reputation
            },
            votes: question.votes.up.length - question.votes.down.length,
            answers: question.answers.length,
            views: question.views.count,
            hasAcceptedAnswer: !!question.acceptedAnswer,
            createdAt: question.createdAt,
            lastActivity: question.lastActivity
        }));

        res.json({
            questions: formattedQuestions,
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
        console.error('Error fetching questions:', error);
        res.status(500).json({
            error: 'Server Error',
            message: 'Failed to fetch questions'
        });
    }
});

// GET /api/questions/:id - Get a specific question with answers
router.get('/:id', optionalAuth, async (req, res) => {
    try {
        const questionId = req.params.id;
        const userId = req.user?._id;

        // Find question
        const question = await Question.findById(questionId)
            .populate('author', 'firstName lastName username reputation')
            .populate({
                path: 'answers',
                populate: {
                    path: 'author',
                    select: 'firstName lastName username reputation'
                }
            });

        if (!question || !question.isActive) {
            return res.status(404).json({
                error: 'Question not found',
                message: 'The requested question does not exist'
            });
        }

        // Increment view count
        if (userId && !question.views.viewedBy.some(view => view.user.toString() === userId.toString())) {
            question.incrementView(userId);
            await question.save();
        } else if (!userId) {
            question.incrementView();
            await question.save();
        }

        // Get user's vote if authenticated
        let userVote = null;
        if (userId) {
            userVote = question.getUserVote(userId);
        }

        // Format response
        const formattedQuestion = {
            id: question._id,
            title: question.title,
            description: question.description,
            tags: question.tags,
            author: {
                id: question.author._id,
                name: `${question.author.firstName} ${question.author.lastName}`.trim(),
                username: question.author.username,
                reputation: question.author.reputation
            },
            votes: question.votes.up.length - question.votes.down.length,
            views: question.views.count,
            createdAt: question.createdAt,
            lastActivity: question.lastActivity,
            userVote,
            answers: question.answers.map(answer => ({
                id: answer._id,
                content: answer.content,
                author: {
                    id: answer.author._id,
                    name: `${answer.author.firstName} ${answer.author.lastName}`.trim(),
                    username: answer.author.username,
                    reputation: answer.author.reputation
                },
                votes: answer.votes.up.length - answer.votes.down.length,
                isAccepted: answer.isAccepted,
                createdAt: answer.createdAt,
                userVote: userId ? answer.getUserVote(userId) : null
            }))
        };

        res.json({ question: formattedQuestion });

    } catch (error) {
        console.error('Error fetching question:', error);
        res.status(500).json({
            error: 'Server Error',
            message: 'Failed to fetch question'
        });
    }
});

// POST /api/questions - Create a new question
router.post('/', [authenticateUser, getCurrentUser, requirePermission('post'), postLimiter], async (req, res) => {
    try {
        const { title, description, tags } = req.body;
        const userId = req.user._id;

        // Validation
        if (!title || !description || !tags) {
            return res.status(400).json({
                error: 'Missing required fields',
                message: 'Title, description, and tags are required'
            });
        }

        if (title.length > 300) {
            return res.status(400).json({
                error: 'Title too long',
                message: 'Title must be 300 characters or less'
            });
        }

        // Process tags
        const processedTags = Array.isArray(tags)
            ? tags.map(tag => tag.toLowerCase().trim()).filter(tag => tag)
            : tags.split(',').map(tag => tag.toLowerCase().trim()).filter(tag => tag);

        if (processedTags.length === 0) {
            return res.status(400).json({
                error: 'No valid tags',
                message: 'At least one tag is required'
            });
        }

        // Create question
        const question = new Question({
            title: title.trim(),
            description: description.trim(),
            tags: processedTags,
            author: userId
        });

        await question.save();

        // Populate author info
        await question.populate('author', 'firstName lastName username reputation');

        // Format response
        const formattedQuestion = {
            id: question._id,
            title: question.title,
            description: question.description,
            tags: question.tags,
            author: {
                id: question.author._id,
                name: `${question.author.firstName} ${question.author.lastName}`.trim(),
                username: question.author.username,
                reputation: question.author.reputation
            },
            votes: 0,
            answers: 0,
            views: 0,
            createdAt: question.createdAt
        };

        res.status(201).json({
            message: 'Question created successfully',
            question: formattedQuestion
        });

    } catch (error) {
        console.error('Error creating question:', error);
        res.status(500).json({
            error: 'Server Error',
            message: 'Failed to create question'
        });
    }
});

// POST /api/questions/:id/vote - Vote on a question
router.post('/:id/vote', [authenticateUser, getCurrentUser, requirePermission('vote'), voteLimiter], async (req, res) => {
    try {
        const questionId = req.params.id;
        const { voteType } = req.body;
        const userId = req.user._id;

        if (!['up', 'down'].includes(voteType)) {
            return res.status(400).json({
                error: 'Invalid vote type',
                message: 'Vote type must be "up" or "down"'
            });
        }

        const question = await Question.findById(questionId);
        if (!question) {
            return res.status(404).json({
                error: 'Question not found',
                message: 'The question you are trying to vote on does not exist'
            });
        }

        // Can't vote on your own question
        if (question.author.toString() === userId.toString()) {
            return res.status(403).json({
                error: 'Cannot vote on own question',
                message: 'You cannot vote on your own question'
            });
        }

        // Apply vote
        const previousVote = question.getUserVote(userId);
        question.vote(userId, voteType);
        await question.save();

        const newVoteScore = question.votes.up.length - question.votes.down.length;
        const currentVote = question.getUserVote(userId);

        res.json({
            message: 'Vote recorded successfully',
            voteScore: newVoteScore,
            userVote: currentVote,
            previousVote
        });

    } catch (error) {
        console.error('Error voting on question:', error);
        res.status(500).json({
            error: 'Server Error',
            message: 'Failed to record vote'
        });
    }
});

module.exports = router;
