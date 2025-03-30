const { Model, DataTypes } = require('sequelize');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const sequelize = require('../config/db');

class User extends Model {
  // Instance method to get signed JWT token
  getSignedJwtToken() {
    return jwt.sign(
      { id: this.id, role: this.role },
      process.env.JWT_SECRET,
      {
        expiresIn: process.env.JWT_EXPIRES_IN
      }
    );
  }

  // Instance method to match password
  async matchPassword(enteredPassword) {
    return await bcrypt.compare(enteredPassword, this.password);
  }
}

User.init({
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
      len: [1, 50]
    }
  },
  email: {
    type: DataTypes.STRING,
    allowNull: false,
    unique: true,
    validate: {
      isEmail: true
    }
  },
  password: {
    type: DataTypes.STRING,
    allowNull: false,
    validate: {
      len: [6, 100]
    }
  },
  role: {
    type: DataTypes.ENUM('user', 'admin', 'product-manager'),
    defaultValue: 'user'
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
  firebaseUid: {
    type: DataTypes.STRING,
    unique: true,
    allowNull: true
  }
}, {
  sequelize,
  modelName: 'User',
  tableName: 'users',
  timestamps: true,
  hooks: {
    beforeSave: async (user) => {
      if (user.changed('password')) {
        const salt = await bcrypt.genSalt(10);
        user.password = await bcrypt.hash(user.password, salt);
      }
    }
  },
  defaultScope: {
    attributes: { exclude: ['password'] }
  }
});

module.exports = User; 