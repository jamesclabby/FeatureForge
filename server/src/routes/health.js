const express = require('express');
const { sequelize } = require('../config/db');
const logger = require('../utils/logger');
const { isFirebaseInitialized } = require('../config/firebase');

const router = express.Router();

/**
 * @desc    Health check endpoint
 * @route   GET /api/health
 * @access  Public
 */
router.get('/', async (req, res) => {
  const healthCheck = {
    uptime: process.uptime(),
    message: 'OK',
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV || 'development',
    version: process.env.npm_package_version || '1.0.0'
  };

  try {
    // Check database connection
    if (sequelize) {
      await sequelize.authenticate();
      healthCheck.database = 'connected';
    } else {
      healthCheck.database = 'not configured';
    }

    // Check Firebase initialization status
    const firebaseStatus = isFirebaseInitialized() ? 'initialized' : 'not initialized';

    // Check memory usage
    const memoryUsage = process.memoryUsage();
    healthCheck.memory = {
      rss: `${Math.round(memoryUsage.rss / 1024 / 1024)} MB`,
      heapTotal: `${Math.round(memoryUsage.heapTotal / 1024 / 1024)} MB`,
      heapUsed: `${Math.round(memoryUsage.heapUsed / 1024 / 1024)} MB`,
      external: `${Math.round(memoryUsage.external / 1024 / 1024)} MB`
    };

    healthCheck.firebase = firebaseStatus;

    res.status(200).json({
      success: true,
      data: healthCheck
    });
  } catch (error) {
    logger.error('Health check failed:', error);
    healthCheck.database = 'error';
    healthCheck.error = error.message;
    
    res.status(503).json({
      success: false,
      data: healthCheck
    });
  }
});

// Debug endpoint for Firebase environment variables (without exposing sensitive data)
router.get('/firebase-debug', (req, res) => {
  try {
    const firebaseVars = {
      hasProjectId: !!process.env.FIREBASE_PROJECT_ID,
      hasClientEmail: !!process.env.FIREBASE_CLIENT_EMAIL,
      hasPrivateKey: !!process.env.FIREBASE_PRIVATE_KEY,
      projectIdValue: process.env.FIREBASE_PROJECT_ID || 'not set',
      clientEmailValue: process.env.FIREBASE_CLIENT_EMAIL || 'not set',
      privateKeyLength: process.env.FIREBASE_PRIVATE_KEY ? process.env.FIREBASE_PRIVATE_KEY.length : 0,
      privateKeyStart: process.env.FIREBASE_PRIVATE_KEY ? process.env.FIREBASE_PRIVATE_KEY.substring(0, 50) + '...' : 'not set',
      firebaseInitialized: isFirebaseInitialized()
    };

    res.json({
      success: true,
      data: firebaseVars
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: 'Firebase debug failed: ' + error.message
    });
  }
});

module.exports = router; 