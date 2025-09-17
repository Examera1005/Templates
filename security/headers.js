// Security Headers and Middleware
class SecurityHeaders {
    constructor(options = {}) {
        this.options = {
            // Content Security Policy
            csp: {
                defaultSrc: ["'self'"],
                scriptSrc: ["'self'"],
                styleSrc: ["'self'", "'unsafe-inline'"],
                imgSrc: ["'self'", "data:", "https:"],
                connectSrc: ["'self'"],
                fontSrc: ["'self'"],
                objectSrc: ["'none'"],
                mediaSrc: ["'self'"],
                frameSrc: ["'none'"],
                ...options.csp
            },
            
            // HTTP Strict Transport Security
            hsts: {
                maxAge: 31536000, // 1 year
                includeSubDomains: true,
                preload: true,
                ...options.hsts
            },
            
            // Other security options
            frameOptions: 'DENY',
            contentTypeOptions: true,
            referrerPolicy: 'strict-origin-when-cross-origin',
            permissionsPolicy: {
                camera: [],
                microphone: [],
                geolocation: [],
                ...options.permissionsPolicy
            },
            
            ...options
        };
    }

    // Generate CSP header value
    generateCSP() {
        const directives = [];
        
        for (const [directive, sources] of Object.entries(this.options.csp)) {
            const kebabDirective = directive.replace(/([A-Z])/g, '-$1').toLowerCase();
            const sourceList = Array.isArray(sources) ? sources.join(' ') : sources;
            directives.push(`${kebabDirective} ${sourceList}`);
        }
        
        return directives.join('; ');
    }

    // Generate HSTS header value
    generateHSTS() {
        const { maxAge, includeSubDomains, preload } = this.options.hsts;
        let hsts = `max-age=${maxAge}`;
        
        if (includeSubDomains) {
            hsts += '; includeSubDomains';
        }
        
        if (preload) {
            hsts += '; preload';
        }
        
        return hsts;
    }

    // Generate Permissions Policy header
    generatePermissionsPolicy() {
        const policies = [];
        
        for (const [feature, allowlist] of Object.entries(this.options.permissionsPolicy)) {
            const sources = Array.isArray(allowlist) ? allowlist : [allowlist];
            if (sources.length === 0) {
                policies.push(`${feature}=()`);
            } else {
                const sourceList = sources.map(source => `"${source}"`).join(' ');
                policies.push(`${feature}=(${sourceList})`);
            }
        }
        
        return policies.join(', ');
    }

    // Express.js middleware
    middleware() {
        return (req, res, next) => {
            // Content Security Policy
            if (this.options.csp) {
                res.setHeader('Content-Security-Policy', this.generateCSP());
            }

            // HTTP Strict Transport Security
            if (this.options.hsts && req.secure) {
                res.setHeader('Strict-Transport-Security', this.generateHSTS());
            }

            // X-Frame-Options
            if (this.options.frameOptions) {
                res.setHeader('X-Frame-Options', this.options.frameOptions);
            }

            // X-Content-Type-Options
            if (this.options.contentTypeOptions) {
                res.setHeader('X-Content-Type-Options', 'nosniff');
            }

            // Referrer Policy
            if (this.options.referrerPolicy) {
                res.setHeader('Referrer-Policy', this.options.referrerPolicy);
            }

            // Permissions Policy
            if (this.options.permissionsPolicy) {
                res.setHeader('Permissions-Policy', this.generatePermissionsPolicy());
            }

            // X-XSS-Protection (legacy)
            res.setHeader('X-XSS-Protection', '0');

            // Remove server signature
            res.removeHeader('X-Powered-By');

            next();
        };
    }

    // Update CSP for inline scripts with nonce
    addNonce(req, res, next) {
        const nonce = this.generateNonce();
        req.nonce = nonce;
        
        // Update CSP to include nonce
        const csp = this.generateCSP().replace(
            /script-src ([^;]+)/,
            `script-src $1 'nonce-${nonce}'`
        );
        
        res.setHeader('Content-Security-Policy', csp);
        next();
    }

