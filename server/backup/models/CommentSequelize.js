const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/db');

/**
 * Comment model using Sequelize ORM for PostgreSQL
 */
let Comment;

if (sequelize) {
  Comment = sequelize.define('Comment', {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true
    },
    text: {
      type: DataTypes.TEXT,
      allowNull: false,
      validate: {
        notEmpty: { msg: 'Comment text is required' }
      }
    },
    userId: {
      type: DataTypes.UUID,
      allowNull: false
    },
    featureId: {
      type: DataTypes.UUID,
      allowNull: false
    }
  }, {
    timestamps: true,
    tableName: 'comments'
  });
} else {
  // Create a placeholder model when sequelize is not available
  Comment = {
    findAll: async () => [],
    findByPk: async () => null,
    findOne: async () => null,
    create: async () => { throw new Error('Database not connected'); },
    update: async () => { throw new Error('Database not connected'); },
    destroy: async () => { throw new Error('Database not connected'); },
    belongsTo: () => {},
    hasMany: () => {}
  };
  console.warn('Sequelize not initialized. Comment model will not be functional.');
}

// Define associations in a separate function to avoid circular dependencies
const setupAssociations = (models) => {
  if (!sequelize) return;
  
  const { User, Feature } = models;
  
  // A comment belongs to a user
  Comment.belongsTo(User, {
    foreignKey: 'userId',
    as: 'user'
  });
  
  // A comment belongs to a feature
  Comment.belongsTo(Feature, {
    foreignKey: 'featureId',
    as: 'feature'
  });
};

module.exports = {
  Comment,
  setupAssociations
}; 