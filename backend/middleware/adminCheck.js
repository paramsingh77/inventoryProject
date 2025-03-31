// Middleware to check if the user is an admin
module.exports = function(req, res, next) {
  // User should be already authenticated via auth middleware
  if (!req.user) {
    return res.status(401).json({ error: 'Authentication required' });
  }

  // Check if user has admin role
  if (req.user.role !== 'admin') {
    return res.status(403).json({ error: 'Admin access required' });
  }

  next();
}; 