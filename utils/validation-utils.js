// Validation Utilities
class ValidationUtils {
    // Basic validators
    static required(value) {
        return value !== null && value !== undefined && value !== '';
    }

    static email(value) {
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        return emailRegex.test(value);
    }

    static url(value) {
        try {
            new URL(value);
            return true;
        } catch {
            return false;
        }
    }

    static phone(value) {
        const phoneRegex = /^[\+]?[1-9][\d]{0,15}$/;
        return phoneRegex.test(value.replace(/[\s\-\(\)]/g, ''));
    }

    static minLength(value, min) {
        return value && value.length >= min;
    }

    static maxLength(value, max) {
        return value && value.length <= max;
    }

    static min(value, minimum) {
        return Number(value) >= minimum;
    }

    static max(value, maximum) {
        return Number(value) <= maximum;
    }

    static pattern(value, regex) {
        return regex.test(value);
    }

    static alphanumeric(value) {
        return /^[a-zA-Z0-9]+$/.test(value);
    }

    static numeric(value) {
        return /^\d+$/.test(value);
    }

    static alpha(value) {
        return /^[a-zA-Z]+$/.test(value);
    }

    // Password validators
    static password(value, options = {}) {
        const {
            minLength = 8,
            requireUppercase = true,
            requireLowercase = true,
            requireNumbers = true,
            requireSpecialChars = true
        } = options;

        const rules = [];

        if (value.length < minLength) {
            rules.push(`Must be at least ${minLength} characters long`);
        }

        if (requireUppercase && !/[A-Z]/.test(value)) {
            rules.push('Must contain at least one uppercase letter');
        }

        if (requireLowercase && !/[a-z]/.test(value)) {
            rules.push('Must contain at least one lowercase letter');
        }

        if (requireNumbers && !/\d/.test(value)) {
            rules.push('Must contain at least one number');
        }

        if (requireSpecialChars && !/[!@#$%^&*(),.?":{}|<>]/.test(value)) {
            rules.push('Must contain at least one special character');
        }

        return {
            valid: rules.length === 0,
            errors: rules
        };
    }

    // Credit card validation
    static creditCard(value) {
        const cleaned = value.replace(/\s/g, '');
        
        // Luhn algorithm
        let sum = 0;
        let shouldDouble = false;
        
        for (let i = cleaned.length - 1; i >= 0; i--) {
            let digit = parseInt(cleaned.charAt(i));
            
            if (shouldDouble) {
                digit *= 2;
                if (digit > 9) {
                    digit -= 9;
                }
            }
            
            sum += digit;
            shouldDouble = !shouldDouble;
        }
        
        return sum % 10 === 0;
    }

    // Date validators
    static dateRange(date, min, max) {
        const d = new Date(date);
        const minDate = new Date(min);
        const maxDate = new Date(max);
        return d >= minDate && d <= maxDate;
    }

    static isValidDate(date) {
        return date instanceof Date && !isNaN(date);
    }

    static age(birthDate, minAge, maxAge = 120) {
        const today = new Date();
        const birth = new Date(birthDate);
        const age = today.getFullYear() - birth.getFullYear();
        
        const monthDiff = today.getMonth() - birth.getMonth();
        if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birth.getDate())) {
            age--;
        }
        
        return age >= minAge && age <= maxAge;
    }

    // Form validation
    static validateForm(data, rules) {
        const errors = {};
        let isValid = true;

        Object.keys(rules).forEach(field => {
            const value = data[field];
            const fieldRules = Array.isArray(rules[field]) ? rules[field] : [rules[field]];
            const fieldErrors = [];

            fieldRules.forEach(rule => {
                if (typeof rule === 'function') {
                    const result = rule(value);
                    if (result !== true) {
                        fieldErrors.push(result || 'Invalid value');
                    }
                } else if (typeof rule === 'object') {
                    const { validator, message, ...params } = rule;
                    if (!this[validator](value, ...Object.values(params))) {
                        fieldErrors.push(message || 'Invalid value');
                    }
                }
            });

            if (fieldErrors.length > 0) {
                errors[field] = fieldErrors;
                isValid = false;
            }
        });

        return { isValid, errors };
    }

    // Sanitization helpers
    static sanitizeString(value) {
        return value.toString()
            .replace(/[<>]/g, '')
            .trim();
    }

    static sanitizeEmail(value) {
        return value.toString()
            .toLowerCase()
            .trim();
    }

    static sanitizePhone(value) {
        return value.toString()
            .replace(/[^\d\+]/g, '');
    }
}

// Predefined validation rules
ValidationUtils.rules = {
    required: (message = 'This field is required') => 
        (value) => ValidationUtils.required(value) || message,
    
    email: (message = 'Please enter a valid email') => 
        (value) => !value || ValidationUtils.email(value) || message,
    
    minLength: (min, message) => 
        (value) => !value || ValidationUtils.minLength(value, min) || 
        message || `Must be at least ${min} characters`,
    
    maxLength: (max, message) => 
        (value) => !value || ValidationUtils.maxLength(value, max) || 
        message || `Must be no more than ${max} characters`,
    
    pattern: (regex, message = 'Invalid format') => 
        (value) => !value || ValidationUtils.pattern(value, regex) || message
};

if (typeof module !== 'undefined' && module.exports) {
    module.exports = ValidationUtils;
}