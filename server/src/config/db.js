const { Sequelize } = require('sequelize');
const logger = require('../utils/logger');

// Create Sequelize instance for PostgreSQL
let sequelize = null;

try {
  // Only create Sequelize instance if all required environment variables are present
  if (
    process.env.DB_NAME &&
    process.env.DB_USER &&
    process.env.DB_PASSWORD &&
    process.env.DB_HOST &&
    process.env.DB_PORT
  ) {
    logger.info('Creating Sequelize instance with database configuration');
    
    sequelize = new Sequelize(
      process.env.DB_NAME,
      process.env.DB_USER,
      process.env.DB_PASSWORD,
      {
        host: process.env.DB_HOST,
        port: process.env.DB_PORT,
        dialect: 'postgres',
        logging: process.env.NODE_ENV === 'development' ? 
          (msg) => logger.debug(msg) : false,
        pool: {
          max: parseInt(process.env.DB_POOL_MAX) || 20,
          min: parseInt(process.env.DB_POOL_MIN) || 0,
          acquire: parseInt(process.env.DB_POOL_ACQUIRE) || 60000,
          idle: parseInt(process.env.DB_POOL_IDLE) || 10000,
          evict: parseInt(process.env.DB_POOL_EVICT) || 1000
        },
        dialectOptions: {
          connectTimeout: 30000,
          idle_in_transaction_session_timeout: 30000,
          statement_timeout: 30000,
          ...(process.env.NODE_ENV === 'production' && {
            ssl: {
              require: true,
              rejectUnauthorized: false
            }
          })
        },
        retry: {
          match: [
            /ConnectionError/,
            /ConnectionRefusedError/,
            /ConnectionTimedOutError/,
            /TimeoutError/
          ],
          max: 3
        },
        benchmark: process.env.NODE_ENV === 'development'
      }
    );

    // Test the connection on startup
    sequelize.authenticate()
      .then(() => {
        logger.info(`Database connected: ${process.env.DB_NAME}@${process.env.DB_HOST}:${process.env.DB_PORT}`);
      })
      .catch(err => {
        logger.warn('Unable to connect to the database:', err.message);
      });
  } else {
    const missingVars = [];
    if (!process.env.DB_NAME) missingVars.push('DB_NAME');
    if (!process.env.DB_USER) missingVars.push('DB_USER');
    if (!process.env.DB_PASSWORD) missingVars.push('DB_PASSWORD');
    if (!process.env.DB_HOST) missingVars.push('DB_HOST');
    if (!process.env.DB_PORT) missingVars.push('DB_PORT');
    
    logger.warn(`Missing required database environment variables: ${missingVars.join(', ')}`);
  }
} catch (error) {
  logger.warn('Failed to initialize Sequelize:', error.message);
}

/**
 * Connect to PostgreSQL database using Sequelize
 * @param {boolean} required - Whether the connection is required (if true, will exit on failure)
 */
const connectPostgres = async (required = false) => {
  if (!sequelize) {
    const message = 'PostgreSQL connection not configured. Check your environment variables.';
    if (required) {
      throw new Error(message);
    }
    logger.warn(message);
    return null;
  }

  try {
    await sequelize.authenticate();
    logger.info('PostgreSQL connection verified');
    return sequelize;
  } catch (error) {
    if (required) {
      logger.error('Database connection failed (required):', error);
      throw error;
    }
    logger.warn('Unable to connect to the database:', error.message);
    return null;
  }
};

/**
 * Close database connection gracefully
 */
const closeConnection = async () => {
  if (sequelize) {
    try {
      await sequelize.close();
      logger.info('Database connection closed');
    } catch (error) {
      logger.error('Error closing database connection:', error);
    }
  }
};

// Graceful shutdown
process.on('SIGINT', async () => {
  logger.info('Received SIGINT, closing database connection...');
  await closeConnection();
  process.exit(0);
});

process.on('SIGTERM', async () => {
  logger.info('Received SIGTERM, closing database connection...');
  await closeConnection();
  process.exit(0);
});

module.exports = {
  sequelize,
  connectPostgres,
  closeConnection
}; 