    generateNonce() {
        const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
        let nonce = '';
        for (let i = 0; i < 16; i++) {
            nonce += chars.charAt(Math.floor(Math.random() * chars.length));
        }
        return nonce;
    }
}

// Session Security
class SessionSecurity {
    constructor(options = {}) {
        this.options = {
            name: 'sessionid',
            secret: process.env.SESSION_SECRET || 'change-this-secret',
            cookie: {
                secure: true,
                httpOnly: true,
                maxAge: 1800000, // 30 minutes
                sameSite: 'strict'
            },
            regenerateOnLogin: true,
            maxSessions: 5,
            ...options
        };
        
        this.activeSessions = new Map();
    }

    // Session configuration for express-session
    getSessionConfig() {
        return {
            name: this.options.name,
            secret: this.options.secret,
            resave: false,
            saveUninitialized: false,
            cookie: this.options.cookie,
            rolling: true, // Reset expiry on each request
            genid: () => this.generateSessionId()
        };
    }

    // Generate secure session ID
    generateSessionId() {
        const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
        let id = '';
        for (let i = 0; i < 32; i++) {
            id += chars.charAt(Math.floor(Math.random() * chars.length));
        }
        return id;
    }

    // Session validation middleware
    validateSession() {
        return (req, res, next) => {
            if (!req.session) {
                return next();
            }

            // Check session expiry
            if (req.session.expiresAt && Date.now() > req.session.expiresAt) {
                req.session.destroy();
                return res.status(401).json({ error: 'Session expired' });
            }

            // Update last activity
            req.session.lastActivity = Date.now();
            
            // Check for session hijacking
            if (this.detectSessionHijacking(req)) {
                req.session.destroy();
                return res.status(401).json({ error: 'Session security violation' });
            }

            next();
        };
    }

    // Detect potential session hijacking
    detectSessionHijacking(req) {
        if (!req.session.userAgent || !req.session.ipAddress) {
            return false;
        }

        const currentUserAgent = req.headers['user-agent'];
        const currentIP = req.ip || req.connection.remoteAddress;

        // Check for user agent changes
        if (req.session.userAgent !== currentUserAgent) {
            return true;
        }

        // Check for IP changes (with some flexibility for mobile users)
        const sessionIP = req.session.ipAddress.split('.').slice(0, 3).join('.');
        const currentIPPrefix = currentIP.split('.').slice(0, 3).join('.');
        
        if (sessionIP !== currentIPPrefix) {
            return true;
        }

        return false;
    }

    // Initialize session security data
    initializeSession(req) {
        req.session.userAgent = req.headers['user-agent'];
        req.session.ipAddress = req.ip || req.connection.remoteAddress;
        req.session.createdAt = Date.now();
        req.session.lastActivity = Date.now();
        req.session.expiresAt = Date.now() + this.options.cookie.maxAge;
    }

    // Regenerate session (e.g., on login)
    regenerateSession(req, callback) {
        req.session.regenerate((err) => {
            if (err) {
                return callback(err);
            }
            
            this.initializeSession(req);
            callback();
        });
    }

    // Manage multiple sessions per user
    trackUserSession(userId, sessionId) {
        if (!this.activeSessions.has(userId)) {
            this.activeSessions.set(userId, new Set());
        }
        
        const userSessions = this.activeSessions.get(userId);
        userSessions.add(sessionId);
        
        // Limit number of sessions
        if (userSessions.size > this.options.maxSessions) {
            const oldestSession = userSessions.values().next().value;
            userSessions.delete(oldestSession);
            // TODO: Invalidate oldest session in store
        }
    }

    removeUserSession(userId, sessionId) {
        const userSessions = this.activeSessions.get(userId);
        if (userSessions) {
            userSessions.delete(sessionId);
            if (userSessions.size === 0) {
                this.activeSessions.delete(userId);
            }
        }
    }
}

