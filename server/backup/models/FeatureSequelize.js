const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/db');

/**
 * Feature model using Sequelize ORM for PostgreSQL
 */
let Feature;

if (sequelize) {
  Feature = sequelize.define('Feature', {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true
    },
    title: {
      type: DataTypes.STRING(100),
      allowNull: false,
      validate: {
        notEmpty: { msg: 'Feature title is required' }
      }
    },
    description: {
      type: DataTypes.TEXT,
      allowNull: false,
      validate: {
        notEmpty: { msg: 'Feature description is required' }
      }
    },
    status: {
      type: DataTypes.ENUM('requested', 'planned', 'in-progress', 'completed', 'rejected'),
      defaultValue: 'requested'
    },
    priority: {
      type: DataTypes.INTEGER,
      defaultValue: 5,
      validate: {
        min: 1,
        max: 10
      }
    },
    impact: {
      type: DataTypes.INTEGER,
      defaultValue: 5,
      validate: {
        min: 1,
        max: 10
      }
    },
    effort: {
      type: DataTypes.INTEGER,
      defaultValue: 5,
      validate: {
        min: 1,
        max: 10
      }
    },
    category: {
      type: DataTypes.ENUM('ui', 'performance', 'functionality', 'security', 'other'),
      defaultValue: 'other'
    },
    requestedById: {
      type: DataTypes.UUID,
      allowNull: false
    },
    assignedToId: {
      type: DataTypes.UUID,
      allowNull: true
    },
    votes: {
      type: DataTypes.INTEGER,
      defaultValue: 0
    },
    targetRelease: {
      type: DataTypes.STRING,
      allowNull: true
    }
  }, {
    timestamps: true,
    tableName: 'features',
    // Add virtual fields
    getterMethods: {
      score() {
        return (this.priority * 0.4) + (this.impact * 0.4) - (this.effort * 0.2);
      }
    }
  });
} else {
  // Create a placeholder model when sequelize is not available
  Feature = {
    findAll: async () => [],
    findByPk: async () => null,
    findOne: async () => null,
    create: async () => { throw new Error('Database not connected'); },
    update: async () => { throw new Error('Database not connected'); },
    destroy: async () => { throw new Error('Database not connected'); },
    belongsTo: () => {},
    hasMany: () => {}
  };
  console.warn('Sequelize not initialized. Feature model will not be functional.');
}

// Define associations in a separate function to avoid circular dependencies
const setupAssociations = (models) => {
  if (!sequelize) return;
  
  const { User, Comment, Attachment, Vote } = models;
  
  // A feature belongs to a user who requested it
  Feature.belongsTo(User, {
    as: 'requestedBy',
    foreignKey: 'requestedById'
  });
  
  // A feature can be assigned to a user
  Feature.belongsTo(User, {
    as: 'assignedTo',
    foreignKey: 'assignedToId'
  });
  
  // A feature can have many comments
  Feature.hasMany(Comment, {
    foreignKey: 'featureId',
    as: 'comments'
  });
  
  // A feature can have many attachments
  Feature.hasMany(Attachment, {
    foreignKey: 'featureId',
    as: 'attachments'
  });
  
  // A feature can have many votes from users
  Feature.hasMany(Vote, {
    foreignKey: 'featureId',
    as: 'voterRecords'
  });
};

module.exports = {
  Feature,
  setupAssociations
}; 