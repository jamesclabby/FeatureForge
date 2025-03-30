'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.createTable('teamMembers', {
      id: {
        type: Sequelize.UUID,
        defaultValue: Sequelize.UUIDV4,
        primaryKey: true
      },
      userId: {
        type: Sequelize.UUID,
        allowNull: false,
        references: {
          model: 'users',
          key: 'id'
        },
        onUpdate: 'CASCADE',
        onDelete: 'CASCADE'
      },
      teamId: {
        type: Sequelize.UUID,
        allowNull: false,
        references: {
          model: 'teams',
          key: 'id'
        },
        onUpdate: 'CASCADE',
        onDelete: 'CASCADE'
      },
      role: {
        type: Sequelize.ENUM('admin', 'user', 'product-owner'),
        allowNull: false,
        defaultValue: 'user'
      },
      joinedAt: {
        type: Sequelize.DATE,
        allowNull: false,
        defaultValue: Sequelize.NOW
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

    // Add unique constraint to prevent duplicate memberships
    await queryInterface.addIndex('teamMembers', ['userId', 'teamId'], {
      unique: true
    });
  },

  down: async (queryInterface, Sequelize) => {
    await queryInterface.dropTable('teamMembers');
    await queryInterface.sequelize.query('DROP TYPE IF EXISTS enum_teamMembers_role;');
  }
}; 