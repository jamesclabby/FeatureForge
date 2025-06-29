const winston = require('winston');

// Define log format
const logFormat = winston.format.combine(
  winston.format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
  winston.format.errors({ stack: true }),
  winston.format.printf(({ timestamp, level, message, stack }) => {
    return `${timestamp} [${level.toUpperCase()}]: ${stack || message}`;
  })
);

// Create serverless-friendly logger instance
const logger = winston.createLogger({
  level: process.env.LOG_LEVEL || 'info',
  format: logFormat,
  transports: [
    // Console transport - works in all environments including serverless
    new winston.transports.Console({
      format: winston.format.combine(
        winston.format.colorize(),
        logFormat
      )
    })
  ]
});

// In serverless environments, we only use console logging
// File logging is not available in serverless functions like Vercel
if (process.env.NODE_ENV === 'development') {
  // Only add file transports in development if we can write to filesystem
  try {
    const fs = require('fs');
    const path = require('path');
    
    // Create logs directory if it doesn't exist (only in development)
    const logsDir = path.join(process.cwd(), 'logs');
    if (!fs.existsSync(logsDir)) {
      fs.mkdirSync(logsDir, { recursive: true });
    }
    
    // Add file transports only in development
    logger.add(new winston.transports.File({
      filename: 'logs/error.log',
      level: 'error'
    }));
    
    logger.add(new winston.transports.File({
      filename: 'logs/combined.log'
    }));
  } catch (error) {
    // If file system operations fail, just use console logging
    console.warn('File logging not available, using console only:', error.message);
  }
}

module.exports = logger; 