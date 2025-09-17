# Security Templates

A comprehensive security library providing essential security tools and utilities for web applications, covering input sanitization, CSRF protection, rate limiting, security headers, and security auditing.

## Overview

This security library provides production-ready solutions for common web security challenges:
- **Input Sanitization**: Prevent XSS, SQL injection, and other input-based attacks
- **CSRF Protection**: Complete Cross-Site Request Forgery protection system
- **Rate Limiting**: Protect against brute force and DoS attacks
- **Security Headers**: Implement proper HTTP security headers
- **Session Security**: Secure session management and validation
- **Password Security**: Strong password policies and secure hashing
- **Security Auditing**: Automated security vulnerability scanning

## Modules

### 1. Input Sanitization (`sanitization.js`)

#### SecuritySanitizer Class
Comprehensive input sanitization and validation:

```javascript
// HTML sanitization with allowed tags
const clean = SecuritySanitizer.sanitizeHTML(userInput, ['p', 'strong', 'em']);

// SQL injection prevention
const safe = SecuritySanitizer.sanitizeSQL(userInput);

// XSS prevention
const escaped = SecuritySanitizer.escapeHTML(userInput);

// Generic input sanitization
const sanitized = SecuritySanitizer.sanitizeInput(userInput, {
    allowHTML: false,
    maxLength: 500,
    trimWhitespace: true
});
```

#### CSRFProtection Class
Complete CSRF protection system:

```javascript
const csrf = new CSRFProtection({
    tokenLength: 32,
    headerName: 'X-CSRF-Token',
    cookieName: 'csrf-token'
});

// Express.js middleware
app.use(csrf.middleware());

// Generate token for session
const token = csrf.generateToken(sessionId);

// Validate token
const isValid = csrf.validateToken(sessionId, providedToken);
```

#### RateLimiter Class
Flexible rate limiting with configurable windows:

```javascript
const limiter = new RateLimiter({
    windowMs: 900000, // 15 minutes
    maxRequests: 100,
    message: 'Too many requests'
});

// Express.js middleware
app.use(limiter.middleware());

// Manual rate limit check
const result = limiter.isAllowed(clientId);
if (!result.allowed) {
    // Handle rate limit exceeded
}
```

### 2. Security Headers (`headers.js`)

#### SecurityHeaders Class
Comprehensive HTTP security headers management:

```javascript
const security = new SecurityHeaders({
    csp: {
        defaultSrc: ["'self'"],
        scriptSrc: ["'self'", "'unsafe-inline'"],
        styleSrc: ["'self'", "'unsafe-inline'"],
        imgSrc: ["'self'", "data:", "https:"]
    },
    hsts: {
        maxAge: 31536000,
        includeSubDomains: true,
        preload: true
    },
    frameOptions: 'DENY',
    referrerPolicy: 'strict-origin-when-cross-origin'
});

// Express.js middleware
app.use(security.middleware());

// Add nonce for inline scripts
app.use(security.addNonce);
```

#### SessionSecurity Class
Secure session management:

```javascript
const sessionSec = new SessionSecurity({
    cookie: {
        secure: true,
        httpOnly: true,
        maxAge: 1800000, // 30 minutes
        sameSite: 'strict'
    },
    regenerateOnLogin: true,
    maxSessions: 5
});

// Get session configuration
const sessionConfig = sessionSec.getSessionConfig();

// Validation middleware
app.use(sessionSec.validateSession());

// Initialize session security
sessionSec.initializeSession(req);
```

#### PasswordSecurity Class
Password strength validation and secure hashing:

```javascript
const passwordSec = new PasswordSecurity({
    minLength: 8,
    requireUppercase: true,
    requireLowercase: true,
    requireNumbers: true,
    requireSpecialChars: true
});

// Validate password strength
const validation = passwordSec.validatePassword(password);
if (!validation.isValid) {
    console.log(validation.errors);
}

// Hash password securely
const hash = await passwordSec.hashPassword(password);

// Verify password
const isValid = await passwordSec.verifyPassword(password, hash);
```

### 3. Security Audit (`audit.js`)

#### SecurityAuditor Class
Comprehensive security vulnerability scanner:

```javascript
const auditor = new SecurityAuditor({
    checkCSP: true,
    checkHeaders: true,
    checkCookies: true,
    checkInputs: true,
    checkHTTPS: true
});

// Run full security audit
const report = await auditor.runAudit();

console.log(`Security Score: ${report.score}/100`);
console.log(`Findings: ${report.totalFindings}`);
console.log(`High Priority: ${report.severityCounts.high}`);
```

#### SecurityPolicyChecker Class
Validate against security policies:

```javascript
const policyChecker = new SecurityPolicyChecker();

// Define security policy
policyChecker.addPolicy('production', {
    requireHTTPS: true,
    requireSecureHeaders: true,
    requiredHeaders: ['Strict-Transport-Security', 'Content-Security-Policy'],
    maxCookieAge: 3600000
});

// Check compliance
const results = policyChecker.checkPolicies();
```

## Usage Examples

### Basic Security Setup

