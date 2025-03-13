const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/db');

/**
 * Attachment model using Sequelize ORM for PostgreSQL
 */
let Attachment;

if (sequelize) {
  Attachment = sequelize.define('Attachment', {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true
    },
    name: {
      type: DataTypes.STRING,
      allowNull: false
    },
    url: {
      type: DataTypes.STRING,
      allowNull: false
    },
    type: {
      type: DataTypes.STRING,
      allowNull: false
    },
    featureId: {
      type: DataTypes.UUID,
      allowNull: false
    }
  }, {
    timestamps: true,
    tableName: 'attachments'
  });
} else {
  // Create a placeholder model when sequelize is not available
  Attachment = {
    findAll: async () => [],
    findByPk: async () => null,
    findOne: async () => null,
    create: async () => { throw new Error('Database not connected'); },
    update: async () => { throw new Error('Database not connected'); },
    destroy: async () => { throw new Error('Database not connected'); },
    belongsTo: () => {},
    hasMany: () => {}
  };
  console.warn('Sequelize not initialized. Attachment model will not be functional.');
}

// Define associations in a separate function to avoid circular dependencies
const setupAssociations = (models) => {
  if (!sequelize) return;
  
  const { Feature } = models;
  
  // An attachment belongs to a feature
  Attachment.belongsTo(Feature, {
    foreignKey: 'featureId',
    as: 'feature'
  });
};

module.exports = {
  Attachment,
  setupAssociations
}; 