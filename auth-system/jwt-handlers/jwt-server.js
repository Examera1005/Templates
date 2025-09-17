// JWT Server-Side Utilities (Node.js)
// Requires: npm install jsonwebtoken bcryptjs

const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');

class JWTServerManager {
    constructor(options = {}) {
        this.options = {
            accessTokenSecret: process.env.JWT_ACCESS_SECRET || 'your-access-token-secret',
            refreshTokenSecret: process.env.JWT_REFRESH_SECRET || 'your-refresh-token-secret',
            accessTokenExpiry: process.env.JWT_ACCESS_EXPIRY || '15m',
            refreshTokenExpiry: process.env.JWT_REFRESH_EXPIRY || '7d',
            issuer: process.env.JWT_ISSUER || 'your-app',
            audience: process.env.JWT_AUDIENCE || 'your-app-users',
            algorithm: 'HS256',
            ...options
        };

        // Store active refresh tokens (in production, use Redis or database)
        this.refreshTokenStore = new Set();
    }

    // Generate access token
    generateAccessToken(payload) {
        const tokenPayload = {
            ...payload,
            type: 'access',
            iat: Math.floor(Date.now() / 1000)
        };

        return jwt.sign(tokenPayload, this.options.accessTokenSecret, {
            expiresIn: this.options.accessTokenExpiry,
            issuer: this.options.issuer,
            audience: this.options.audience,
            algorithm: this.options.algorithm
        });
    }

    // Generate refresh token
    generateRefreshToken(payload) {
        const tokenPayload = {
            ...payload,
            type: 'refresh',
            iat: Math.floor(Date.now() / 1000)
        };

        const token = jwt.sign(tokenPayload, this.options.refreshTokenSecret, {
            expiresIn: this.options.refreshTokenExpiry,
            issuer: this.options.issuer,
            audience: this.options.audience,
            algorithm: this.options.algorithm
        });

        // Store refresh token
        this.refreshTokenStore.add(token);
        return token;
    }

    // Generate both tokens
    generateTokenPair(payload) {
        const accessToken = this.generateAccessToken(payload);
        const refreshToken = this.generateRefreshToken(payload);

        return { accessToken, refreshToken };
    }

    // Verify access token
    verifyAccessToken(token) {
        try {
            const decoded = jwt.verify(token, this.options.accessTokenSecret, {
                issuer: this.options.issuer,
                audience: this.options.audience,
                algorithms: [this.options.algorithm]
            });

            if (decoded.type !== 'access') {
                throw new Error('Invalid token type');
            }

            return { valid: true, payload: decoded };
        } catch (error) {
            return { valid: false, error: error.message };
        }
    }

    // Verify refresh token
    verifyRefreshToken(token) {
        try {
            const decoded = jwt.verify(token, this.options.refreshTokenSecret, {
                issuer: this.options.issuer,
                audience: this.options.audience,
                algorithms: [this.options.algorithm]
            });

            if (decoded.type !== 'refresh') {
                throw new Error('Invalid token type');
            }

            // Check if token is in store
            if (!this.refreshTokenStore.has(token)) {
                throw new Error('Token not found in store');
            }

            return { valid: true, payload: decoded };
        } catch (error) {
            return { valid: false, error: error.message };
        }
    }

    // Refresh access token
    refreshAccessToken(refreshToken) {
        const verification = this.verifyRefreshToken(refreshToken);
        
        if (!verification.valid) {
            throw new Error(`Invalid refresh token: ${verification.error}`);
        }

        // Generate new access token with same payload (minus JWT fields)
        const { iat, exp, type, ...userPayload } = verification.payload;
        const newAccessToken = this.generateAccessToken(userPayload);

        return { accessToken: newAccessToken };
    }

    // Revoke refresh token
    revokeRefreshToken(token) {
        return this.refreshTokenStore.delete(token);
    }

    // Revoke all refresh tokens for a user
    revokeAllRefreshTokens(userId) {
        let revokedCount = 0;
        
        for (const token of this.refreshTokenStore) {
            try {
                const decoded = jwt.decode(token);
                if (decoded && (decoded.userId === userId || decoded.sub === userId || decoded.id === userId)) {
                    this.refreshTokenStore.delete(token);
                    revokedCount++;
                }
            } catch (error) {
                // Token is malformed, remove it anyway
                this.refreshTokenStore.delete(token);
            }
        }

        return revokedCount;
    }

    // Hash password
    async hashPassword(password) {
        const saltRounds = 12;
        return await bcrypt.hash(password, saltRounds);
    }

    // Verify password
    async verifyPassword(password, hashedPassword) {
        return await bcrypt.compare(password, hashedPassword);
    }

    // Middleware to verify JWT token
    authenticateToken() {
        return (req, res, next) => {
            const authHeader = req.headers['authorization'];
            const token = authHeader && authHeader.split(' ')[1]; // Bearer TOKEN

            if (!token) {
                return res.status(401).json({ 
                    error: 'Access token required',
                    code: 'TOKEN_REQUIRED'
                });
            }

            const verification = this.verifyAccessToken(token);
            
            if (!verification.valid) {
                return res.status(403).json({ 
                    error: 'Invalid or expired token',
                    code: 'TOKEN_INVALID',
                    details: verification.error
                });
            }

            // Add user info to request
            req.user = verification.payload;
            next();
        };
    }