```javascript
// Express.js application security setup
const express = require('express');
const session = require('express-session');
const { 
    SecurityHeaders, 
    CSRFProtection, 
    RateLimiter,
    SessionSecurity 
} = require('./security');

const app = express();

// Security headers
const security = new SecurityHeaders();
app.use(security.middleware());

// Rate limiting
const limiter = new RateLimiter({ maxRequests: 100, windowMs: 900000 });
app.use('/api/', limiter.middleware());

// Session security
const sessionSec = new SessionSecurity();
app.use(session(sessionSec.getSessionConfig()));
app.use(sessionSec.validateSession());

// CSRF protection
const csrf = new CSRFProtection();
app.use(csrf.middleware());
```

### Input Sanitization

```javascript
const { SecuritySanitizer } = require('./security');

// API endpoint with input sanitization
app.post('/api/comment', (req, res) => {
    const sanitizedComment = SecuritySanitizer.sanitizeHTML(req.body.comment, ['p', 'strong', 'em']);
    const sanitizedEmail = SecuritySanitizer.sanitizeEmail(req.body.email);
    
    if (!sanitizedEmail) {
        return res.status(400).json({ error: 'Invalid email format' });
    }
    
    // Save sanitized data
    saveComment({ comment: sanitizedComment, email: sanitizedEmail });
    res.json({ success: true });
});
```

### Password Security

```javascript
const { PasswordSecurity } = require('./security');

const passwordSec = new PasswordSecurity();

// Registration endpoint
app.post('/auth/register', async (req, res) => {
    const { password } = req.body;
    
    // Validate password strength
    const validation = passwordSec.validatePassword(password);
    if (!validation.isValid) {
        return res.status(400).json({ 
            error: 'Password does not meet requirements',
            details: validation.errors
        });
    }
    
    // Hash password
    const hashedPassword = await passwordSec.hashPassword(password);
    
    // Save user with hashed password
    await saveUser({ ...req.body, password: hashedPassword });
    res.json({ success: true });
});

// Login endpoint
app.post('/auth/login', async (req, res) => {
    const { email, password } = req.body;
    const user = await findUser(email);
    
    if (!user || !await passwordSec.verifyPassword(password, user.password)) {
        return res.status(401).json({ error: 'Invalid credentials' });
    }
    
    // Regenerate session on login
    sessionSec.regenerateSession(req, (err) => {
        if (err) return res.status(500).json({ error: 'Session error' });
        req.session.userId = user.id;
        res.json({ success: true });
    });
});
```

### Security Auditing

```javascript
// Client-side security audit
const { SecurityAuditor } = require('./security');

const auditor = new SecurityAuditor();

// Run audit on page load
document.addEventListener('DOMContentLoaded', async () => {
    const report = await auditor.runAudit();
    
    if (report.severityCounts.high > 0) {
        console.warn('High-priority security issues detected!');
    }
    
    // Send report to security team
    fetch('/api/security-report', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(report)
    });
});
```

### Content Security Policy

```html
<!-- HTML with CSP nonce support -->
<!DOCTYPE html>
<html>
<head>
    <script nonce="<%= nonce %>">
        // Inline script with nonce
        console.log('Secure inline script');
    </script>
</head>
<body>
    <form id="csrf-form" method="POST" action="/api/data">
        <input type="hidden" name="_csrf" value="<%= csrfToken %>">
        <input type="text" name="data" required>
        <button type="submit">Submit</button>
    </form>
    
    <script nonce="<%= nonce %>">
        // Add CSRF token to fetch requests
        const originalFetch = window.fetch;
        window.fetch = function(url, options = {}) {
            options.headers = options.headers || {};
            options.headers['X-CSRF-Token'] = '<%= csrfToken %>';
            return originalFetch(url, options);
        };
    </script>
</body>
</html>
```

## Security Best Practices

### Input Validation
1. Sanitize all user input on both client and server side
2. Use parameterized queries to prevent SQL injection
3. Implement proper XSS protection with HTML escaping
4. Validate file uploads and restrict file types

### Authentication & Sessions
1. Use strong password policies with complexity requirements
2. Implement secure session management with proper expiration
3. Use HTTPS for all authentication-related operations
4. Implement account lockout after failed attempts

### CSRF Protection
1. Use CSRF tokens for all state-changing operations
2. Validate tokens on server side for POST/PUT/DELETE requests
3. Use SameSite cookie attributes for additional protection
4. Implement double-submit cookie pattern for single-page applications

### Security Headers
1. Implement Content Security Policy to prevent XSS
2. Use HSTS to enforce HTTPS connections
3. Set appropriate frame options to prevent clickjacking
4. Configure referrer policy to control information leakage

### Rate Limiting
1. Implement rate limiting on authentication endpoints
2. Use different limits for different types of operations
3. Consider implementing progressive delays for repeated violations
4. Monitor and alert on rate limit violations

## Browser Support

- **Modern browsers**: Full feature support
- **IE11**: Basic functionality with polyfills
- **Node.js**: Server-side components fully supported
- **Crypto API**: Required for secure password hashing

## Integration

```javascript
// ES6 modules
import { SecuritySanitizer, CSRFProtection } from './security/index.js';

// CommonJS (Node.js)
const { SecurityHeaders, RateLimiter } = require('./security');

// Express.js integration
const securityMiddleware = require('./security/express-middleware');
app.use(securityMiddleware());
```

## Security Considerations

1. **Regular Updates**: Keep security policies and configurations updated
2. **Monitoring**: Implement logging and monitoring for security events
3. **Testing**: Regularly test security measures with penetration testing
4. **Training**: Ensure development team understands security best practices
5. **Compliance**: Ensure security measures meet relevant compliance requirements