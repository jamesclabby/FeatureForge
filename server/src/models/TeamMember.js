const { DataTypes } = require('sequelize');

module.exports = (sequelize) => {
  const TeamMember = sequelize.define('TeamMember', {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true
    },
    teamId: {
      type: DataTypes.UUID,
      allowNull: false,
      references: {
        model: 'teams',
        key: 'id'
      }
    },
    userId: {
      type: DataTypes.UUID,
      allowNull: false,
      references: {
        model: 'users',
        key: 'id'
      }
    },
    role: {
      type: DataTypes.ENUM('admin', 'user', 'product-owner'),
      defaultValue: 'user',
      allowNull: false
    },
    joinedAt: {
      type: DataTypes.DATE,
      defaultValue: DataTypes.NOW
    }
  }, {
    tableName: 'teamMembers',
    timestamps: true,
    indexes: [
      {
        unique: true,
        fields: ['teamId', 'userId']
      }
    ]
  });

  return TeamMember;
}; 