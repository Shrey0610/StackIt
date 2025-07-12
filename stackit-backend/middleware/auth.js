const jwt = require('jsonwebtoken');
const { ClerkExpressRequireAuth } = require('@clerk/clerk-sdk-node');
const User = require('../models/User');

// Clerk authentication middleware
const authenticateUser = ClerkExpressRequireAuth({
    // Optional: customize error handling
    onError: (error) => {
        console.error('Clerk authentication error:', error);
    }
});

// Middleware to get user from database after Clerk auth
const getCurrentUser = async (req, res, next) => {
    try {
        if (req.auth && req.auth.userId) {
            const clerkId = req.auth.userId;

            // Find or create user in our database
            let user = await User.findOne({ clerkId });

            if (!user) {
                // If user doesn't exist, create from Clerk data
                const clerkUser = req.auth.user || {};
                user = new User({
                    clerkId,
                    email: clerkUser.emailAddresses?.[0]?.emailAddress || '',
                    firstName: clerkUser.firstName || 'User',
                    lastName: clerkUser.lastName || '',
                    username: clerkUser.username,
                    role: 'user' // Default role
                });
                await user.save();
                console.log(`✅ Created new user: ${user.email}`);
            }

            req.user = user;
        }
        next();
    } catch (error) {
        console.error('Error in getCurrentUser middleware:', error);
        res.status(500).json({
            error: 'Internal server error',
            message: 'Failed to authenticate user'
        });
    }
};

// Optional authentication (doesn't require login)
const optionalAuth = async (req, res, next) => {
    try {
        // Check if there's an Authorization header
        const authHeader = req.headers.authorization;

        if (authHeader && authHeader.startsWith('Bearer ')) {
            // Try to authenticate, but don't fail if it doesn't work
            try {
                await authenticateUser(req, res, () => {
                    // If authentication succeeds, get the user
                    getCurrentUser(req, res, next);
                });
            } catch (error) {
                // If authentication fails, continue without user
                console.log('Optional auth failed, continuing as guest:', error.message);
                next();
            }
        } else {
            // No auth header, continue as guest
            next();
        }
    } catch (error) {
        console.error('Error in optionalAuth middleware:', error);
        next();
    }
};

// Role-based authorization middleware
const requireRole = (roles) => {
    return (req, res, next) => {
        if (!req.user) {
            return res.status(401).json({
                error: 'Authentication required',
                message: 'Please log in to access this resource'
            });
        }

        if (!roles.includes(req.user.role)) {
            return res.status(403).json({
                error: 'Insufficient permissions',
                message: `This action requires ${roles.join(' or ')} role`
            });
        }

        next();
    };
};

// Permission-based authorization
const requirePermission = (permission) => {
    const rolePermissions = {
        guest: ['view'],
        user: ['view', 'vote', 'post', 'comment'],
        admin: ['view', 'vote', 'post', 'comment', 'moderate', 'delete']
    };

    return (req, res, next) => {
        if (!req.user && permission !== 'view') {
            return res.status(401).json({
                error: 'Authentication required',
                message: 'Please log in to perform this action'
            });
        }

        const userRole = req.user?.role || 'guest';
        const userPermissions = rolePermissions[userRole] || [];

        if (!userPermissions.includes(permission)) {
            return res.status(403).json({
                error: 'Insufficient permissions',
                message: `You don't have permission to ${permission}`
            });
        }

        next();
    };
};

module.exports = {
    authenticateUser,
    getCurrentUser,
    optionalAuth,
    requireRole,
    requirePermission
};
