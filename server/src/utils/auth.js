const jwt = require('jsonwebtoken');

const generateToken = (user) => {
  return jwt.sign(
    { id: user.id },
    process.env.JWT_SECRET || 'test-secret',
    { expiresIn: process.env.JWT_EXPIRES_IN || '1d' }
  );
};

module.exports = {
  generateToken
}; 