const dotenv = require('dotenv');
const { connectPostgres } = require('../config/db');

// Load environment variables
dotenv.config();

/**
 * Check the database connection
 */
const checkDatabaseConnection = async () => {
  try {
    console.log('Checking database connection...');
    
    // Connect to PostgreSQL
    const sequelize = await connectPostgres();
    
    console.log('Database connection successful!');
    console.log('Database name:', sequelize.config.database);
    console.log('Database user:', sequelize.config.username);
    console.log('Database host:', sequelize.config.host);
    console.log('Database port:', sequelize.config.port);
    console.log('Database dialect:', sequelize.options.dialect);
    
    process.exit(0);
  } catch (error) {
    console.error('Error connecting to database:', error);
    process.exit(1);
  }
};

// Run the check
checkDatabaseConnection(); 