const { DataTypes } = require('sequelize');

module.exports = (sequelize) => {
  const Feature = sequelize.define('Feature', {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true
    },
    title: {
      type: DataTypes.STRING,
      allowNull: false,
      validate: {
        notEmpty: true,
        len: [1, 200]
      }
    },
    description: {
      type: DataTypes.TEXT,
      allowNull: true,
      validate: {
        len: [0, 2000]
      }
    },
    status: {
      type: DataTypes.ENUM('planned', 'in-progress', 'in-review', 'completed', 'cancelled'),
      defaultValue: 'planned',
      allowNull: false
    },
    priority: {
      type: DataTypes.ENUM('low', 'medium', 'high', 'critical'),
      defaultValue: 'medium',
      allowNull: false
    },
    teamId: {
      type: DataTypes.UUID,
      allowNull: false,
      references: {
        model: 'teams',
        key: 'id'
      }
    },
    createdBy: {
      type: DataTypes.UUID,
      allowNull: false,
      references: {
        model: 'users',
        key: 'id'
      }
    },
    createdByEmail: {
      type: DataTypes.STRING,
      allowNull: true
    },
    estimatedEffort: {
      type: DataTypes.INTEGER,
      allowNull: true,
      validate: {
        min: 0
      }
    },
    dueDate: {
      type: DataTypes.DATE,
      allowNull: true
    },
    assignedTo: {
      type: DataTypes.UUID,
      allowNull: true,
      references: {
        model: 'users',
        key: 'id'
      }
    },
    tags: {
      type: DataTypes.JSONB,
      allowNull: true,
      defaultValue: []
    },
    attachments: {
      type: DataTypes.JSONB,
      allowNull: true,
      defaultValue: []
    },
    comments: {
      type: DataTypes.JSONB,
      allowNull: true,
      defaultValue: []
    },
    votes: {
      type: DataTypes.INTEGER,
      defaultValue: 0,
      allowNull: false
    },
    impact: {
      type: DataTypes.INTEGER,
      defaultValue: 5,
      allowNull: true,
      validate: {
        min: 1,
        max: 10
      }
    },
    effort: {
      type: DataTypes.INTEGER,
      defaultValue: 5,
      allowNull: true,
      validate: {
        min: 1,
        max: 10
      }
    },
    category: {
      type: DataTypes.STRING,
      allowNull: true
    },
    targetRelease: {
      type: DataTypes.STRING,
      allowNull: true
    }
  }, {
    tableName: 'features',
    timestamps: true,
    underscored: false,
    freezeTableName: true,
    indexes: [
      {
        fields: ['teamId']
      },
      {
        fields: ['status']
      },
      {
        fields: ['priority']
      },
      {
        fields: ['votes']
      }
    ]
  });

  return Feature;
}; 