    // Middleware to optionally verify JWT token
    optionalAuthentication() {
        return (req, res, next) => {
            const authHeader = req.headers['authorization'];
            const token = authHeader && authHeader.split(' ')[1];

            if (token) {
                const verification = this.verifyAccessToken(token);
                if (verification.valid) {
                    req.user = verification.payload;
                }
            }

            next();
        };
    }

    // Role-based authorization middleware
    requireRole(roles) {
        return (req, res, next) => {
            if (!req.user) {
                return res.status(401).json({ 
                    error: 'Authentication required',
                    code: 'AUTH_REQUIRED'
                });
            }

            const userRoles = req.user.roles || [];
            const hasRole = Array.isArray(roles) 
                ? roles.some(role => userRoles.includes(role))
                : userRoles.includes(roles);

            if (!hasRole) {
                return res.status(403).json({ 
                    error: 'Insufficient permissions',
                    code: 'INSUFFICIENT_PERMISSIONS',
                    required: roles,
                    current: userRoles
                });
            }

            next();
        };
    }

    // Permission-based authorization middleware
    requirePermission(permissions) {
        return (req, res, next) => {
            if (!req.user) {
                return res.status(401).json({ 
                    error: 'Authentication required',
                    code: 'AUTH_REQUIRED'
                });
            }

            const userPermissions = req.user.permissions || [];
            const hasPermission = Array.isArray(permissions) 
                ? permissions.some(permission => userPermissions.includes(permission))
                : userPermissions.includes(permissions);

            if (!hasPermission) {
                return res.status(403).json({ 
                    error: 'Insufficient permissions',
                    code: 'INSUFFICIENT_PERMISSIONS',
                    required: permissions,
                    current: userPermissions
                });
            }

            next();
        };
    }

    // Get token info without verification (for debugging)
    decodeToken(token) {
        try {
            return jwt.decode(token, { complete: true });
        } catch (error) {
            return null;
        }
    }

    // Clean expired tokens from store (call periodically)
    cleanExpiredTokens() {
        let cleanedCount = 0;
        
        for (const token of this.refreshTokenStore) {
            try {
                jwt.verify(token, this.options.refreshTokenSecret);
            } catch (error) {
                // Token is expired or invalid, remove it
                this.refreshTokenStore.delete(token);
                cleanedCount++;
            }
        }

        return cleanedCount;
    }

    // Get active token count
    getActiveTokenCount() {
        return this.refreshTokenStore.size;
    }

    // Get user token count
    getUserTokenCount(userId) {
        let count = 0;
        
        for (const token of this.refreshTokenStore) {
            try {
                const decoded = jwt.decode(token);
                if (decoded && (decoded.userId === userId || decoded.sub === userId || decoded.id === userId)) {
                    count++;
                }
            } catch (error) {
                // Ignore malformed tokens
            }
        }

        return count;
    }
}

// Example usage routes
const createAuthRoutes = (jwtManager, userService) => {
    const express = require('express');
    const router = express.Router();

    // Login route
    router.post('/login', async (req, res) => {
        try {
            const { email, password } = req.body;

            // Validate input
            if (!email || !password) {
                return res.status(400).json({
                    error: 'Email and password are required'
                });
            }

            // Find user (implement your user service)
            const user = await userService.findByEmail(email);
            if (!user) {
                return res.status(401).json({
                    error: 'Invalid credentials'
                });
            }

            // Verify password
            const isValidPassword = await jwtManager.verifyPassword(password, user.password);
            if (!isValidPassword) {
                return res.status(401).json({
                    error: 'Invalid credentials'
                });
            }

            // Generate tokens
            const tokenPayload = {
                userId: user.id,
                email: user.email,
                name: user.name,
                roles: user.roles || [],
                permissions: user.permissions || []
            };

            const { accessToken, refreshToken } = jwtManager.generateTokenPair(tokenPayload);

            res.json({
                success: true,
                accessToken,
                refreshToken,
                user: {
                    id: user.id,
                    email: user.email,
                    name: user.name,
                    roles: user.roles
                }
            });
        } catch (error) {
            console.error('Login error:', error);
            res.status(500).json({
                error: 'Internal server error'
            });
        }
    });

    // Refresh token route
    router.post('/refresh', (req, res) => {
        try {
            const { refreshToken } = req.body;

            if (!refreshToken) {
                return res.status(400).json({
                    error: 'Refresh token is required'
                });
            }

            const result = jwtManager.refreshAccessToken(refreshToken);

            res.json({
                success: true,
                ...result
            });
        } catch (error) {
            res.status(401).json({
                error: error.message
            });
        }
    });

    // Logout route
    router.post('/logout', (req, res) => {
        const { refreshToken } = req.body;

        if (refreshToken) {
            jwtManager.revokeRefreshToken(refreshToken);
        }

        res.json({
            success: true,
            message: 'Logged out successfully'
        });
    });

    // Logout all devices route
    router.post('/logout-all', jwtManager.authenticateToken(), (req, res) => {
        const userId = req.user.userId || req.user.sub || req.user.id;
        const revokedCount = jwtManager.revokeAllRefreshTokens(userId);

        res.json({
            success: true,
            message: `Logged out from ${revokedCount} devices`
        });
    });

    return router;
};

module.exports = {
    JWTServerManager,
    createAuthRoutes
};