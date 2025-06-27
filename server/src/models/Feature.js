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
      type: DataTypes.ENUM('backlog', 'in_progress', 'review', 'done'),
      defaultValue: 'backlog',
      allowNull: false
    },
    priority: {
      type: DataTypes.ENUM('low', 'medium', 'high', 'critical'),
      defaultValue: 'medium',
      allowNull: false
    },
    type: {
      type: DataTypes.ENUM('parent', 'story', 'task', 'research'),
      defaultValue: 'task',
      allowNull: false,
      validate: {
        isIn: [['parent', 'story', 'task', 'research']]
      }
    },
    parentId: {
      type: DataTypes.UUID,
      allowNull: true,
      references: {
        model: 'features',
        key: 'id'
      },
      validate: {
        // Custom validation for hierarchy rules
        async isValidParent(value) {
          if (value && this.type === 'parent') {
            throw new Error('Parent-type features cannot have a parent');
          }
          if (value) {
            const Feature = this.constructor;
            const parent = await Feature.findByPk(value);
            if (!parent) {
              throw new Error('Parent feature does not exist');
            }
            if (parent.type !== 'parent') {
              throw new Error('Features can only be children of parent-type features');
            }
            if (parent.teamId !== this.teamId) {
              throw new Error('Parent feature must be in the same team');
            }
          }
        }
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
      defaultValue: [],
      get() {
        // Ensure we always return an array, even if the database has NULL
        const rawValue = this.getDataValue('comments');
        return rawValue || [];
      },
      set(value) {
        // Always store an array
        this.setDataValue('comments', Array.isArray(value) ? value : []);
      }
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
      },
      {
        fields: ['type']
      },
      {
        fields: ['parentId']
      },
      {
        fields: ['teamId', 'type']
      },
      {
        fields: ['teamId', 'parentId']
      }
    ]
  });

  return Feature;
}; 