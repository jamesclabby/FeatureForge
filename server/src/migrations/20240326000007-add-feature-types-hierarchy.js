'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    // Add the type column with default value 'task' for existing features
    await queryInterface.addColumn('features', 'type', {
      type: Sequelize.ENUM('parent', 'story', 'task', 'research'),
      allowNull: false,
      defaultValue: 'task'
    });

    // Add the parentId column for hierarchy
    await queryInterface.addColumn('features', 'parentId', {
      type: Sequelize.UUID,
      allowNull: true,
      references: {
        model: 'features',
        key: 'id'
      },
      onUpdate: 'CASCADE',
      onDelete: 'CASCADE'
    });

    // Add indexes for performance
    await queryInterface.addIndex('features', ['type']);
    await queryInterface.addIndex('features', ['parentId']);
    await queryInterface.addIndex('features', ['teamId', 'type']);
    await queryInterface.addIndex('features', ['teamId', 'parentId']);
  },

  down: async (queryInterface, Sequelize) => {
    // Remove indexes
    await queryInterface.removeIndex('features', ['teamId', 'parentId']);
    await queryInterface.removeIndex('features', ['teamId', 'type']);
    await queryInterface.removeIndex('features', ['parentId']);
    await queryInterface.removeIndex('features', ['type']);

    // Remove columns
    await queryInterface.removeColumn('features', 'parentId');
    await queryInterface.removeColumn('features', 'type');
  }
}; 