const { Sequelize } = require('sequelize');
const dotenv = require('dotenv');
const path = require('path');

// Load environment variables with explicit path
dotenv.config({ path: path.resolve(__dirname, '../../.env') });

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
    console.log('Creating Sequelize instance with:');
    console.log('- Database:', process.env.DB_NAME);
    console.log('- User:', process.env.DB_USER);
    console.log('- Host:', process.env.DB_HOST);
    console.log('- Port:', process.env.DB_PORT);
    
    sequelize = new Sequelize(
      process.env.DB_NAME,
      process.env.DB_USER,
      process.env.DB_PASSWORD,
      {
        host: process.env.DB_HOST,
        port: process.env.DB_PORT,
        dialect: 'postgres',
        logging: process.env.NODE_ENV === 'development' ? console.log : false,
        pool: {
          max: 5,
          min: 0,
          acquire: 30000,
          idle: 10000
        }
      }
    );
  } else {
    console.warn('Missing required database environment variables:');
    if (!process.env.DB_NAME) console.warn('- DB_NAME is missing');
    if (!process.env.DB_USER) console.warn('- DB_USER is missing');
    if (!process.env.DB_PASSWORD) console.warn('- DB_PASSWORD is missing');
    if (!process.env.DB_HOST) console.warn('- DB_HOST is missing');
    if (!process.env.DB_PORT) console.warn('- DB_PORT is missing');
  }
} catch (error) {
  console.warn('Failed to initialize Sequelize:', error.message);
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
    console.warn(message);
    return null;
  }

  try {
    await sequelize.authenticate();
    console.log('PostgreSQL Connected via Sequelize');
    return sequelize;
  } catch (error) {
    if (required) {
      throw error;
    }
    console.warn('Unable to connect to the database:', error);
    return null;
  }
};

module.exports = {
  sequelize,
  connectPostgres
}; 