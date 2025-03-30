const { Sequelize } = require('sequelize');
const config = require('../config/database');
const { exec } = require('child_process');
const util = require('util');
const execPromise = util.promisify(exec);

async function setupTestDb() {
  const { username, password, database, host, dialect } = config.test;
  
  // Create a temporary connection to postgres to create/drop the test database
  const tempConnection = new Sequelize('postgres', username, password, {
    host,
    dialect,
    logging: false
  });

  try {
    // Force close any existing connections to the test database
    await tempConnection.query(`
      SELECT pg_terminate_backend(pg_stat_activity.pid)
      FROM pg_stat_activity
      WHERE pg_stat_activity.datname = '${database}'
      AND pid <> pg_backend_pid();
    `);

    // Add a small delay to ensure connections are closed
    await new Promise(resolve => setTimeout(resolve, 1000));

    // Drop the test database if it exists and recreate it
    await tempConnection.query(`DROP DATABASE IF EXISTS ${database};`);
    await tempConnection.query(`CREATE DATABASE ${database};`);
    console.log(`Created test database: ${database}`);

    // Close temporary connection
    await tempConnection.close();

    // Run migrations on the test database
    const migrationCommand = 'npx sequelize-cli db:migrate --env test';
    await execPromise(migrationCommand);
    console.log('Migrations completed successfully');

    return true;
  } catch (error) {
    console.error('Error setting up test database:', error);
    throw error;
  }
}

// Run if called directly
if (require.main === module) {
  setupTestDb()
    .then(() => process.exit(0))
    .catch(err => {
      console.error(err);
      process.exit(1);
    });
}

module.exports = setupTestDb; 