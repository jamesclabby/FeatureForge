const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/db');

/**
 * Team model using Sequelize ORM for PostgreSQL
 */
let Team;

if (sequelize) {
  Team = sequelize.define('Team', {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true
    },
    name: {
      type: DataTypes.STRING(50),
      allowNull: false,
      validate: {
        notEmpty: { msg: 'Team name is required' }
      }
    },
    description: {
      type: DataTypes.TEXT,
      allowNull: true
    },
    department: {
      type: DataTypes.STRING,
      allowNull: true
    }
  }, {
    timestamps: true,
    tableName: 'teams'
  });
} else {
  // Create a placeholder model when sequelize is not available
  Team = {
    findAll: async () => [],
    findByPk: async () => null,
    findOne: async () => null,
    create: async () => { throw new Error('Database not connected'); },
    update: async () => { throw new Error('Database not connected'); },
    destroy: async () => { throw new Error('Database not connected'); },
    belongsTo: () => {},
    hasMany: () => {}
  };
  console.warn('Sequelize not initialized. Team model will not be functional.');
}

// Define associations in a separate function to avoid circular dependencies
const setupAssociations = (models) => {
  if (!sequelize) return;
  
  const { User } = models;
  
  // A team can have many users
  Team.hasMany(User, {
    foreignKey: 'team_id',
    as: 'members'
  });
};

module.exports = {
  Team,
  setupAssociations
}; 