const express = require("express");
const cors = require("cors");
const dotenv = require('dotenv');
const http = require("http");
const path = require('path');
const requestIp = require('request-ip');
const cookieParser = require('cookie-parser');
const logger = require('morgan');
const helmet = require('helmet');
const mongoSanitize = require('express-mongo-sanitize');
const rateLimit = require("express-rate-limit");

// Custom logger for file logging
const customLogger = require('./logger');

// File requirements
const userRoutes = require('./app/routes/sresu.routes.js');
const useragent = require('./app/config/useragent.js');

dotenv.config();
const app = express();

// Log application startup
customLogger.info('Starting Pet Finder Backend Application...');

// ------------------------
// Middleware
// ------------------------
app.use(cors({
  origin: ['http://localhost:4200', 'http://localhost:4200/'],
  credentials: true,
}));

app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      "scriptSrc": ["'self'", 'http://localhost:4200', 'http://localhost:4200/'],
      "defaultSrc": ["'self'", 'http://localhost:4200', 'http://localhost:4200/'],
      "styleSrc": ["'self'", 'http://localhost:4200', 'http://localhost:4200/'],
      "fontSrc": ["'self'", 'https', 'data'],
    },
  },
  crossOriginOpenerPolicy: { policy: "unsafe-none" },
  crossOriginResourcePolicy: { policy: "cross-origin" },
  crossOriginEmbedderPolicy: { policy: "require-corp" },
  referrerPolicy: { policy: "strict-origin-when-cross-origin" },
}));

// Morgan for console logging
app.use(logger('combined'));

// Custom logger middleware for file logging
app.use(customLogger.logRequest);

app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(cookieParser());
app.use(express.static(path.join(__dirname, 'public')));
app.use(mongoSanitize());

// User-agent restriction
app.use((req, res, next) => {
  const userAgent = req.get("User-Agent");
  if (useragent.useragent.includes(userAgent)) {
    customLogger.warn('Access denied for user-agent', { userAgent });
    return res.status(403).json({ status: false, message: "Access Denied" });
  }
  next();
});

// Custom headers
app.use((req, res, next) => {
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST');
  res.setHeader('Access-Control-Allow-Headers', 'Origin, Content-Type, X-Requested-With, Accept, connectioncontrol, post-signature, usertoken');
  res.setHeader('Permissions-Policy', 'geolocation=(self "http://localhost:4200/" "http://localhost:4200/")');
  next();
});

app.use(requestIp.mw());

const limiter = rateLimit({
  windowMs: 1 * 1000, // 1 second
  max: 45,
  keyGenerator: (req, res) => req.clientIp,
  handler: (req, res) => {
    customLogger.warn('Rate limit exceeded', { 
      ip: req.clientIp,
      url: req.originalUrl 
    });
    res.status(429).json({ 
      status: false, 
      message: "Too many requests, please try again later." 
    });
  }
});
app.use(limiter);

// ------------------------
// MongoDB Connection
// ------------------------
const mongoose = require('mongoose');
const mongoUri = process.env.MONGO_URI || 'mongodb://localhost:27017/petfinder';

customLogger.info('Connecting to MongoDB...', { uri: mongoUri.replace(/\/\/.*@/, '//***@') });

mongoose.connect(mongoUri, {
    useNewUrlParser: true,
    useUnifiedTopology: true,
})
.then(() => {
    console.log('Connected to MongoDB');
    customLogger.info('Successfully connected to MongoDB');
})
.catch(err => {
    console.error('Error connecting to MongoDB:', err);
    customLogger.error('MongoDB connection failed', { 
      error: err.message,
      stack: err.stack 
    });
    console.warn('Continuing without MongoDB. The container will stay alive.');
});

// Catch uncaught errors to prevent container exit
process.on('uncaughtException', (err) => {
    console.error('Uncaught Exception:', err);
    customLogger.error('Uncaught Exception', { 
      error: err.message,
      stack: err.stack 
    });
});

process.on('unhandledRejection', (err) => {
    console.error('Unhandled Rejection:', err);
    customLogger.error('Unhandled Rejection', { 
      error: err.message,
      stack: err.stack 
    });
});

// ------------------------
// Routes
// ------------------------
app.get("/", (req, res) => {
    res.json({ status: true, message: "Welcome to pet missing report management backend application." });
});

// Health check endpoint
app.get("/health", (req, res) => {
    const healthStatus = {
        status: 'healthy',
        timestamp: new Date().toISOString(),
        uptime: process.uptime(),
        mongodb: mongoose.connection.readyState === 1 ? 'connected' : 'disconnected',
        logFile: customLogger.getLogFile()
    };
    
    res.status(200).json(healthStatus);
});

// Test error endpoint (for testing log monitoring)
app.get("/api/test-error", (req, res) => {
    customLogger.error('Test error endpoint triggered - HTTP 500');
    res.status(500).json({ 
      status: false, 
      error: "This is a test error for monitoring purposes" 
    });
});

// Test exception endpoint (for testing log monitoring)
app.get("/api/test-exception", (req, res, next) => {
    const error = new Error('Test exception thrown for monitoring purposes');
    customLogger.error('Test exception triggered', { error: error.message });
    next(error);
});

app.use('/uploads', express.static(path.join(__dirname, '/app/routes/uploads')));
app.use('/v1/users', userRoutes);

// 404 handler - must be after all routes
app.use((req, res) => {
    customLogger.warn(`404 Not Found: ${req.method} ${req.originalUrl}`, {
        method: req.method,
        url: req.originalUrl,
        ip: req.clientIp || req.ip
    });
    res.status(404).json({ 
        status: false, 
        message: "Route not found" 
    });
});

// Global error handler - must be last
app.use(customLogger.errorHandler);

// ------------------------
// Start HTTP Server
// ------------------------
const PORT = process.env.PORT || 5000;
const server = http.createServer(app);

server.listen(PORT, () => {
    console.log(`HTTP Server running on port ${PORT}`);
    customLogger.info(`HTTP Server running on port ${PORT}`, {
        port: PORT,
        environment: process.env.NODE_ENV || 'development',
        nodeVersion: process.version,
        logFile: customLogger.getLogFile()
    });
});

// Graceful shutdown handlers
process.on('SIGTERM', () => {
    customLogger.info('SIGTERM signal received: closing HTTP server');
    server.close(() => {
        customLogger.info('HTTP server closed');
        mongoose.connection.close(false, () => {
            customLogger.info('MongoDB connection closed');
            process.exit(0);
        });
    });
});

process.on('SIGINT', () => {
    customLogger.info('SIGINT signal received: closing HTTP server');
    server.close(() => {
        customLogger.info('HTTP server closed');
        mongoose.connection.close(false, () => {
            customLogger.info('MongoDB connection closed');
            process.exit(0);
        });
    });
});

module.exports = app;