// Password Security
class PasswordSecurity {
    constructor(options = {}) {
        this.options = {
            minLength: 8,
            maxLength: 128,
            requireUppercase: true,
            requireLowercase: true,
            requireNumbers: true,
            requireSpecialChars: true,
            preventCommonPasswords: true,
            saltRounds: 12,
            ...options
        };
        
        this.commonPasswords = new Set([
            'password', '123456', '123456789', 'qwerty', 'abc123',
            'password123', 'admin', 'letmein', 'welcome', 'monkey'
        ]);
    }

    // Validate password strength
    validatePassword(password) {
        const errors = [];
        
        if (password.length < this.options.minLength) {
            errors.push(`Password must be at least ${this.options.minLength} characters long`);
        }
        
        if (password.length > this.options.maxLength) {
            errors.push(`Password must be no more than ${this.options.maxLength} characters long`);
        }
        
        if (this.options.requireUppercase && !/[A-Z]/.test(password)) {
            errors.push('Password must contain at least one uppercase letter');
        }
        
        if (this.options.requireLowercase && !/[a-z]/.test(password)) {
            errors.push('Password must contain at least one lowercase letter');
        }
        
        if (this.options.requireNumbers && !/\d/.test(password)) {
            errors.push('Password must contain at least one number');
        }
        
        if (this.options.requireSpecialChars && !/[!@#$%^&*(),.?":{}|<>]/.test(password)) {
            errors.push('Password must contain at least one special character');
        }
        
        if (this.options.preventCommonPasswords && this.commonPasswords.has(password.toLowerCase())) {
            errors.push('Password is too common');
        }
        
        return {
            isValid: errors.length === 0,
            errors: errors,
            strength: this.calculateStrength(password)
        };
    }

    // Calculate password strength score
    calculateStrength(password) {
        let score = 0;
        
        // Length bonus
        score += Math.min(password.length * 2, 20);
        
        // Character variety
        if (/[a-z]/.test(password)) score += 5;
        if (/[A-Z]/.test(password)) score += 5;
        if (/\d/.test(password)) score += 5;
        if (/[!@#$%^&*(),.?":{}|<>]/.test(password)) score += 10;
        
        // Patterns (reduce score)
        if (/(.)\1{2,}/.test(password)) score -= 10; // Repeated characters
        if (/123|abc|qwe/i.test(password)) score -= 10; // Sequential patterns
        
        // Normalize to 0-100
        return Math.max(0, Math.min(100, score));
    }

    // Hash password with bcrypt-like function (simplified)
    async hashPassword(password) {
        const validation = this.validatePassword(password);
        if (!validation.isValid) {
            throw new Error(validation.errors.join(', '));
        }
        
        // In a real implementation, use bcrypt
        // const bcrypt = require('bcrypt');
        // return await bcrypt.hash(password, this.options.saltRounds);
        
        // Simplified hash for template purposes
        const salt = this.generateSalt();
        const hash = await this.simpleHash(password + salt);
        return `${salt}:${hash}`;
    }

    // Verify password
    async verifyPassword(password, hash) {
        const [salt, hashedPassword] = hash.split(':');
        const computedHash = await this.simpleHash(password + salt);
        return this.constantTimeCompare(hashedPassword, computedHash);
    }

    // Generate salt
    generateSalt() {
        const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
        let salt = '';
        for (let i = 0; i < 16; i++) {
            salt += chars.charAt(Math.floor(Math.random() * chars.length));
        }
        return salt;
    }

    // Simplified hash function (use crypto.pbkdf2 in production)
    async simpleHash(input) {
        const encoder = new TextEncoder();
        const data = encoder.encode(input);
        const hashBuffer = await crypto.subtle.digest('SHA-256', data);
        const hashArray = Array.from(new Uint8Array(hashBuffer));
        return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
    }

    // Constant time comparison
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
}

if (typeof module !== 'undefined' && module.exports) {
    module.exports = {
        SecurityHeaders,
        SessionSecurity,
        PasswordSecurity
    };
}