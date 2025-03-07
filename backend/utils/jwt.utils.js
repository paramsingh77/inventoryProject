const jwt = require('jsonwebtoken');
const config = require('../config/auth.config');

const generateToken = (userId, roles) => {
  return jwt.sign(
    { id: userId, roles: roles },
    config.secret,
    { expiresIn: config.jwtExpiration }
  );
};

const verifyToken = (token) => {
  try {
    return jwt.verify(token, config.secret);
  } catch (error) {
    return null;
  }
};

module.exports = {
  generateToken,
  verifyToken
}; 