// Middleware to check if user has access to the requested site
module.exports = function(siteParam = 'site') {
  return (req, res, next) => {
    // User should be already authenticated via auth middleware
    if (!req.user) {
      return res.status(401).json({ error: 'Authentication required' });
    }

    // Get the site from the request (params, query, or body)
    const siteName = req.params[siteParam] || req.query[siteParam] || req.body[siteParam];
    
    if (!siteName) {
      return next(); // No site specified, pass control to next middleware
    }

    // Admin can access all sites
    if (req.user.role === 'admin') {
      return next();
    }

    // Check if user has access to requested site
    if (req.user.assigned_site !== siteName) {
      return res.status(403).json({ 
        error: 'Access denied', 
        message: `You don't have permission to access the site: ${siteName}`
      });
    }

    next();
  };
}; 