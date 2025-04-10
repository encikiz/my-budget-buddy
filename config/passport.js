const LocalStrategy = require('passport-local').Strategy;
const GoogleStrategy = require('passport-google-oauth20').Strategy;
const bcrypt = require('bcryptjs');
const User = require('../models/User');
const Category = require('../models/Category');

// Helper function to create default categories for new users
const createDefaultCategories = async (userId) => {
  try {
    // Default expense categories
    const expenseCategories = [
      { name: 'Housing', type: 'expense', color: '#ffa500', icon: 'fas fa-home', user: userId },
      { name: 'Utilities', type: 'expense', color: '#4169e1', icon: 'fas fa-bolt', user: userId },
      { name: 'Food', type: 'expense', color: '#32cd32', icon: 'fas fa-utensils', user: userId },
      { name: 'Transportation', type: 'expense', color: '#ff6347', icon: 'fas fa-car', user: userId },
      { name: 'Entertainment', type: 'expense', color: '#9370db', icon: 'fas fa-film', user: userId },
      { name: 'Other', type: 'expense', color: '#20b2aa', icon: 'fas fa-shopping-bag', user: userId },
      { name: 'Loans', type: 'expense', color: '#e91e63', icon: 'fas fa-money-bill-wave', user: userId }
    ];

    // Default income categories
    const incomeCategories = [
      { name: 'Salary', type: 'income', color: '#4caf50', icon: 'fas fa-briefcase', user: userId },
      { name: 'Freelance', type: 'income', color: '#ff9800', icon: 'fas fa-laptop', user: userId },
      { name: 'Investments', type: 'income', color: '#2196f3', icon: 'fas fa-chart-line', user: userId }
    ];

    // Create all categories
    await Category.insertMany([...expenseCategories, ...incomeCategories]);

    return true;
  } catch (error) {
    console.error('Error creating default categories:', error);
    return false;
  }
};

module.exports = function(passport) {
  // Local Strategy
  passport.use(new LocalStrategy(
    { usernameField: 'email' },
    async (email, password, done) => {
      try {
        // Find user by email
        const user = await User.findOne({ email });

        if (!user) {
          return done(null, false, { message: 'Incorrect email or password' });
        }

        // If user exists but has no password (Google auth only)
        if (!user.password && user.googleId) {
          return done(null, false, { message: 'Please log in with Google' });
        }

        // Check password
        const isMatch = await bcrypt.compare(password, user.password);

        if (!isMatch) {
          return done(null, false, { message: 'Incorrect email or password' });
        }

        return done(null, user);
      } catch (err) {
        return done(err);
      }
    }
  ));

  // Google Strategy - only set up if credentials are provided
  if (process.env.GOOGLE_CLIENT_ID && process.env.GOOGLE_CLIENT_SECRET) {
    passport.use(new GoogleStrategy({
      clientID: process.env.GOOGLE_CLIENT_ID,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET,
      callbackURL: '/auth/google/callback',
      proxy: true
    }, async (accessToken, refreshToken, profile, done) => {
    try {
      // Check if user already exists
      let user = await User.findOne({ googleId: profile.id });

      if (user) {
        // User exists, return the user
        return done(null, user);
      }

      // Check if user exists with the same email
      user = await User.findOne({ email: profile.emails[0].value });

      if (user) {
        // Link Google account to existing user
        user.googleId = profile.id;
        user.profileImage = profile.photos[0].value;
        await user.save();
        return done(null, user);
      }

      // Create new user
      const newUser = new User({
        name: profile.displayName,
        email: profile.emails[0].value,
        googleId: profile.id,
        profileImage: profile.photos[0].value
      });

      await newUser.save();

      // Create default categories for the new user
      await createDefaultCategories(newUser._id);

      return done(null, newUser);
    } catch (err) {
      console.error('Google auth error:', err);
      return done(err);
    }
    }));
  }

  // Serialize user
  passport.serializeUser((user, done) => {
    done(null, user.id);
  });

  // Deserialize user
  passport.deserializeUser(async (id, done) => {
    try {
      const user = await User.findById(id);
      done(null, user);
    } catch (err) {
      done(err);
    }
  });
};
