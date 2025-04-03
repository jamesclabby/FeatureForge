'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    // Create enum types
    await queryInterface.sequelize.query(`
      CREATE TYPE "enum_features_status" AS ENUM ('backlog', 'in_progress', 'review', 'done');
      CREATE TYPE "enum_features_priority" AS ENUM ('low', 'medium', 'high', 'urgent');
    `);
  },

  down: async (queryInterface, Sequelize) => {
    // Drop enum types
    await queryInterface.sequelize.query(`
      DROP TYPE IF EXISTS "enum_features_status";
      DROP TYPE IF EXISTS "enum_features_priority";
    `);
  }
}; 