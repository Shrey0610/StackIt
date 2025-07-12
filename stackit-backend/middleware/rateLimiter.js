const rateLimit = require('express-rate-limit');

// General API rate limiting
const generalLimiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 100, // limit each IP to 100 requests per windowMs
    message: {
        error: 'Too many requests',
        message: 'Too many requests from this IP, please try again later.'
    },
    standardHeaders: true, // Return rate limit info in the `RateLimit-*` headers
    legacyHeaders: false, // Disable the `X-RateLimit-*` headers
});

// Strict rate limiting for sensitive operations
const strictLimiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 10, // limit each IP to 10 requests per windowMs
    message: {
        error: 'Too many requests',
        message: 'Too many requests for this operation, please try again later.'
    }
});

// Rate limiting for posting content
const postLimiter = rateLimit({
    windowMs: 60 * 1000, // 1 minute
    max: 5, // limit each IP to 5 posts per minute
    message: {
        error: 'Posting too quickly',
        message: 'You are posting too quickly. Please wait a moment before posting again.'
    }
});

// Rate limiting for voting
const voteLimiter = rateLimit({
    windowMs: 60 * 1000, // 1 minute
    max: 30, // limit each IP to 30 votes per minute
    message: {
        error: 'Voting too quickly',
        message: 'You are voting too quickly. Please slow down.'
    }
});

module.exports = {
    generalLimiter,
    strictLimiter,
    postLimiter,
    voteLimiter
};
