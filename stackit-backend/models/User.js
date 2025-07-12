const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
    clerkId: {
        type: String,
        required: true,
        unique: true
    },
    email: {
        type: String,
        required: true,
        unique: true
    },
    firstName: {
        type: String,
        required: true
    },
    lastName: {
        type: String,
        required: true
    },
    username: {
        type: String,
        unique: true,
        sparse: true
    },
    role: {
        type: String,
        enum: ['guest', 'user', 'admin'],
        default: 'user'
    },
    avatar: {
        type: String,
        default: ''
    },
    reputation: {
        type: Number,
        default: 0
    },
    questionsAsked: [{
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Question'
    }],
    answersGiven: [{
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Answer'
    }],
    votes: [{
        targetType: {
            type: String,
            enum: ['question', 'answer']
        },
        targetId: {
            type: mongoose.Schema.Types.ObjectId
        },
        voteType: {
            type: String,
            enum: ['up', 'down']
        },
        createdAt: {
            type: Date,
            default: Date.now
        }
    }],
    watchedTags: [{
        type: String
    }],
    isActive: {
        type: Boolean,
        default: true
    }
}, {
    timestamps: true
});

// Virtual for full name
userSchema.virtual('fullName').get(function () {
    return `${this.firstName} ${this.lastName}`.trim();
});

// Method to check if user has voted on a target
userSchema.methods.hasVoted = function (targetType, targetId) {
    return this.votes.find(vote =>
        vote.targetType === targetType &&
        vote.targetId.toString() === targetId.toString()
    );
};

// Method to add or update vote
userSchema.methods.addVote = function (targetType, targetId, voteType) {
    const existingVote = this.hasVoted(targetType, targetId);

    if (existingVote) {
        if (existingVote.voteType === voteType) {
            // Remove vote if clicking same button
            this.votes = this.votes.filter(vote =>
                !(vote.targetType === targetType && vote.targetId.toString() === targetId.toString())
            );
            return 'removed';
        } else {
            // Change vote type
            existingVote.voteType = voteType;
            existingVote.createdAt = new Date();
            return 'changed';
        }
    } else {
        // Add new vote
        this.votes.push({
            targetType,
            targetId,
            voteType,
            createdAt: new Date()
        });
        return 'added';
    }
};

module.exports = mongoose.model('User', userSchema);
