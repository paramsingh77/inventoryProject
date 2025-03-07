const checkRole = (requiredRoles) => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(403).json({ message: 'No user found' });
    }

    const hasRole = req.user.roles.some(role => requiredRoles.includes(role));
    if (!hasRole) {
      return res.status(403).json({ message: 'Required role not found' });
    }

    next();
  };
};

module.exports = {
  checkRole
}; 