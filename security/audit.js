// Security Audit and Vulnerability Scanner
class SecurityAuditor {
    constructor(options = {}) {
        this.options = {
            checkCSP: true,
            checkHeaders: true,
            checkCookies: true,
            checkInputs: true,
            checkHTTPS: true,
            checkDependencies: false, // Requires package.json analysis
            ...options
        };
        
        this.findings = [];
        this.score = 0;
        this.maxScore = 0;
    }

    // Run comprehensive security audit
    async runAudit() {
        this.findings = [];
        this.score = 0;
        this.maxScore = 0;
        
        if (this.options.checkHeaders) {
            await this.auditSecurityHeaders();
        }
        
        if (this.options.checkCSP) {
            await this.auditCSP();
        }
        
        if (this.options.checkCookies) {
            await this.auditCookies();
        }
        
        if (this.options.checkHTTPS) {
            await this.auditHTTPS();
        }
        
        if (this.options.checkInputs) {
            await this.auditInputValidation();
        }
        
        return this.generateReport();
    }

    // Audit security headers
    async auditSecurityHeaders() {
        const requiredHeaders = {
            'Strict-Transport-Security': {
                required: true,
                score: 15,
                check: (value) => value && value.includes('max-age=') && parseInt(value.match(/max-age=(\d+)/)?.[1] || 0) >= 31536000
            },
            'Content-Security-Policy': {
                required: true,
                score: 20,
                check: (value) => value && value.includes("default-src") && !value.includes("'unsafe-eval'")
            },
            'X-Frame-Options': {
                required: true,
                score: 10,
                check: (value) => value && (value === 'DENY' || value === 'SAMEORIGIN')
            },
            'X-Content-Type-Options': {
                required: true,
                score: 10,
                check: (value) => value === 'nosniff'
            },
            'Referrer-Policy': {
                required: true,
                score: 5,
                check: (value) => value && !value.includes('unsafe-url')
            },
            'Permissions-Policy': {
                required: false,
                score: 5,
                check: (value) => value && value.length > 0
            }
        };
        
        for (const [header, config] of Object.entries(requiredHeaders)) {
            this.maxScore += config.score;
            
            const headerValue = this.getResponseHeader(header);
            
            if (!headerValue && config.required) {
                this.addFinding('high', `Missing required security header: ${header}`, {
                    type: 'missing_header',
                    header: header
                });
            } else if (headerValue && !config.check(headerValue)) {
                this.addFinding('medium', `Insecure ${header} header configuration`, {
                    type: 'insecure_header',
                    header: header,
                    value: headerValue
                });
            } else if (headerValue) {
                this.score += config.score;
            }
        }
        
        // Check for dangerous headers
        const dangerousHeaders = ['Server', 'X-Powered-By', 'X-AspNet-Version'];
        dangerousHeaders.forEach(header => {
            const value = this.getResponseHeader(header);
            if (value) {
                this.addFinding('low', `Information disclosure header present: ${header}`, {
                    type: 'info_disclosure',
                    header: header,
                    value: value
                });
            }
        });
    }

    // Audit Content Security Policy
    async auditCSP() {
        const csp = this.getResponseHeader('Content-Security-Policy');
        if (!csp) return;
        
        const directives = this.parseCSP(csp);
        
        // Check for unsafe directives
        const unsafePatterns = {
            'unsafe-inline': 'high',
            'unsafe-eval': 'high',
            'data:': 'medium',
            '*': 'medium',
            'http:': 'medium'
        };
        
        for (const [directive, sources] of Object.entries(directives)) {
            for (const source of sources) {
                for (const [pattern, severity] of Object.entries(unsafePatterns)) {
                    if (source.includes(pattern)) {
                        this.addFinding(severity, `Unsafe CSP source in ${directive}: ${source}`, {
                            type: 'unsafe_csp',
                            directive: directive,
                            source: source
                        });
                    }
                }
            }
        }
        
        // Check for missing important directives
        const importantDirectives = ['default-src', 'script-src', 'object-src', 'base-uri'];
        importantDirectives.forEach(directive => {
            if (!directives[directive]) {
                this.addFinding('medium', `Missing important CSP directive: ${directive}`, {
                    type: 'missing_csp_directive',
                    directive: directive
                });
            }
        });
    }

    // Audit cookie security
    async auditCookies() {
        const cookies = this.getAllCookies();
        
        cookies.forEach(cookie => {
            const issues = [];
            
            if (!cookie.secure && window.location.protocol === 'https:') {
                issues.push('Missing Secure flag');
            }
            
            if (!cookie.httpOnly && cookie.name.toLowerCase().includes('session')) {
                issues.push('Missing HttpOnly flag for session cookie');
            }
            
            if (!cookie.sameSite || cookie.sameSite === 'none') {
                issues.push('Missing or insecure SameSite attribute');
            }
            
            if (issues.length > 0) {
                this.addFinding('medium', `Insecure cookie configuration: ${cookie.name}`, {
                    type: 'insecure_cookie',
                    cookie: cookie.name,
                    issues: issues
                });
            }
        });
    }

