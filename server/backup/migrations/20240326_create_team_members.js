'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.createTable('team_members', {
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
        allowNull: false
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
    await queryInterface.addIndex('team_members', ['userId', 'teamId'], {
      unique: true
    });
  },

  down: async (queryInterface, Sequelize) => {
    await queryInterface.dropTable('team_members');
    await queryInterface.sequelize.query('DROP TYPE IF EXISTS enum_team_members_role;');
  }
}; 