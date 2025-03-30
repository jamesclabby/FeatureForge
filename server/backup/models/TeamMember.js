const { Model, DataTypes } = require('sequelize');
const sequelize = require('../config/db');

class TeamMember extends Model {}

TeamMember.init({
  id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true
  },
  userId: {
    type: DataTypes.UUID,
    allowNull: false,
    references: {
      model: 'users',
      key: 'id'
    }
  },
  teamId: {
    type: DataTypes.UUID,
    allowNull: false,
    references: {
      model: 'teams',
      key: 'id'
    }
  },
  role: {
    type: DataTypes.ENUM('admin', 'user', 'product-owner'),
    allowNull: false,
    defaultValue: 'user'
  },
  joinedAt: {
    type: DataTypes.DATE,
    allowNull: false,
    defaultValue: DataTypes.NOW
  }
}, {
  sequelize,
  modelName: 'TeamMember',
  tableName: 'team_members',
  timestamps: true,
  indexes: [
    {
      unique: true,
      fields: ['userId', 'teamId']
    }
  ]
});

module.exports = TeamMember; 