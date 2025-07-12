const mongoose = require('mongoose');

const answerSchema = new mongoose.Schema({
    content: {
        type: String,
        required: true,
        trim: true
    },
    question: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Question',
        required: true
    },
    author: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    votes: {
        up: [{
            user: {
                type: mongoose.Schema.Types.ObjectId,
                ref: 'User'
            },
            createdAt: {
                type: Date,
                default: Date.now
            }
        }],
        down: [{
            user: {
                type: mongoose.Schema.Types.ObjectId,
                ref: 'User'
            },
            createdAt: {
                type: Date,
                default: Date.now
            }
        }]
    },
    isAccepted: {
        type: Boolean,
        default: false
    },
    comments: [{
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Comment'
    }],
    isActive: {
        type: Boolean,
        default: true
    },
    lastActivity: {
        type: Date,
        default: Date.now
    }
}, {
    timestamps: true
});

// Virtual for vote score
answerSchema.virtual('voteScore').get(function () {
    return this.votes.up.length - this.votes.down.length;
});

// Method to check if user has voted
answerSchema.methods.getUserVote = function (userId) {
    const upVote = this.votes.up.find(vote => vote.user.toString() === userId.toString());
    const downVote = this.votes.down.find(vote => vote.user.toString() === userId.toString());

    if (upVote) return 'up';
    if (downVote) return 'down';
    return null;
};

// Method to add/remove vote
answerSchema.methods.vote = function (userId, voteType) {
    const currentVote = this.getUserVote(userId);

    // Remove existing votes
    this.votes.up = this.votes.up.filter(vote => vote.user.toString() !== userId.toString());
    this.votes.down = this.votes.down.filter(vote => vote.user.toString() !== userId.toString());

    // Add new vote if different from current
    if (currentVote !== voteType) {
        this.votes[voteType].push({ user: userId });
    }

    this.lastActivity = new Date();
    return this;
};

// Indexes for better performance
answerSchema.index({ question: 1 });
answerSchema.index({ author: 1 });
answerSchema.index({ createdAt: -1 });
answerSchema.index({ isAccepted: -1 });

module.exports = mongoose.model('Answer', answerSchema);
