const { DataTypes } = require('sequelize');

module.exports = (sequelize) => {
  const Team = sequelize.define('Team', {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true,
      field: 'id'
    },
    name: {
      type: DataTypes.STRING,
      allowNull: false,
      validate: {
        notEmpty: true,
        len: [1, 100]
      },
      field: 'name'
    },
    description: {
      type: DataTypes.TEXT,
      allowNull: true,
      validate: {
        len: [0, 500]
      },
      field: 'description'
    },
    createdBy: {
      type: DataTypes.UUID,
      allowNull: false,
      references: {
        model: 'users',
        key: 'id'
      },
      field: 'createdBy'
    },
    createdByEmail: {
      type: DataTypes.STRING,
      allowNull: false,
      validate: {
        isEmail: true
      },
      field: 'createdByEmail'
    }
  }, {
    tableName: 'teams',
    timestamps: true,
    underscored: false,
    freezeTableName: true,
    indexes: [
      {
        unique: true,
        fields: ['name', 'createdBy']
      }
    ]
  });

  return Team;
}; 