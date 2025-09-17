const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const compression = require('compression');
const rateLimit = require('express-rate-limit');
const morgan = require('morgan');
require('dotenv').config();

// Import middleware
const { errorHandler, notFoundHandler } = require('./middleware/errorHandler');
const { requestLogger } = require('./middleware/logger');
const { validateRequest } = require('./middleware/validation');

// Import routes
const authRoutes = require('./routes/auth');
const userRoutes = require('./routes/users');
const apiRoutes = require('./routes/api');

class Server {
    constructor() {
        this.app = express();
        this.port = process.env.PORT || 3000;
        this.env = process.env.NODE_ENV || 'development';
        
        this.initializeMiddleware();
        this.initializeRoutes();
        this.initializeErrorHandling();
    }

    initializeMiddleware() {
        // Security middleware
        this.app.use(helmet({
            contentSecurityPolicy: {
                directives: {
                    defaultSrc: ["'self'"],
                    styleSrc: ["'self'", "'unsafe-inline'"],
                    scriptSrc: ["'self'"],
                    imgSrc: ["'self'", "data:", "https:"],
                },
            },
            crossOriginEmbedderPolicy: false
        }));

        // CORS configuration
        this.app.use(cors({
            origin: this.getAllowedOrigins(),
            credentials: true,
            methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
            allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With']
        }));

        // Rate limiting
        const limiter = rateLimit({
            windowMs: 15 * 60 * 1000, // 15 minutes
            max: this.env === 'production' ? 100 : 1000, // requests per windowMs
            message: {
                error: 'Too many requests from this IP',
                retryAfter: '15 minutes'
            },
            standardHeaders: true,
            legacyHeaders: false
        });
        this.app.use('/api/', limiter);

        // Body parsing middleware
        this.app.use(express.json({ limit: '10mb' }));
        this.app.use(express.urlencoded({ extended: true, limit: '10mb' }));

        // Compression
        this.app.use(compression());

        // Logging
        if (this.env === 'production') {
            this.app.use(morgan('combined'));
        } else {
            this.app.use(morgan('dev'));
        }
        this.app.use(requestLogger);

        // Health check endpoint
        this.app.get('/health', (req, res) => {
            res.status(200).json({
                status: 'OK',
                timestamp: new Date().toISOString(),
                uptime: process.uptime(),
                environment: this.env,
                version: process.env.npm_package_version || '1.0.0'
            });
        });

        // API documentation redirect
        this.app.get('/docs', (req, res) => {
            res.redirect('/api-docs');
        });
    }

    initializeRoutes() {
        // API routes
        this.app.use('/api/auth', authRoutes);
        this.app.use('/api/users', userRoutes);
        this.app.use('/api', apiRoutes);

        // Serve static files in production
        if (this.env === 'production') {
            this.app.use(express.static('public'));
            
            // Catch-all handler for SPA
            this.app.get('*', (req, res) => {
                res.sendFile(path.join(__dirname, 'public', 'index.html'));
            });
        }
    }

    initializeErrorHandling() {
        // 404 handler
        this.app.use(notFoundHandler);
        
        // Global error handler
        this.app.use(errorHandler);
    }

    getAllowedOrigins() {
        const origins = process.env.ALLOWED_ORIGINS || 'http://localhost:3000,http://localhost:8080';
        return origins.split(',').map(origin => origin.trim());
    }

    async start() {
        try {
            // Database connection would go here
            // await this.connectDatabase();
            
            this.server = this.app.listen(this.port, () => {
                console.log(`🚀 Server running on port ${this.port} in ${this.env} mode`);
                console.log(`📝 Health check: http://localhost:${this.port}/health`);
                
                if (this.env === 'development') {
                    console.log(`📚 API docs: http://localhost:${this.port}/docs`);
                }
            });

            // Graceful shutdown handling
            this.setupGracefulShutdown();
            
        } catch (error) {
            console.error('❌ Failed to start server:', error);
            process.exit(1);
        }
    }

    setupGracefulShutdown() {
        const gracefulShutdown = async (signal) => {
            console.log(`\n🛑 Received ${signal}, shutting down gracefully...`);
            
            if (this.server) {
                this.server.close(async () => {
                    console.log('✅ HTTP server closed');
                    
                    // Close database connections
                    // await this.closeDatabase();
                    
                    console.log('✅ Database connections closed');
                    console.log('👋 Server shutdown complete');
                    process.exit(0);
                });
            }
        };

        process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
        process.on('SIGINT', () => gracefulShutdown('SIGINT'));
    }

    // Database connection methods (implement based on your database)
    async connectDatabase() {
        // MongoDB example:
        // const mongoose = require('mongoose');
        // await mongoose.connect(process.env.MONGODB_URI);
        
        // PostgreSQL example:
        // const { Pool } = require('pg');
        // this.db = new Pool({ connectionString: process.env.DATABASE_URL });
        
        console.log('📊 Database connected');
    }

    async closeDatabase() {
        // Close database connections
        // await mongoose.connection.close();
        // await this.db.end();
    }
}

// Create and start server
const server = new Server();

// Start server if this file is run directly
if (require.main === module) {
    server.start();
}

module.exports = server;