// logger.js - Enhanced Custom Logger Module for Pet Finder Backend
const fs = require('fs').promises;
const fsSync = require('fs');
const path = require('path');
const { EventEmitter } = require('events');

// Configuration
const LOG_DIR = process.env.LOG_DIR || path.join(__dirname, 'logs');
const LOG_FILE = process.env.LOG_FILE || path.join(LOG_DIR, 'petfinder.log');
const MAX_LOG_SIZE = parseInt(process.env.MAX_LOG_SIZE) || 10 * 1024 * 1024; // 10MB default
const MAX_LOG_FILES = parseInt(process.env.MAX_LOG_FILES) || 5; // Keep 5 rotated files
const LOG_LEVEL = process.env.LOG_LEVEL || 'INFO'; // ERROR, WARN, INFO, DEBUG

// Log levels with priorities
const LOG_LEVELS = {
    ERROR: 0,
    WARN: 1,
    INFO: 2,
    DEBUG: 3
};

const LEVEL_NAMES = {
    0: 'ERROR',
    1: 'WARN',
    2: 'INFO',
    3: 'DEBUG'
};

// Ensure log directory exists
async function ensureLogDirectory() {
    try {
        await fs.access(LOG_DIR);
    } catch {
        try {
            await fs.mkdir(LOG_DIR, { recursive: true });
            console.log(`Log directory created: ${LOG_DIR}`);
        } catch (err) {
            console.error(`Failed to create log directory: ${err.message}`);
            throw err;
        }
    }
}

// Format timestamp
function getTimestamp() {
    const now = new Date();
    const year = now.getFullYear();
    const month = String(now.getMonth() + 1).padStart(2, '0');
    const day = String(now.getDate()).padStart(2, '0');
    const hours = String(now.getHours()).padStart(2, '0');
    const minutes = String(now.getMinutes()).padStart(2, '0');
    const seconds = String(now.getSeconds()).padStart(2, '0');
    const milliseconds = String(now.getMilliseconds()).padStart(3, '0');

    return `${year}-${month}-${day} ${hours}:${minutes}:${seconds}.${milliseconds}`;
}

// Check if log level is enabled
function isLevelEnabled(level) {
    return LOG_LEVELS[level] <= LOG_LEVELS[LOG_LEVEL.toUpperCase()];
}

// Rotate log files if needed
async function rotateLogFile() {
    try {
        const stats = await fs.stat(LOG_FILE);
        if (stats.size >= MAX_LOG_SIZE) {
            // Rotate existing files
            for (let i = MAX_LOG_FILES - 1; i >= 1; i--) {
                const oldFile = `${LOG_FILE}.${i}`;
                const newFile = `${LOG_FILE}.${i + 1}`;
                try {
                    await fs.access(oldFile);
                    if (i === MAX_LOG_FILES - 1) {
                        await fs.unlink(oldFile); // Remove oldest
                    } else {
                        await fs.rename(oldFile, newFile);
                    }
                } catch {
                    // File doesn't exist, skip
                }
            }

            // Rename current log file
            await fs.rename(LOG_FILE, `${LOG_FILE}.1`);
        }
    } catch (err) {
        // Log file doesn't exist yet or other error, continue
    }
}

// Enhanced Logger Class
class Logger extends EventEmitter {
    constructor(options = {}) {
        super();
        this.logDir = options.logDir || LOG_DIR;
        this.logFile = options.logFile || LOG_FILE;
        this.maxLogSize = options.maxLogSize || MAX_LOG_SIZE;
        this.maxLogFiles = options.maxLogFiles || MAX_LOG_FILES;
        this.logLevel = options.logLevel || LOG_LEVEL;
        this.initialized = false;
    }

    async initialize() {
        if (this.initialized) return;

        try {
            await ensureLogDirectory();
            this.initialized = true;
            this.emit('initialized', { logFile: this.logFile, logDir: this.logDir });
        } catch (err) {
            console.error('Failed to initialize logger:', err.message);
            throw err;
        }
    }

