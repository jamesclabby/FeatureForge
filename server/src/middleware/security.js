const rateLimit = require('express-rate-limit');
const helmet = require('helmet');
const validator = require('validator');
const logger = require('../utils/logger');

/**
 * Rate limiting middleware
 */
const createRateLimiter = (windowMs, max, message) => {
  return rateLimit({
    windowMs,
    max,
    message: {
      success: false,
      error: message
    },
    standardHeaders: true,
    legacyHeaders: false,
    handler: (req, res) => {
      logger.warn(`Rate limit exceeded for IP: ${req.ip}, Path: ${req.path}`);
      res.status(429).json({
        success: false,
        error: message
      });
    }
  });
};

// Different rate limits for different endpoints
const authRateLimit = createRateLimiter(
  15 * 60 * 1000, // 15 minutes
  5, // 5 attempts
  'Too many authentication attempts, please try again later'
);

const apiRateLimit = createRateLimiter(
  15 * 60 * 1000, // 15 minutes
  100, // 100 requests
  'Too many requests, please try again later'
);

const generalRateLimit = createRateLimiter(
  15 * 60 * 1000, // 15 minutes
  1000, // 1000 requests
  'Too many requests, please try again later'
);

/**
 * Input sanitization middleware
 */
const sanitizeInput = (req, res, next) => {
  const sanitizeValue = (value) => {
    if (typeof value === 'string') {
      // Trim whitespace
      let sanitized = value.trim();
      
      // Remove potential XSS patterns but preserve normal punctuation
      // Remove script tags and dangerous HTML tags
      sanitized = sanitized.replace(/<script[^>]*>.*?<\/script>/gi, '');
      sanitized = sanitized.replace(/<iframe[^>]*>.*?<\/iframe>/gi, '');
      sanitized = sanitized.replace(/<object[^>]*>.*?<\/object>/gi, '');
      sanitized = sanitized.replace(/<embed[^>]*>.*?<\/embed>/gi, '');
      sanitized = sanitized.replace(/<form[^>]*>.*?<\/form>/gi, '');
      
      // Remove javascript: and data: URLs but keep normal URLs
      sanitized = sanitized.replace(/javascript\s*:/gi, '');
      sanitized = sanitized.replace(/data\s*:\s*text\/html/gi, '');
      
      // Remove on* event handlers
      sanitized = sanitized.replace(/\son\w+\s*=/gi, '');
      
      return sanitized;
    }
    if (typeof value === 'object' && value !== null) {
      for (const key in value) {
        value[key] = sanitizeValue(value[key]);
      }
    }
    return value;
  };

  if (req.body) {
    req.body = sanitizeValue(req.body);
  }
  if (req.query) {
    req.query = sanitizeValue(req.query);
  }
  if (req.params) {
    req.params = sanitizeValue(req.params);
  }

  next();
};

/**
 * Security headers middleware
 */
const securityHeaders = helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      styleSrc: ["'self'", "'unsafe-inline'"],
      scriptSrc: ["'self'"],
      imgSrc: ["'self'", "data:", "https:"],
      connectSrc: ["'self'"],
      fontSrc: ["'self'"],
      objectSrc: ["'none'"],
      mediaSrc: ["'self'"],
      frameSrc: ["'none'"],
    },
  },
  crossOriginEmbedderPolicy: false, // Disable for API compatibility
  crossOriginOpenerPolicy: false,
  crossOriginResourcePolicy: { policy: "cross-origin" }
});

/**
 * Request logging middleware
 */
const requestLogger = (req, res, next) => {
  const start = Date.now();
  
  res.on('finish', () => {
    const duration = Date.now() - start;
    const logLevel = res.statusCode >= 400 ? 'warn' : 'info';
    
    logger[logLevel](`${req.method} ${req.path} - ${res.statusCode} - ${duration}ms - ${req.ip}`);
  });
  
  next();
};

module.exports = {
  authRateLimit,
  apiRateLimit,
  generalRateLimit,
  sanitizeInput,
  securityHeaders,
  requestLogger
}; 