    // Audit HTTPS configuration
    async auditHTTPS() {
        if (window.location.protocol !== 'https:') {
            this.addFinding('high', 'Site not served over HTTPS', {
                type: 'no_https'
            });
            return;
        }
        
        // Check for mixed content
        const resources = performance.getEntriesByType('resource');
        const httpResources = resources.filter(resource => 
            resource.name.startsWith('http://') && 
            !resource.name.startsWith('http://localhost')
        );
        
        if (httpResources.length > 0) {
            this.addFinding('high', 'Mixed content detected - HTTP resources on HTTPS page', {
                type: 'mixed_content',
                resources: httpResources.map(r => r.name)
            });
        }
    }

    // Audit input validation
    async auditInputValidation() {
        const forms = document.querySelectorAll('form');
        
        forms.forEach((form, index) => {
            const inputs = form.querySelectorAll('input, textarea, select');
            
            inputs.forEach(input => {
                const issues = [];
                
                // Check for missing validation attributes
                if (input.type === 'email' && !input.pattern && !input.required) {
                    issues.push('Email input without validation');
                }
                
                if (input.type === 'password' && !input.minLength) {
                    issues.push('Password input without minimum length');
                }
                
                if (input.type === 'text' && !input.maxLength) {
                    issues.push('Text input without maximum length limit');
                }
                
                // Check for autocomplete issues
                if (input.type === 'password' && input.autocomplete !== 'off' && input.autocomplete !== 'new-password') {
                    issues.push('Password input with insecure autocomplete');
                }
                
                if (issues.length > 0) {
                    this.addFinding('low', `Input validation issues in form ${index + 1}`, {
                        type: 'input_validation',
                        form: index + 1,
                        input: input.name || input.id || 'unnamed',
                        issues: issues
                    });
                }
            });
            
            // Check for CSRF protection
            const csrfToken = form.querySelector('input[name="_csrf"], input[name="csrf_token"]');
            if (!csrfToken && ['POST', 'PUT', 'DELETE'].includes(form.method.toUpperCase())) {
                this.addFinding('high', `Form ${index + 1} missing CSRF protection`, {
                    type: 'missing_csrf',
                    form: index + 1
                });
            }
        });
    }

    // Vulnerability scanner for common issues
    scanVulnerabilities() {
        const vulnerabilities = [];
        
        // Check for DOM XSS vulnerabilities
        if (this.checkDOMXSS()) {
            vulnerabilities.push({
                type: 'dom_xss',
                severity: 'high',
                description: 'Potential DOM-based XSS vulnerability detected'
            });
        }
        
        // Check for client-side SQL injection
        if (this.checkClientSideSQL()) {
            vulnerabilities.push({
                type: 'client_sql',
                severity: 'medium',
                description: 'Client-side SQL-like operations detected'
            });
        }
        
        // Check for insecure localStorage usage
        if (this.checkInsecureStorage()) {
            vulnerabilities.push({
                type: 'insecure_storage',
                severity: 'medium',
                description: 'Sensitive data stored in localStorage'
            });
        }
        
        return vulnerabilities;
    }

    // Check for DOM XSS patterns
    checkDOMXSS() {
        const dangerousFunctions = [
            'innerHTML', 'outerHTML', 'insertAdjacentHTML',
            'document.write', 'document.writeln'
        ];
        
        // This is a simplified check - in practice, you'd analyze the source code
        return dangerousFunctions.some(func => {
            try {
                return window[func] !== undefined || document[func] !== undefined;
            } catch (e) {
                return false;
            }
        });
    }

    // Check for client-side SQL operations
    checkClientSideSQL() {
        // Check for SQL-like strings in localStorage/sessionStorage
        try {
            for (let i = 0; i < localStorage.length; i++) {
                const key = localStorage.key(i);
                const value = localStorage.getItem(key);
                if (value && /\b(SELECT|INSERT|UPDATE|DELETE|DROP)\b/i.test(value)) {
                    return true;
                }
            }
        } catch (e) {
            // Storage not available
        }
        
        return false;
    }

    // Check for insecure storage
    checkInsecureStorage() {
        const sensitivePatterns = [
            /password/i, /token/i, /secret/i, /key/i, /auth/i
        ];
        
        try {
            for (let i = 0; i < localStorage.length; i++) {
                const key = localStorage.key(i);
                if (sensitivePatterns.some(pattern => pattern.test(key))) {
                    return true;
                }
            }
        } catch (e) {
            // Storage not available
        }
        
        return false;
    }

