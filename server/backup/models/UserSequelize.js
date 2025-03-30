const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/db');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

/**
 * User model using Sequelize ORM for PostgreSQL
 */
let User;

if (sequelize) {
  User = sequelize.define('User', {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true
    },
    name: {
      type: DataTypes.STRING(50),
      allowNull: false,
      validate: {
        notEmpty: { msg: 'Name is required' }
      }
    },
    email: {
      type: DataTypes.STRING,
      allowNull: false,
      unique: true,
      validate: {
        isEmail: { msg: 'Please add a valid email' }
      }
    },
    password: {
      type: DataTypes.STRING,
      allowNull: false,
      validate: {
        len: { args: [6, 100], msg: 'Password must be at least 6 characters' }
      }
    },
    role: {
      type: DataTypes.ENUM('user', 'admin', 'product-manager'),
      defaultValue: 'user'
    },
    team_id: {
      type: DataTypes.UUID,
      allowNull: true,
      references: {
        model: 'teams',
        key: 'id'
      }
    },
    department: {
      type: DataTypes.STRING,
      allowNull: true
    },
    avatar: {
      type: DataTypes.STRING,
      allowNull: true
    },
    resetPasswordToken: {
      type: DataTypes.STRING,
      allowNull: true
    },
    resetPasswordExpire: {
      type: DataTypes.DATE,
      allowNull: true
    },
    firebase_uid: {
      type: DataTypes.STRING,
      allowNull: true,
      unique: true
    }
  }, {
    timestamps: true,
    tableName: 'users',
    defaultScope: {
      attributes: { exclude: ['password'] }
    },
    scopes: {
      withPassword: {
        attributes: { include: ['password'] }
      }
    },
    hooks: {
      beforeCreate: async (user) => {
        if (user.password) {
          const salt = await bcrypt.genSalt(10);
          user.password = await bcrypt.hash(user.password, salt);
        }
      },
      beforeUpdate: async (user) => {
        if (user.changed('password')) {
          const salt = await bcrypt.genSalt(10);
          user.password = await bcrypt.hash(user.password, salt);
        }
      }
    }
  });

  // Instance methods
  User.prototype.getSignedJwtToken = function() {
    return jwt.sign(
      { id: this.id, role: this.role },
      process.env.JWT_SECRET,
      {
        expiresIn: process.env.JWT_EXPIRES_IN
      }
    );
  };

  User.prototype.matchPassword = async function(enteredPassword) {
    return await bcrypt.compare(enteredPassword, this.password);
  };
} else {
  // Create a placeholder model when sequelize is not available
  User = {
    findAll: async () => [],
    findByPk: async () => null,
    findOne: async () => null,
    create: async () => { throw new Error('Database not connected'); },
    update: async () => { throw new Error('Database not connected'); },
    destroy: async () => { throw new Error('Database not connected'); },
    belongsTo: () => {},
    hasMany: () => {},
    scope: () => User,
    prototype: {
      getSignedJwtToken: () => 'DUMMY_TOKEN',
      matchPassword: async () => false
    }
  };
  console.warn('Sequelize not initialized. User model will not be functional.');
}

// Define associations in a separate function to avoid circular dependencies
const setupAssociations = (models) => {
  if (!sequelize) return;
  
  const { Feature, Comment, Vote, Team } = models;
  
  // A user belongs to a team
  User.belongsTo(Team, {
    foreignKey: 'team_id',
    as: 'team'
  });
  
  // A user can request many features
  User.hasMany(Feature, {
    foreignKey: 'requestedById',
    as: 'requestedFeatures'
  });
  
  // A user can be assigned many features
  User.hasMany(Feature, {
    foreignKey: 'assignedToId',
    as: 'assignedFeatures'
  });
  
  // A user can make many comments
  User.hasMany(Comment, {
    foreignKey: 'userId',
    as: 'comments'
  });
  
  // A user can vote for many features
  User.hasMany(Vote, {
    foreignKey: 'userId',
    as: 'votes'
  });
};

module.exports = {
  User,
  setupAssociations
}; 