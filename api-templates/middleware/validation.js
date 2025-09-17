// Request Validation Middleware using Joi

const Joi = require('joi');
const { ValidationError } = require('./errorHandler');

// Common validation schemas
const commonSchemas = {
    id: Joi.string().pattern(/^[0-9a-fA-F]{24}$/).message('Invalid ID format'),
    email: Joi.string().email().lowercase().trim(),
    password: Joi.string().min(8).pattern(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]/)
        .message('Password must contain at least 8 characters with uppercase, lowercase, number and special character'),
    name: Joi.string().trim().min(2).max(50),
    phone: Joi.string().pattern(/^\+?[1-9]\d{1,14}$/).message('Invalid phone number'),
    url: Joi.string().uri(),
    pagination: Joi.object({
        page: Joi.number().integer().min(1).default(1),
        limit: Joi.number().integer().min(1).max(100).default(10),
        sort: Joi.string().default('createdAt'),
        order: Joi.string().valid('asc', 'desc').default('desc')
    })
};

// User validation schemas
const userSchemas = {
    register: Joi.object({
        name: commonSchemas.name.required(),
        email: commonSchemas.email.required(),
        password: commonSchemas.password.required(),
        confirmPassword: Joi.string().valid(Joi.ref('password')).required()
            .messages({ 'any.only': 'Passwords must match' }),
        terms: Joi.boolean().valid(true).required()
    }),

    login: Joi.object({
        email: commonSchemas.email.required(),
        password: Joi.string().required(),
        remember: Joi.boolean().default(false)
    }),

    forgotPassword: Joi.object({
        email: commonSchemas.email.required()
    }),

    resetPassword: Joi.object({
        token: Joi.string().required(),
        password: commonSchemas.password.required(),
        confirmPassword: Joi.string().valid(Joi.ref('password')).required()
    }),

    updateProfile: Joi.object({
        name: commonSchemas.name,
        email: commonSchemas.email,
        phone: commonSchemas.phone,
        bio: Joi.string().max(500),
        avatar: Joi.string().uri()
    }),

    changePassword: Joi.object({
        currentPassword: Joi.string().required(),
        newPassword: commonSchemas.password.required(),
        confirmPassword: Joi.string().valid(Joi.ref('newPassword')).required()
    })
};

// Generic validation schemas
const genericSchemas = {
    pagination: commonSchemas.pagination,
    
    search: Joi.object({
        q: Joi.string().trim().min(1).max(100),
        fields: Joi.array().items(Joi.string()).default([]),
        ...commonSchemas.pagination.keys()
    }),

    file: Joi.object({
        fieldname: Joi.string().required(),
        originalname: Joi.string().required(),
        encoding: Joi.string().required(),
        mimetype: Joi.string().required(),
        size: Joi.number().max(10 * 1024 * 1024), // 10MB max
        buffer: Joi.binary().required()
    }),

    bulkOperation: Joi.object({
        action: Joi.string().valid('create', 'update', 'delete').required(),
        ids: Joi.array().items(commonSchemas.id).min(1).when('action', {
            is: Joi.valid('update', 'delete'),
            then: Joi.required()
        }),
        data: Joi.object().when('action', {
            is: Joi.valid('create', 'update'),
            then: Joi.required()
        })
    })
};

// Validation middleware factory
const validate = (schema, source = 'body') => {
    return (req, res, next) => {
        const dataToValidate = req[source];
        
        const { error, value } = schema.validate(dataToValidate, {
            abortEarly: false, // Return all errors
            stripUnknown: true, // Remove unknown keys
            convert: true // Convert types (string to number, etc.)
        });

        if (error) {
            const errors = error.details.map(detail => ({
                field: detail.path.join('.'),
                message: detail.message,
                value: detail.context.value
            }));

            return next(new ValidationError('Validation failed', errors));
        }

        // Replace request data with validated data
        req[source] = value;
        next();
    };
};

