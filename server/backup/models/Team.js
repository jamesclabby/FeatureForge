const { Model, DataTypes } = require('sequelize');
const sequelize = require('../config/db');

class Team extends Model {}

Team.init({
  id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true
  },
  name: {
    type: DataTypes.STRING,
    allowNull: false,
    validate: {
      notEmpty: true,
      len: [1, 100]
    }
  },
  description: {
    type: DataTypes.TEXT,
    allowNull: true,
    validate: {
      len: [0, 500]
    }
  },
  createdBy: {
    type: DataTypes.UUID,
    allowNull: false,
    references: {
      model: 'Users',
      key: 'id'
    }
  },
  createdByEmail: {
    type: DataTypes.STRING,
    allowNull: false,
    validate: {
      isEmail: true
    }
  }
}, {
  sequelize,
  modelName: 'Team',
  tableName: 'teams',
  timestamps: true,
  indexes: [
    {
      unique: true,
      fields: ['name', 'createdBy']
    }
  ]
});

module.exports = Team; 