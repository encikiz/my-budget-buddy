// Authentication middleware
module.exports = {
  // Ensure user is authenticated
  ensureAuthenticated: function(req, res, next) {
    // Check if user is authenticated
    if (req.isAuthenticated()) {
      return next();
    }

    // Redirect to login if not authenticated
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