// Multi-source validation
const validateMultiple = (validations) => {
    return async (req, res, next) => {
        const errors = [];

        for (const { schema, source } of validations) {
            const { error, value } = schema.validate(req[source], {
                abortEarly: false,
                stripUnknown: true,
                convert: true
            });

            if (error) {
                error.details.forEach(detail => {
                    errors.push({
                        source,
                        field: detail.path.join('.'),
                        message: detail.message,
                        value: detail.context.value
                    });
                });
            } else {
                req[source] = value;
            }
        }

        if (errors.length > 0) {
            return next(new ValidationError('Validation failed', errors));
        }

        next();
    };
};

// File upload validation
const validateFileUpload = (options = {}) => {
    const schema = Joi.object({
        mimetype: Joi.string().valid(...(options.allowedTypes || ['image/jpeg', 'image/png', 'image/gif'])),
        size: Joi.number().max(options.maxSize || 5 * 1024 * 1024) // 5MB default
    });

    return (req, res, next) => {
        if (!req.file && !req.files) {
            return next();
        }

        const files = req.files || [req.file];
        const errors = [];

        files.forEach((file, index) => {
            const { error } = schema.validate(file);
            if (error) {
                error.details.forEach(detail => {
                    errors.push({
                        file: index,
                        field: detail.path.join('.'),
                        message: detail.message
                    });
                });
            }
        });

        if (errors.length > 0) {
            return next(new ValidationError('File validation failed', errors));
        }

        next();
    };
};

// Dynamic schema validation for different routes
const createDynamicValidator = (schemaMap) => {
    return (req, res, next) => {
        const routeKey = `${req.method.toLowerCase()}_${req.route.path}`;
        const schema = schemaMap[routeKey];

        if (!schema) {
            return next(); // No validation defined for this route
        }

        return validate(schema)(req, res, next);
    };
};

// Sanitization helpers
const sanitizeInput = (input) => {
    if (typeof input === 'string') {
        return input
            .trim()
            .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '') // Remove script tags
            .replace(/javascript:/gi, '') // Remove javascript: protocols
            .replace(/on\w+="[^"]*"/gi, ''); // Remove event handlers
    }
    
    if (typeof input === 'object' && input !== null) {
        const sanitized = {};
        for (const [key, value] of Object.entries(input)) {
            sanitized[key] = sanitizeInput(value);
        }
        return sanitized;
    }
    
    return input;
};

// Request sanitization middleware
const sanitizeRequest = (req, res, next) => {
    req.body = sanitizeInput(req.body);
    req.query = sanitizeInput(req.query);
    req.params = sanitizeInput(req.params);
    next();
};

// Custom validation rules
const customValidations = {
    isUnique: (Model, field) => {
        return async (value, helpers) => {
            const existing = await Model.findOne({ [field]: value });
            if (existing) {
                return helpers.error('any.unique', { field });
            }
            return value;
        };
    },

    isExists: (Model, field = '_id') => {
        return async (value, helpers) => {
            const existing = await Model.findOne({ [field]: value });
            if (!existing) {
                return helpers.error('any.notExists', { field });
            }
            return value;
        };
    },

    strongPassword: (value, helpers) => {
        const score = calculatePasswordStrength(value);
        if (score < 3) {
            return helpers.error('password.weak');
        }
        return value;
    }
};

function calculatePasswordStrength(password) {
    let score = 0;
    if (password.length >= 8) score++;
    if (password.length >= 12) score++;
    if (/[a-z]/.test(password)) score++;
    if (/[A-Z]/.test(password)) score++;
    if (/[0-9]/.test(password)) score++;
    if (/[^A-Za-z0-9]/.test(password)) score++;
    return score;
}

// Export validation middleware and schemas
module.exports = {
    validate,
    validateMultiple,
    validateFileUpload,
    createDynamicValidator,
    sanitizeRequest,
    sanitizeInput,
    customValidations,
    
    // Schemas
    commonSchemas,
    userSchemas,
    genericSchemas,
    
    // Joi instance for custom schemas
    Joi
};