    // Async write log to file
    async writeLog(level, message, meta = {}) {
        if (!isLevelEnabled(level)) return;

        try {
            await this.initialize();
            await rotateLogFile();

            const timestamp = getTimestamp();
            const metaStr = Object.keys(meta).length > 0 ? ` ${JSON.stringify(meta)}` : '';
            const logEntry = `[${timestamp}] ${level}: ${message}${metaStr}\n`;

            // Write to file asynchronously
            await fs.appendFile(this.logFile, logEntry, 'utf8');

            // Emit log event for monitoring
            this.emit('log', { level, message, meta, timestamp });

            // Also log to console for errors and warnings
            if (level === 'ERROR' || level === 'WARN') {
                console.log(logEntry.trim());
            }

        } catch (err) {
            console.error(`Failed to write to log file: ${err.message}`);
            this.emit('error', { operation: 'writeLog', error: err.message, level, message });

            // Fallback to console logging
            console.error(`[${getTimestamp()}] ${level}: ${message}`, meta);
        }
    }

    // Logging methods
    async error(message, meta) {
        await this.writeLog('ERROR', message, meta);
    }

    async warn(message, meta) {
        await this.writeLog('WARN', message, meta);
    }

    async info(message, meta) {
        await this.writeLog('INFO', message, meta);
    }

    async debug(message, meta) {
        await this.writeLog('DEBUG', message, meta);
    }

    // HTTP request logger middleware
    logRequest() {
        return async (req, res, next) => {
            const startTime = Date.now();

            // Store original end function
            const originalEnd = res.end;

            // Override res.end to capture response
            res.end = function(...args) {
                // Restore original end
                res.end = originalEnd;

                // Call original end
                res.end.apply(res, args);

                // Log after response is sent
                const duration = Date.now() - startTime;
                const logMessage = `${req.method} ${req.originalUrl} ${res.statusCode} ${duration}ms`;

                const meta = {
                    method: req.method,
                    url: req.originalUrl,
                    statusCode: res.statusCode,
                    duration: duration,
                    ip: req.clientIp || req.ip,
                    userAgent: req.get('User-Agent'),
                    timestamp: getTimestamp()
                };

                // Log based on status code
                if (res.statusCode >= 500) {
                    this.error(`HTTP ${res.statusCode} - ${logMessage}`, meta);
                } else if (res.statusCode >= 400) {
                    this.warn(`HTTP ${res.statusCode} - ${logMessage}`, meta);
                } else {
                    this.info(logMessage, meta);
                }
            }.bind(this);

            next();
        };
    }

    // Enhanced error handler middleware
    errorHandler() {
        return async (err, req, res, next) => {
            const meta = {
                error: err.message,
                stack: err.stack,
                url: req ? req.originalUrl : 'unknown',
                method: req ? req.method : 'unknown',
                ip: req ? (req.clientIp || req.ip) : 'unknown',
                userAgent: req ? req.get('User-Agent') : 'unknown',
                timestamp: getTimestamp()
            };

            await this.error(`Unhandled error: ${err.message}`, meta);

            // Emit error event
            this.emit('unhandledError', { error: err, meta });

            if (res && !res.headersSent) {
                res.status(err.status || 500).json({
                    status: false,
                    error: 'Internal Server Error',
                    message: process.env.NODE_ENV === 'development' ? err.message : 'Something went wrong'
                });
            }
        };
    }

    // Get current log file stats
    async getLogStats() {
        try {
            await this.initialize();
            const stats = await fs.stat(this.logFile);
            return {
                size: stats.size,
                modified: stats.mtime,
                path: this.logFile
            };
        } catch {
            return { size: 0, modified: null, path: this.logFile };
        }
    }

    // Get log file path
    getLogFile() {
        return this.logFile;
    }

    // Get log directory
    getLogDir() {
        return this.logDir;
    }

    // Set log level dynamically
    setLogLevel(level) {
        if (LOG_LEVELS[level.toUpperCase()] !== undefined) {
            this.logLevel = level.toUpperCase();
            this.emit('levelChanged', { newLevel: this.logLevel });
        }
    }

    // Get current log level
    getLogLevel() {
        return this.logLevel;
    }
}

// Create singleton instance for backward compatibility
const logger = new Logger();

// Initialize on module load
logger.initialize().catch(err => {
    console.error('Failed to initialize logger on module load:', err.message);
});

// Log initial setup info
logger.info('Logger initialized', {
    logFile: logger.getLogFile(),
    logDir: logger.getLogDir(),
    maxLogSize: MAX_LOG_SIZE,
    maxLogFiles: MAX_LOG_FILES,
    logLevel: LOG_LEVEL
});

// Export both class and instance for flexibility
module.exports = logger;
module.exports.Logger = Logger;
