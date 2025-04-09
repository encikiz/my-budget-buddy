// Authentication middleware
module.exports = {
  // Ensure user is authenticated
  ensureAuthenticated: function(req, res, next) {
    // For development, allow unauthenticated users
    if (process.env.NODE_ENV !== 'production') {
      // Create a mock user if not authenticated
      if (!req.isAuthenticated()) {
        req.user = {
          id: '64e5e1f71a5f7b2d3c9b4567', // Mock user ID
          name: 'Hafizan',
          email: 'test@example.com'
        };
      }
      return next();
    }

    // For production
    if (req.isAuthenticated()) {
      return next();
    }
    res.redirect('/login');
  },

  // Ensure user is not authenticated (for login/register pages)
  ensureGuest: function(req, res, next) {
    if (!req.isAuthenticated()) {
      return next();
    }
    res.redirect('/');
  }
};
