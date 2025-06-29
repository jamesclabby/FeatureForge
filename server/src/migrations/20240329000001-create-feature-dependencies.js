'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    // First create the enum type for dependency types
    await queryInterface.sequelize.query(`
      CREATE TYPE "enum_feature_dependencies_type" AS ENUM ('blocks', 'blocked_by', 'depends_on', 'relates_to');
    `);

    await queryInterface.createTable('feature_dependencies', {
      id: {
        type: Sequelize.UUID,
        defaultValue: Sequelize.UUIDV4,
        primaryKey: true,
        allowNull: false
      },
      sourceFeatureId: {
        type: Sequelize.UUID,
        allowNull: false,
        references: {
          model: 'features',
          key: 'id'
        },
        onUpdate: 'CASCADE',
        onDelete: 'CASCADE',
        comment: 'Feature that has the dependency relationship'
      },
      targetFeatureId: {
        type: Sequelize.UUID,
        allowNull: false,
        references: {
          model: 'features',
          key: 'id'
        },
        onUpdate: 'CASCADE',
        onDelete: 'CASCADE',
        comment: 'Feature that is the target of the dependency'
      },
      dependencyType: {
        type: Sequelize.ENUM('blocks', 'blocked_by', 'depends_on', 'relates_to'),
        allowNull: false,
        comment: 'Type of dependency relationship'
      },
      createdBy: {
        type: Sequelize.UUID,
        allowNull: false,
        references: {
          model: 'users',
          key: 'id'
        },
        onUpdate: 'CASCADE',
        onDelete: 'CASCADE',
        comment: 'User who created this dependency'
      },
      description: {
        type: Sequelize.TEXT,
        allowNull: true,
        comment: 'Optional description of the dependency relationship'
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

    // Add constraints to prevent self-references and ensure unique relationships
    await queryInterface.addConstraint('feature_dependencies', {
      fields: ['sourceFeatureId'],
      type: 'check',
      name: 'no_self_reference',
      where: {
        sourceFeatureId: {
          [Sequelize.Op.ne]: Sequelize.col('targetFeatureId')
        }
      }
    });

    // Add unique constraint to prevent duplicate relationships
    await queryInterface.addConstraint('feature_dependencies', {
      fields: ['sourceFeatureId', 'targetFeatureId', 'dependencyType'],
      type: 'unique',
      name: 'unique_dependency_relationship'
    });

    // Add indexes for performance
    await queryInterface.addIndex('feature_dependencies', ['sourceFeatureId']);
    await queryInterface.addIndex('feature_dependencies', ['targetFeatureId']);
    await queryInterface.addIndex('feature_dependencies', ['dependencyType']);
    await queryInterface.addIndex('feature_dependencies', ['createdBy']);
    await queryInterface.addIndex('feature_dependencies', ['sourceFeatureId', 'dependencyType']);
    await queryInterface.addIndex('feature_dependencies', ['targetFeatureId', 'dependencyType']);
  },

  down: async (queryInterface, Sequelize) => {
    // Remove indexes
    await queryInterface.removeIndex('feature_dependencies', ['targetFeatureId', 'dependencyType']);
    await queryInterface.removeIndex('feature_dependencies', ['sourceFeatureId', 'dependencyType']);
    await queryInterface.removeIndex('feature_dependencies', ['createdBy']);
    await queryInterface.removeIndex('feature_dependencies', ['dependencyType']);
    await queryInterface.removeIndex('feature_dependencies', ['targetFeatureId']);
    await queryInterface.removeIndex('feature_dependencies', ['sourceFeatureId']);

    // Drop the table
    await queryInterface.dropTable('feature_dependencies');

    // Drop the enum type
    await queryInterface.sequelize.query(`
      DROP TYPE IF EXISTS "enum_feature_dependencies_type";
    `);
  }
}; 