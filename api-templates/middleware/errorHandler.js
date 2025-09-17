// Error Handling Middleware

class AppError extends Error {
    constructor(message, statusCode = 500, isOperational = true) {
        super(message);
        this.statusCode = statusCode;
        this.isOperational = isOperational;
        this.status = `${statusCode}`.startsWith('4') ? 'fail' : 'error';
        
        Error.captureStackTrace(this, this.constructor);
    }
}

class ValidationError extends AppError {
    constructor(message, errors = []) {
        super(message, 400);
        this.errors = errors;
        this.type = 'ValidationError';
    }
}

class AuthenticationError extends AppError {
    constructor(message = 'Authentication failed') {
        super(message, 401);
        this.type = 'AuthenticationError';
    }
}

class AuthorizationError extends AppError {
    constructor(message = 'Access denied') {
        super(message, 403);
        this.type = 'AuthorizationError';
    }
}

class NotFoundError extends AppError {
    constructor(message = 'Resource not found') {
        super(message, 404);
        this.type = 'NotFoundError';
    }
}

class ConflictError extends AppError {
    constructor(message = 'Resource conflict') {
        super(message, 409);
        this.type = 'ConflictError';
    }
}

class RateLimitError extends AppError {
    constructor(message = 'Too many requests') {
        super(message, 429);
        this.type = 'RateLimitError';
    }
}

// Global error handler middleware
const errorHandler = (err, req, res, next) => {
    let error = { ...err };
    error.message = err.message;

    // Log error
    console.error('Error:', {
        message: err.message,
        stack: err.stack,
        url: req.url,
        method: req.method,
        ip: req.ip,
        userAgent: req.get('User-Agent'),
        timestamp: new Date().toISOString()
    });

    // Handle specific error types
    if (err.name === 'ValidationError') {
        const message = 'Validation Error';
        const errors = Object.values(err.errors).map(val => ({
            field: val.path,
            message: val.message
        }));
        error = new ValidationError(message, errors);
    }

    if (err.name === 'CastError') {
        const message = 'Invalid ID format';
        error = new ValidationError(message);
    }

    if (err.code === 11000) {
        const field = Object.keys(err.keyValue)[0];
        const message = `${field} already exists`;
        error = new ConflictError(message);
    }

    if (err.name === 'JsonWebTokenError') {
        error = new AuthenticationError('Invalid token');
    }

    if (err.name === 'TokenExpiredError') {
        error = new AuthenticationError('Token expired');
    }

    if (err.name === 'MulterError') {
        if (err.code === 'LIMIT_FILE_SIZE') {
            error = new ValidationError('File too large');
        } else if (err.code === 'LIMIT_FILE_COUNT') {
            error = new ValidationError('Too many files');
        } else {
            error = new ValidationError('File upload error');
        }
    }

    // Default to 500 server error
    if (!error.isOperational) {
        error.statusCode = 500;
        error.message = 'Something went wrong';
    }

    res.status(error.statusCode || 500).json({
        success: false,
        error: {
            message: error.message,
            type: error.type || 'ServerError',
            ...(error.errors && { errors: error.errors }),
            ...(process.env.NODE_ENV === 'development' && { 
                stack: err.stack,
                details: err 
            })
        },
        timestamp: new Date().toISOString(),
        path: req.path,
        method: req.method
    });
};

// 404 handler
const notFoundHandler = (req, res, next) => {
    const error = new NotFoundError(`Route ${req.originalUrl} not found`);
    next(error);
};

// Async error wrapper
const asyncHandler = (fn) => {
    return (req, res, next) => {
        Promise.resolve(fn(req, res, next)).catch(next);
    };
};

// Rate limit error handler
const rateLimitHandler = (req, res) => {
    const error = new RateLimitError('Too many requests, please try again later');
    res.status(error.statusCode).json({
        success: false,
        error: {
            message: error.message,
            type: error.type,
            retryAfter: '15 minutes'
        },
        timestamp: new Date().toISOString()
    });
};

// Development error response
const sendErrorDev = (err, res) => {
    res.status(err.statusCode).json({
        success: false,
        error: {
            message: err.message,
            type: err.type,
            stack: err.stack,
            details: err
        },
        timestamp: new Date().toISOString()
    });
};

// Production error response
const sendErrorProd = (err, res) => {
    // Operational errors: send message to client
    if (err.isOperational) {
        res.status(err.statusCode).json({
            success: false,
            error: {
                message: err.message,
                type: err.type
            },
            timestamp: new Date().toISOString()
        });
    } else {
        // Programming errors: don't leak error details
        console.error('ERROR:', err);
        
        res.status(500).json({
            success: false,
            error: {
                message: 'Something went wrong',
                type: 'ServerError'
            },
            timestamp: new Date().toISOString()
        });
    }
};

// Centralized success response helper
const sendSuccess = (res, data = null, message = 'Success', statusCode = 200) => {
    const response = {
        success: true,
        message,
        timestamp: new Date().toISOString()
    };

    if (data !== null) {
        response.data = data;
    }

    res.status(statusCode).json(response);
};

// Paginated response helper
const sendPaginatedResponse = (res, data, totalCount, page, limit, message = 'Success') => {
    const totalPages = Math.ceil(totalCount / limit);
    const hasNextPage = page < totalPages;
    const hasPrevPage = page > 1;

    res.status(200).json({
        success: true,
        message,
        data,
        pagination: {
            totalCount,
            totalPages,
            currentPage: page,
            limit,
            hasNextPage,
            hasPrevPage,
            nextPage: hasNextPage ? page + 1 : null,
            prevPage: hasPrevPage ? page - 1 : null
        },
        timestamp: new Date().toISOString()
    });
};

module.exports = {
    AppError,
    ValidationError,
    AuthenticationError,
    AuthorizationError,
    NotFoundError,
    ConflictError,
    RateLimitError,
    errorHandler,
    notFoundHandler,
    asyncHandler,
    rateLimitHandler,
    sendErrorDev,
    sendErrorProd,
    sendSuccess,
    sendPaginatedResponse
};