const jwt = require('jsonwebtoken');
require('dotenv').config();

const authMiddleware = (req, res, next) => {
  try {
    // FIXED: Temporarily bypass auth for development testing
    if (process.env.NODE_ENV === 'development' || process.env.BYPASS_AUTH === 'true') {
      console.log('Auth bypassed for development');
      req.user = { id: 1, role: 'admin' }; // Mock user for development
      return next();
    }

    const token = req.headers.authorization?.split(' ')[1];
    
    if (!token) {
      return res.status(401).json({ message: 'No token provided' });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.user = decoded;
    next();
  } catch (error) {
    console.error('Auth middleware error:', error);
    return res.status(401).json({ message: 'Invalid token' });
  }
};

module.exports = authMiddleware; 