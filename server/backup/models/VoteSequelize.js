const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/db');

/**
 * Vote model using Sequelize ORM for PostgreSQL
 */
let Vote;

if (sequelize) {
  Vote = sequelize.define('Vote', {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true
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
    tableName: 'votes',
    indexes: [
      {
        unique: true,
        fields: ['userId', 'featureId']
      }
    ]
  });
} else {
  // Create a placeholder model when sequelize is not available
  Vote = {
    findAll: async () => [],
    findByPk: async () => null,
    findOne: async () => null,
    create: async () => { throw new Error('Database not connected'); },
    update: async () => { throw new Error('Database not connected'); },
    destroy: async () => { throw new Error('Database not connected'); },
    belongsTo: () => {},
    hasMany: () => {}
  };
  console.warn('Sequelize not initialized. Vote model will not be functional.');
}

// Define associations in a separate function to avoid circular dependencies
const setupAssociations = (models) => {
  if (!sequelize) return;
  
  const { User, Feature } = models;
  
  // A vote belongs to a user
  Vote.belongsTo(User, {
    foreignKey: 'userId',
    as: 'user'
  });
  
  // A vote belongs to a feature
  Vote.belongsTo(Feature, {
    foreignKey: 'featureId',
    as: 'feature'
  });
};

module.exports = {
  Vote,
  setupAssociations
}; 