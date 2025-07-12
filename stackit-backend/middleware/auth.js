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
                const userEmail = clerkUser.emailAddresses?.[0]?.emailAddress || '';

                // Check if this email should be an admin
                const ADMIN_EMAIL = "work.shreyshah21@gmail.com";
                const userRole = userEmail === ADMIN_EMAIL ? 'admin' : 'user';

                user = new User({
                    clerkId,
                    email: userEmail,
                    firstName: clerkUser.firstName || 'User',
                    lastName: clerkUser.lastName || '',
                    username: clerkUser.username,
                    role: userRole
                });
                await user.save();
                console.log(`✅ Created new user: ${user.email} with role: ${user.role}`);
            } else {
                // For existing users, check if they should be promoted to admin
                const ADMIN_EMAIL = "work.shreyshah21@gmail.com";
                if (user.email === ADMIN_EMAIL && user.role !== 'admin') {
                    user.role = 'admin';
                    await user.save();
                    console.log(`✅ Promoted user to admin: ${user.email}`);
                }
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
