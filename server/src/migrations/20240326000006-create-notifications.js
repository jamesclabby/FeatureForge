'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    // First create the enum types
    await queryInterface.sequelize.query(`
      CREATE TYPE "enum_notifications_type" AS ENUM ('mention', 'reply', 'feature_update');
      CREATE TYPE "enum_notifications_relatedType" AS ENUM ('comment', 'feature');
    `);

    await queryInterface.createTable('notifications', {
      id: {
        type: Sequelize.UUID,
        defaultValue: Sequelize.UUIDV4,
        primaryKey: true,
        allowNull: false
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
        comment: 'User who receives this notification'
      },
      type: {
        type: Sequelize.ENUM('mention', 'reply', 'feature_update'),
        allowNull: false,
        comment: 'Type of notification'
      },
      relatedId: {
        type: Sequelize.UUID,
        allowNull: false,
        comment: 'ID of the related entity (commentId, featureId, etc.)'
      },
      relatedType: {
        type: Sequelize.ENUM('comment', 'feature'),
        allowNull: false,
        comment: 'Type of the related entity'
      },
      message: {
        type: Sequelize.TEXT,
        allowNull: false,
        comment: 'Human-readable notification message'
      },
      isRead: {
        type: Sequelize.BOOLEAN,
        defaultValue: false,
        comment: 'Whether the notification has been read'
      },
      triggeredBy: {
        type: Sequelize.UUID,
        allowNull: false,
        references: {
          model: 'users',
          key: 'id'
        },
        onUpdate: 'CASCADE',
        onDelete: 'CASCADE',
        comment: 'User who triggered this notification'
      },
      metadata: {
        type: Sequelize.JSONB,
        allowNull: true,
        defaultValue: '{}',
        comment: 'Additional context data for the notification'
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
    await queryInterface.addIndex('notifications', ['userId']);
    await queryInterface.addIndex('notifications', ['isRead']);
    await queryInterface.addIndex('notifications', ['type']);
    await queryInterface.addIndex('notifications', ['createdAt']);
    await queryInterface.addIndex('notifications', ['triggeredBy']);
  },

  down: async (queryInterface, Sequelize) => {
    await queryInterface.dropTable('notifications');
    // Drop enum types
    await queryInterface.sequelize.query(`
      DROP TYPE IF EXISTS "enum_notifications_type";
      DROP TYPE IF EXISTS "enum_notifications_relatedType";
    `);
  }
}; 