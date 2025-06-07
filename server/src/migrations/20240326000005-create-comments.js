'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.createTable('comments', {
      id: {
        type: Sequelize.UUID,
        defaultValue: Sequelize.UUIDV4,
        primaryKey: true,
        allowNull: false
      },
      featureId: {
        type: Sequelize.UUID,
        allowNull: false,
        references: {
          model: 'features',
          key: 'id'
        },
        onUpdate: 'CASCADE',
        onDelete: 'CASCADE',
        comment: 'Feature this comment belongs to'
      },
      userId: {
        type: Sequelize.UUID,
        allowNull: false,
        references: {
          model: 'users',
          key: 'id'
        },
        onUpdate: 'CASCADE',
        onDelete: 'CASCADE',
        comment: 'User who wrote the comment'
      },
      content: {
        type: Sequelize.TEXT,
        allowNull: false,
        comment: 'Comment content with support for markdown and mentions'
      },
      parentId: {
        type: Sequelize.UUID,
        allowNull: true,
        references: {
          model: 'comments',
          key: 'id'
        },
        onUpdate: 'CASCADE',
        onDelete: 'CASCADE',
        comment: 'Parent comment ID for reply threading'
      },
      mentions: {
        type: Sequelize.JSONB,
        allowNull: true,
        defaultValue: '[]',
        comment: 'Array of mentioned users with their IDs and usernames'
      },
      isEdited: {
        type: Sequelize.BOOLEAN,
        defaultValue: false,
        comment: 'Whether this comment has been edited'
      },
      editedAt: {
        type: Sequelize.DATE,
        allowNull: true,
        comment: 'When the comment was last edited'
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

    // Add indexes for performance
    await queryInterface.addIndex('comments', ['featureId']);
    await queryInterface.addIndex('comments', ['userId']);
    await queryInterface.addIndex('comments', ['parentId']);
    await queryInterface.addIndex('comments', ['createdAt']);
  },

  down: async (queryInterface, Sequelize) => {
    await queryInterface.dropTable('comments');
  }
}; 