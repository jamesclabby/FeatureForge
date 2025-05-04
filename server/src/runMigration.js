const { sequelize } = require('./config/db');
const path = require('path');
const fs = require('fs');
const migration = require('./migrations/addNewColumnsToFeatures');

async function runMigration() {
  try {
    console.log('Running migration to add new columns to Features table...');
    await migration.up(sequelize.getQueryInterface(), sequelize.Sequelize);
    console.log('Migration completed successfully!');
    process.exit(0);
  } catch (error) {
    console.error('Migration failed:', error);
    process.exit(1);
  }
}

// Make sure the database is connected before running the migration
sequelize.authenticate()
  .then(() => {
    console.log('Database connection established');
    runMigration();
  })
  .catch(err => {
    console.error('Unable to connect to the database:', err);
    process.exit(1);
  }); 