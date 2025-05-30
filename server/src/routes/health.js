const express = require('express');
const { sequelize } = require('../config/db');
const logger = require('../utils/logger');

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

    // Check memory usage
    const memoryUsage = process.memoryUsage();
    healthCheck.memory = {
      rss: `${Math.round(memoryUsage.rss / 1024 / 1024)} MB`,
      heapTotal: `${Math.round(memoryUsage.heapTotal / 1024 / 1024)} MB`,
      heapUsed: `${Math.round(memoryUsage.heapUsed / 1024 / 1024)} MB`,
      external: `${Math.round(memoryUsage.external / 1024 / 1024)} MB`
    };

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

module.exports = router; 