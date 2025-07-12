const express = require('express');
const router = express.Router();
const Answer = require('../models/Answer');
const Question = require('../models/Question');
const Notification = require('../models/Notification');
const { authenticateUser, requirePermission } = require('../middleware/auth');
const { postLimiter, voteLimiter } = require('../middleware/rateLimiter');

// POST /api/answers - Create a new answer
router.post('/', authenticateUser, postLimiter, async (req, res) => {
    try {
        const { questionId, content } = req.body;
        const userId = req.user._id;

        // Validation
        if (!questionId || !content) {
            return res.status(400).json({
                error: 'Validation Error',
                message: 'Question ID and content are required'
            });
        }

        if (content.trim().length < 10) {
            return res.status(400).json({
                error: 'Validation Error',
                message: 'Answer content must be at least 10 characters'
            });
        }

        // Check if question exists
        const question = await Question.findById(questionId);
        if (!question || !question.isActive) {
            return res.status(404).json({
                error: 'Question not found',
                message: 'The question does not exist'
            });
        }

        // Create answer
        const answer = new Answer({
            content,
            author: userId,
            question: questionId
        });

        await answer.save();

        // Add answer to question
        question.answers.push(answer._id);
        question.lastActivity = new Date();
        await question.save();

        // Create notification for question author
        if (question.author.toString() !== userId.toString()) {
            await Notification.create({
                recipient: question.author,
                type: 'answer',
                relatedQuestion: questionId,
                relatedAnswer: answer._id,
                message: `${req.user.firstName} ${req.user.lastName} answered your question`
            });
        }

        // Populate answer for response
        await answer.populate('author', 'firstName lastName username reputation');

        res.status(201).json({
            message: 'Answer created successfully',
            answer: {
                id: answer._id,
                content: answer.content,
                author: {
                    id: answer.author._id,
                    name: `${answer.author.firstName} ${answer.author.lastName}`.trim(),
                    username: answer.author.username,
                    reputation: answer.author.reputation
                },
                votes: 0,
                isAccepted: false,
                createdAt: answer.createdAt
            }
        });

    } catch (error) {
        console.error('Error creating answer:', error);
        res.status(500).json({
            error: 'Server Error',
            message: 'Failed to create answer'
        });
    }
});

// PUT /api/answers/:id - Edit an answer
router.put('/:id', authenticateUser, async (req, res) => {
    try {
        const { content } = req.body;
        const answerId = req.params.id;
        const userId = req.user._id;

        // Validation
        if (!content || content.trim().length < 10) {
            return res.status(400).json({
                error: 'Validation Error',
                message: 'Answer content must be at least 10 characters'
            });
        }

        // Find answer
        const answer = await Answer.findById(answerId);
        if (!answer || !answer.isActive) {
            return res.status(404).json({
                error: 'Answer not found',
                message: 'The answer does not exist'
            });
        }

        // Check permissions
        if (answer.author.toString() !== userId.toString() && req.user.role !== 'admin') {
            return res.status(403).json({
                error: 'Access Denied',
                message: 'You can only edit your own answers'
            });
        }

        // Update answer
        answer.content = content;
        answer.updatedAt = new Date();
        await answer.save();

        res.json({
            message: 'Answer updated successfully',
            answer: {
                id: answer._id,
                content: answer.content,
                updatedAt: answer.updatedAt
            }
        });

    } catch (error) {
        console.error('Error updating answer:', error);
        res.status(500).json({
            error: 'Server Error',
            message: 'Failed to update answer'
        });
    }
});

// DELETE /api/answers/:id - Delete an answer
router.delete('/:id', authenticateUser, async (req, res) => {
    try {
        const answerId = req.params.id;
        const userId = req.user._id;

        // Find answer
        const answer = await Answer.findById(answerId);
        if (!answer || !answer.isActive) {
            return res.status(404).json({
                error: 'Answer not found',
                message: 'The answer does not exist'
            });
        }

        // Check permissions
        if (answer.author.toString() !== userId.toString() && req.user.role !== 'admin') {
            return res.status(403).json({
                error: 'Access Denied',
                message: 'You can only delete your own answers'
            });
        }

        // Soft delete
        answer.isActive = false;
        await answer.save();

        // Remove from question
        await Question.findByIdAndUpdate(answer.question, {
            $pull: { answers: answerId }
        });

        res.json({
            message: 'Answer deleted successfully'
        });

    } catch (error) {
        console.error('Error deleting answer:', error);
        res.status(500).json({
            error: 'Server Error',
            message: 'Failed to delete answer'
        });
    }
});

// POST /api/answers/:id/vote - Vote on an answer
router.post('/:id/vote', authenticateUser, voteLimiter, async (req, res) => {
    try {
        const { type } = req.body; // 'up' or 'down'
        const answerId = req.params.id;
        const userId = req.user._id;

        // Validation
        if (!['up', 'down'].includes(type)) {
            return res.status(400).json({
                error: 'Validation Error',
                message: 'Vote type must be "up" or "down"'
            });
        }

        // Find answer
        const answer = await Answer.findById(answerId).populate('author', 'firstName lastName');
        if (!answer || !answer.isActive) {
            return res.status(404).json({
                error: 'Answer not found',
                message: 'The answer does not exist'
            });
        }

        // Can't vote on own answer
        if (answer.author._id.toString() === userId.toString()) {
            return res.status(400).json({
                error: 'Invalid Action',
                message: 'You cannot vote on your own answer'
            });
        }

        // Process vote
        const result = answer.vote(userId, type);
        await answer.save();

        res.json({
            message: `Vote ${result.action} successfully`,
            votes: result.votes,
            userVote: result.userVote
        });

    } catch (error) {
        console.error('Error voting on answer:', error);
        res.status(500).json({
            error: 'Server Error',
            message: 'Failed to process vote'
        });
    }
});

// POST /api/answers/:id/accept - Accept an answer
router.post('/:id/accept', authenticateUser, async (req, res) => {
    try {
        const answerId = req.params.id;
        const userId = req.user._id;

        // Find answer
        const answer = await Answer.findById(answerId).populate('question');
        if (!answer || !answer.isActive) {
            return res.status(404).json({
                error: 'Answer not found',
                message: 'The answer does not exist'
            });
        }

        // Check if user is question owner
        if (answer.question.author.toString() !== userId.toString()) {
            return res.status(403).json({
                error: 'Access Denied',
                message: 'Only the question author can accept answers'
            });
        }

        // Unaccept previous accepted answer
        await Answer.updateMany(
            { question: answer.question._id },
            { isAccepted: false }
        );

        // Accept this answer
        answer.isAccepted = true;
        await answer.save();

        // Update question
        await Question.findByIdAndUpdate(answer.question._id, {
            acceptedAnswer: answerId,
            lastActivity: new Date()
        });

        // Create notification for answer author
        if (answer.author.toString() !== userId.toString()) {
            await Notification.create({
                recipient: answer.author,
                type: 'accept',
                relatedQuestion: answer.question._id,
                relatedAnswer: answerId,
                message: `${req.user.firstName} ${req.user.lastName} accepted your answer`
            });
        }

        res.json({
            message: 'Answer accepted successfully',
            answerId: answerId
        });

    } catch (error) {
        console.error('Error accepting answer:', error);
        res.status(500).json({
            error: 'Server Error',
            message: 'Failed to accept answer'
        });
    }
});

module.exports = router;