    // Add security finding
    addFinding(severity, message, details = {}) {
        this.findings.push({
            severity: severity,
            message: message,
            details: details,
            timestamp: new Date().toISOString()
        });
    }

    // Generate audit report
    generateReport() {
        const severityCounts = {
            high: this.findings.filter(f => f.severity === 'high').length,
            medium: this.findings.filter(f => f.severity === 'medium').length,
            low: this.findings.filter(f => f.severity === 'low').length
        };
        
        const vulnerabilities = this.scanVulnerabilities();
        
        return {
            timestamp: new Date().toISOString(),
            score: this.maxScore > 0 ? Math.round((this.score / this.maxScore) * 100) : 0,
            maxScore: this.maxScore,
            actualScore: this.score,
            severityCounts: severityCounts,
            totalFindings: this.findings.length,
            findings: this.findings,
            vulnerabilities: vulnerabilities,
            recommendations: this.generateRecommendations()
        };
    }

    // Generate security recommendations
    generateRecommendations() {
        const recommendations = [];
        
        // Based on findings
        const highFindings = this.findings.filter(f => f.severity === 'high');
        if (highFindings.length > 0) {
            recommendations.push('Address all high-severity security issues immediately');
        }
        
        const headerFindings = this.findings.filter(f => f.details.type === 'missing_header');
        if (headerFindings.length > 0) {
            recommendations.push('Implement missing security headers');
        }
        
        const cspFindings = this.findings.filter(f => f.details.type === 'unsafe_csp');
        if (cspFindings.length > 0) {
            recommendations.push('Review and tighten Content Security Policy');
        }
        
        const cookieFindings = this.findings.filter(f => f.details.type === 'insecure_cookie');
        if (cookieFindings.length > 0) {
            recommendations.push('Configure secure cookie attributes');
        }
        
        if (this.score < this.maxScore * 0.8) {
            recommendations.push('Security score is below 80% - review all findings');
        }
        
        return recommendations;
    }

    // Helper methods
    getResponseHeader(name) {
        // In a real implementation, this would check actual response headers
        // For this template, we'll simulate based on current page
        const meta = document.querySelector(`meta[http-equiv="${name}"]`);
        return meta ? meta.content : null;
    }

    parseCSP(csp) {
        const directives = {};
        const parts = csp.split(';');
        
        parts.forEach(part => {
            const trimmed = part.trim();
            const spaceIndex = trimmed.indexOf(' ');
            if (spaceIndex > 0) {
                const directive = trimmed.substring(0, spaceIndex);
                const sources = trimmed.substring(spaceIndex + 1).split(' ').filter(s => s.length > 0);
                directives[directive] = sources;
            }
        });
        
        return directives;
    }

    getAllCookies() {
        const cookies = [];
        const cookieString = document.cookie;
        
        if (!cookieString) return cookies;
        
        const pairs = cookieString.split(';');
        pairs.forEach(pair => {
            const [name, value] = pair.trim().split('=');
            if (name) {
                cookies.push({
                    name: name,
                    value: value || '',
                    secure: false, // Can't detect from document.cookie
                    httpOnly: false, // Can't detect from document.cookie
                    sameSite: null // Can't detect from document.cookie
                });
            }
        });
        
        return cookies;
    }
}

// Security Policy Checker
class SecurityPolicyChecker {
    constructor() {
        this.policies = new Map();
    }

    // Define security policies
    addPolicy(name, policy) {
        this.policies.set(name, policy);
    }

    // Check if current configuration meets policies
    checkPolicies() {
        const results = [];
        
        for (const [name, policy] of this.policies) {
            const result = this.checkPolicy(name, policy);
            results.push(result);
        }
        
        return results;
    }

    checkPolicy(name, policy) {
        const violations = [];
        
        if (policy.requireHTTPS && window.location.protocol !== 'https:') {
            violations.push('HTTPS is required');
        }
        
        if (policy.requireSecureHeaders) {
            const requiredHeaders = policy.requiredHeaders || [];
            requiredHeaders.forEach(header => {
                if (!this.hasSecureHeader(header)) {
                    violations.push(`Missing required header: ${header}`);
                }
            });
        }
        
        if (policy.maxCookieAge) {
            // Check cookie age policy
            // Implementation would depend on cookie analysis
        }
        
        return {
            policy: name,
            compliant: violations.length === 0,
            violations: violations
        };
    }

    hasSecureHeader(header) {
        // Check for meta tag or actual header
        const meta = document.querySelector(`meta[http-equiv="${header}"]`);
        return meta !== null;
    }
}

if (typeof module !== 'undefined' && module.exports) {
    module.exports = {
        SecurityAuditor,
        SecurityPolicyChecker
    };
}