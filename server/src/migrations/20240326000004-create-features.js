'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.createTable('features', {
      id: {
        type: Sequelize.UUID,
        defaultValue: Sequelize.UUIDV4,
        primaryKey: true,
        allowNull: false
      },
      title: {
        type: Sequelize.STRING,
        allowNull: false,
        comment: 'Feature title'
      },
      description: {
        type: Sequelize.TEXT,
        allowNull: true,
        comment: 'Detailed description of the feature'
      },
      status: {
        type: Sequelize.ENUM('backlog', 'in_progress', 'review', 'done'),
        allowNull: false,
        defaultValue: 'backlog',
        comment: 'Current status of the feature'
      },
      priority: {
        type: Sequelize.ENUM('low', 'medium', 'high', 'urgent'),
        allowNull: false,
        defaultValue: 'medium',
        comment: 'Feature priority level'
      },
      estimatedEffort: {
        type: Sequelize.INTEGER,
        allowNull: true,
        comment: 'Estimated effort in story points or hours'
      },
      dueDate: {
        type: Sequelize.DATE,
        allowNull: true,
        comment: 'Expected completion date'
      },
      assignedTo: {
        type: Sequelize.UUID,
        allowNull: true,
        references: {
          model: 'users',
          key: 'id'
        },
        comment: 'User assigned to implement the feature'
      },
      tags: {
        type: Sequelize.JSONB,
        allowNull: true,
        defaultValue: [],
        comment: 'Array of tags for categorizing features'
      },
      attachments: {
        type: Sequelize.JSONB,
        allowNull: true,
        defaultValue: [],
        comment: 'Array of attachment metadata'
      },
      comments: {
        type: Sequelize.JSONB,
        allowNull: true,
        defaultValue: [],
        comment: 'Array of comments on the feature'
      },
      createdBy: {
        type: Sequelize.UUID,
        allowNull: false,
        references: {
          model: 'users',
          key: 'id'
        },
        comment: 'User who created the feature'
      },
      createdByEmail: {
        type: Sequelize.STRING,
        allowNull: false,
        comment: 'Email of the user who created the feature'
      },
      teamId: {
        type: Sequelize.UUID,
        allowNull: false,
        references: {
          model: 'teams',
          key: 'id'
        },
        onDelete: 'CASCADE',
        comment: 'Team that owns this feature'
      },
      createdAt: {
        type: Sequelize.DATE,
        allowNull: false
      },
      updatedAt: {
        type: Sequelize.DATE,
        allowNull: false
      }
    });

    // Add indexes
    await queryInterface.addIndex('features', ['teamId']);
    await queryInterface.addIndex('features', ['createdBy']);
    await queryInterface.addIndex('features', ['assignedTo']);
  },

  down: async (queryInterface, Sequelize) => {
    await queryInterface.dropTable('features');
  }
}; 