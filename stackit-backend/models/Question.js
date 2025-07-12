const mongoose = require('mongoose');

const questionSchema = new mongoose.Schema({
    title: {
        type: String,
        required: true,
        trim: true,
        maxlength: 300
    },
    description: {
        type: String,
        required: true,
        trim: true
    },
    tags: [{
        type: String,
        required: true,
        lowercase: true,
        trim: true
    }],
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
    answers: [{
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Answer'
    }],
    views: {
        count: {
            type: Number,
            default: 0
        },
        viewedBy: [{
            user: {
                type: mongoose.Schema.Types.ObjectId,
                ref: 'User'
            },
            viewedAt: {
                type: Date,
                default: Date.now
            }
        }]
    },
    acceptedAnswer: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Answer',
        default: null
    },
    isActive: {
        type: Boolean,
        default: true
    },
    isFeatured: {
        type: Boolean,
        default: false
    },
    lastActivity: {
        type: Date,
        default: Date.now
    }
}, {
    timestamps: true
});

// Virtual for vote score
questionSchema.virtual('voteScore').get(function () {
    return this.votes.up.length - this.votes.down.length;
});

// Virtual for answer count
questionSchema.virtual('answerCount').get(function () {
    return this.answers.length;
});

// Virtual for view count
questionSchema.virtual('viewCount').get(function () {
    return this.views.count;
});

// Method to check if user has voted
questionSchema.methods.getUserVote = function (userId) {
    const upVote = this.votes.up.find(vote => vote.user.toString() === userId.toString());
    const downVote = this.votes.down.find(vote => vote.user.toString() === userId.toString());

    if (upVote) return 'up';
    if (downVote) return 'down';
    return null;
};

// Method to add/remove vote
questionSchema.methods.vote = function (userId, voteType) {
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

// Method to increment view count
questionSchema.methods.incrementView = function (userId = null) {
    this.views.count += 1;

    if (userId) {
        // Check if user already viewed
        const existingView = this.views.viewedBy.find(view =>
            view.user.toString() === userId.toString()
        );

        if (!existingView) {
            this.views.viewedBy.push({ user: userId });
        }
    }

    return this;
};

// Indexes for better performance
questionSchema.index({ title: 'text', description: 'text' });
questionSchema.index({ tags: 1 });
questionSchema.index({ author: 1 });
questionSchema.index({ createdAt: -1 });
questionSchema.index({ 'votes.up': -1 });
questionSchema.index({ 'views.count': -1 });

module.exports = mongoose.model('Question', questionSchema);
