'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    // Create a transaction for the migration
    const transaction = await queryInterface.sequelize.transaction();
    
    try {
      // Add the votes column if it doesn't exist
      await queryInterface.describeTable('features').then(tableInfo => {
        const columns = [];
        
        // Check and add votes column
        if (!tableInfo.votes) {
          columns.push(
            queryInterface.addColumn('features', 'votes', {
              type: Sequelize.INTEGER,
              defaultValue: 0,
              allowNull: false
            }, { transaction })
          );
        }
        
        // Check and add impact column
        if (!tableInfo.impact) {
          columns.push(
            queryInterface.addColumn('features', 'impact', {
              type: Sequelize.INTEGER,
              defaultValue: 5,
              allowNull: true
            }, { transaction })
          );
        }
        
        // Check and add effort column
        if (!tableInfo.effort) {
          columns.push(
            queryInterface.addColumn('features', 'effort', {
              type: Sequelize.INTEGER,
              defaultValue: 5,
              allowNull: true
            }, { transaction })
          );
        }
        
        // Check and add category column
        if (!tableInfo.category) {
          columns.push(
            queryInterface.addColumn('features', 'category', {
              type: Sequelize.STRING,
              allowNull: true
            }, { transaction })
          );
        }
        
        // Check and add targetRelease column
        if (!tableInfo.targetRelease) {
          columns.push(
            queryInterface.addColumn('features', 'targetRelease', {
              type: Sequelize.STRING,
              allowNull: true
            }, { transaction })
          );
        }
        
        return Promise.all(columns);
      }).catch(error => {
        console.error('Error describing table:', error);
        // If the table doesn't exist, create it with all required columns
        // This would be handled by the Feature model initialization
      });
      
      await transaction.commit();
      return Promise.resolve();
    } catch (error) {
      console.error('Migration error:', error);
      await transaction.rollback();
      return Promise.reject(error);
    }
  },

  down: async (queryInterface, Sequelize) => {
    const transaction = await queryInterface.sequelize.transaction();
    
    try {
      await Promise.all([
        queryInterface.removeColumn('features', 'votes', { transaction }),
        queryInterface.removeColumn('features', 'impact', { transaction }),
        queryInterface.removeColumn('features', 'effort', { transaction }),
        queryInterface.removeColumn('features', 'category', { transaction }),
        queryInterface.removeColumn('features', 'targetRelease', { transaction })
      ]);
      
      await transaction.commit();
      return Promise.resolve();
    } catch (error) {
      await transaction.rollback();
      return Promise.reject(error);
    }
  }
}; 