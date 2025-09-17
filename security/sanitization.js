// Input Sanitization and Validation
class SecuritySanitizer {
    // HTML sanitization
    static sanitizeHTML(input, allowedTags = []) {
        if (typeof input !== 'string') return '';
        
        const allowedTagsSet = new Set(allowedTags.map(tag => tag.toLowerCase()));
        
        // Remove script tags and event handlers
        let sanitized = input
            .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '')
            .replace(/on\w+\s*=\s*["'][^"']*["']/gi, '')
            .replace(/javascript:/gi, '')
            .replace(/vbscript:/gi, '')
            .replace(/data:/gi, '');
        
        // If no tags are allowed, strip all HTML
        if (allowedTagsSet.size === 0) {
            return sanitized.replace(/<[^>]*>/g, '');
        }
        
        // Remove non-allowed tags
        sanitized = sanitized.replace(/<\/?([a-zA-Z][a-zA-Z0-9]*)\b[^>]*>/gi, (match, tagName) => {
            return allowedTagsSet.has(tagName.toLowerCase()) ? match : '';
        });
        
        return sanitized;
    }

    // SQL injection prevention
    static sanitizeSQL(input) {
        if (typeof input !== 'string') return input;
        
        // Remove common SQL injection patterns
        return input
            .replace(/['";]/g, '')
            .replace(/(-{2}|\/\*|\*\/)/g, '')
            .replace(/\b(union|select|insert|update|delete|drop|create|alter|exec|execute)\b/gi, '');
    }

    // NoSQL injection prevention
    static sanitizeNoSQL(input) {
        if (typeof input === 'object' && input !== null) {
            // Remove MongoDB operators
            const sanitized = {};
            for (const [key, value] of Object.entries(input)) {
                if (!key.startsWith('$') && !key.includes('.')) {
                    sanitized[key] = this.sanitizeNoSQL(value);
                }
            }
            return sanitized;
        }
        
        if (typeof input === 'string') {
            return input.replace(/[\$\.]/g, '');
        }
        
        return input;
    }

    // XSS prevention
    static escapeHTML(input) {
        if (typeof input !== 'string') return input;
        
        const escapeMap = {
            '&': '&amp;',
            '<': '&lt;',
            '>': '&gt;',
            '"': '&quot;',
            "'": '&#39;',
            '/': '&#x2F;',
            '`': '&#x60;',
            '=': '&#x3D;'
        };
        
        return input.replace(/[&<>"'`=\/]/g, (char) => escapeMap[char]);
    }

    // URL sanitization
    static sanitizeURL(url) {
        if (typeof url !== 'string') return '';
        
        try {
            const parsed = new URL(url);
            
            // Only allow http and https protocols
            if (!['http:', 'https:'].includes(parsed.protocol)) {
                return '';
            }
            
            return parsed.toString();
        } catch (error) {
            return '';
        }
    }

    // File path sanitization
    static sanitizeFilePath(path) {
        if (typeof path !== 'string') return '';
        
        // Remove directory traversal attempts
        return path
            .replace(/\.\./g, '')
            .replace(/[<>:"|?*]/g, '')
            .replace(/^\/+/, '')
            .substring(0, 255);
    }

    // Email sanitization
    static sanitizeEmail(email) {
        if (typeof email !== 'string') return '';
        
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        const cleaned = email.toLowerCase().trim();
        
        return emailRegex.test(cleaned) ? cleaned : '';
    }

    // Phone number sanitization
    static sanitizePhone(phone) {
        if (typeof phone !== 'string') return '';
        
        // Keep only digits, +, -, (, ), and spaces
        return phone.replace(/[^0-9+\-() ]/g, '').trim();
    }

    // Generic input sanitization
    static sanitizeInput(input, options = {}) {
        const {
            allowHTML = false,
            allowedTags = [],
            maxLength = 1000,
            trimWhitespace = true
        } = options;
        
        if (typeof input !== 'string') return '';
        
        let sanitized = input;
        
        if (trimWhitespace) {
            sanitized = sanitized.trim();
        }
        
        if (sanitized.length > maxLength) {
            sanitized = sanitized.substring(0, maxLength);
        }
        
        if (!allowHTML) {
            sanitized = this.escapeHTML(sanitized);
        } else {
            sanitized = this.sanitizeHTML(sanitized, allowedTags);
        }
        
        return sanitized;
    }
}

// CSRF Protection
class CSRFProtection {
    constructor(options = {}) {
        this.options = {
            tokenLength: 32,
            headerName: 'X-CSRF-Token',
            cookieName: 'csrf-token',
            cookieOptions: {
                httpOnly: true,
                secure: true,
                sameSite: 'strict',
                maxAge: 3600000 // 1 hour
            },
            ...options
        };
        
        this.tokens = new Map();
    }

    // Generate CSRF token
    generateToken(sessionId) {
        const token = this.randomBytes(this.options.tokenLength);
        const expiry = Date.now() + this.options.cookieOptions.maxAge;
        
        this.tokens.set(sessionId, { token, expiry });
        
        // Cleanup expired tokens
        this.cleanupExpiredTokens();
        
        return token;
    }

    // Validate CSRF token
    validateToken(sessionId, providedToken) {
        const tokenData = this.tokens.get(sessionId);
        
        if (!tokenData) {
            return false;
        }
        
        if (Date.now() > tokenData.expiry) {
            this.tokens.delete(sessionId);
            return false;
        }
        
        return this.constantTimeCompare(tokenData.token, providedToken);
    }

    // Get token for client-side use
    getTokenForClient(sessionId) {
        const tokenData = this.tokens.get(sessionId);
        return tokenData ? tokenData.token : null;
    }

    // Middleware for Express.js
    middleware() {
        return (req, res, next) => {
            const sessionId = req.sessionID || req.session?.id;
            
            if (!sessionId) {
                return res.status(400).json({ error: 'Session required' });
            }
            
            // Generate token for GET requests
            if (req.method === 'GET') {
                const token = this.generateToken(sessionId);
                res.cookie(this.options.cookieName, token, this.options.cookieOptions);
                req.csrfToken = token;
                return next();
            }
            
            // Validate token for state-changing requests
            if (['POST', 'PUT', 'DELETE', 'PATCH'].includes(req.method)) {
                const token = req.headers[this.options.headerName.toLowerCase()] || 
                             req.body._csrf || 
                             req.query._csrf;
                
                if (!this.validateToken(sessionId, token)) {
                    return res.status(403).json({ error: 'Invalid CSRF token' });
                }
            }
            
            next();
        };
    }

    // Client-side helper
    static getClientHelper() {
        return `
            window.CSRFHelper = {
                getToken: function() {
                    const cookies = document.cookie.split(';');
                    for (let cookie of cookies) {
                        const [name, value] = cookie.trim().split('=');
                        if (name === '${this.options.cookieName}') {
                            return decodeURIComponent(value);
                        }
                    }
                    return null;
                },
                
                addTokenToForm: function(form) {
                    const token = this.getToken();
                    if (token) {
                        const input = document.createElement('input');
                        input.type = 'hidden';
                        input.name = '_csrf';
                        input.value = token;
                        form.appendChild(input);
                    }
                },
                
                addTokenToFetch: function(options = {}) {
                    const token = this.getToken();
                    if (token) {
                        options.headers = options.headers || {};
                        options.headers['${this.options.headerName}'] = token;
                    }
                    return options;
                }
            };
        `;
    }

    // Utility methods
    randomBytes(length) {
        const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
        let result = '';
        for (let i = 0; i < length; i++) {
            result += chars.charAt(Math.floor(Math.random() * chars.length));
        }
        return result;
    }

    constantTimeCompare(a, b) {
        if (a.length !== b.length) {
            return false;
        }
        
        let result = 0;
        for (let i = 0; i < a.length; i++) {
            result |= a.charCodeAt(i) ^ b.charCodeAt(i);
        }
        
        return result === 0;
    }

    cleanupExpiredTokens() {
        const now = Date.now();
        for (const [sessionId, tokenData] of this.tokens) {
            if (now > tokenData.expiry) {
                this.tokens.delete(sessionId);
            }
        }
    }
}

// Rate Limiting
class RateLimiter {
    constructor(options = {}) {
        this.options = {
            windowMs: 900000, // 15 minutes
            maxRequests: 100,
            message: 'Too many requests',
            standardHeaders: true,
            legacyHeaders: false,
            skipSuccessfulRequests: false,
            skipFailedRequests: false,
            ...options
        };
        
        this.clients = new Map();
        this.resetTimers = new Map();
    }

    // Check if request is allowed
    isAllowed(clientId, weight = 1) {
        const now = Date.now();
        const windowStart = now - this.options.windowMs;
        
        let clientData = this.clients.get(clientId);
        
        if (!clientData) {
            clientData = {
                requests: [],
                resetTime: now + this.options.windowMs
            };
            this.clients.set(clientId, clientData);
            this.scheduleReset(clientId, this.options.windowMs);
        }
        
        // Remove old requests
        clientData.requests = clientData.requests.filter(time => time > windowStart);
        
        // Check if adding this request would exceed limit
        const currentCount = clientData.requests.reduce((sum, req) => sum + (req.weight || 1), 0);
        
        if (currentCount + weight > this.options.maxRequests) {
            return {
                allowed: false,
                remaining: Math.max(0, this.options.maxRequests - currentCount),
                resetTime: clientData.resetTime,
                totalHits: currentCount
            };
        }
        
        // Add current request
        clientData.requests.push({ time: now, weight });
        
        return {
            allowed: true,
            remaining: Math.max(0, this.options.maxRequests - currentCount - weight),
            resetTime: clientData.resetTime,
            totalHits: currentCount + weight
        };
    }

    // Express.js middleware
    middleware() {
        return (req, res, next) => {
            const clientId = this.getClientId(req);
            const result = this.isAllowed(clientId);
            
            if (this.options.standardHeaders) {
                res.set({
                    'RateLimit-Limit': this.options.maxRequests,
                    'RateLimit-Remaining': result.remaining,
                    'RateLimit-Reset': new Date(result.resetTime).toISOString()
                });
            }
            
            if (this.options.legacyHeaders) {
                res.set({
                    'X-RateLimit-Limit': this.options.maxRequests,
                    'X-RateLimit-Remaining': result.remaining,
                    'X-RateLimit-Reset': Math.ceil(result.resetTime / 1000)
                });
            }
            
            if (!result.allowed) {
                return res.status(429).json({
                    error: this.options.message,
                    retryAfter: Math.ceil((result.resetTime - Date.now()) / 1000)
                });
            }
            
            next();
        };
    }

    // Get client identifier
    getClientId(req) {
        return req.ip || 
               req.connection.remoteAddress || 
               req.socket.remoteAddress || 
               'unknown';
    }

    // Schedule reset timer
    scheduleReset(clientId, delay) {
        if (this.resetTimers.has(clientId)) {
            clearTimeout(this.resetTimers.get(clientId));
        }
        
        const timer = setTimeout(() => {
            this.clients.delete(clientId);
            this.resetTimers.delete(clientId);
        }, delay);
        
        this.resetTimers.set(clientId, timer);
    }

    // Reset client data
    reset(clientId) {
        this.clients.delete(clientId);
        if (this.resetTimers.has(clientId)) {
            clearTimeout(this.resetTimers.get(clientId));
            this.resetTimers.delete(clientId);
        }
    }

    // Get current status for client
    getStatus(clientId) {
        const result = this.isAllowed(clientId, 0); // Check without incrementing
        return result;
    }
}

if (typeof module !== 'undefined' && module.exports) {
    module.exports = {
        SecuritySanitizer,
        CSRFProtection,
        RateLimiter
    };
}