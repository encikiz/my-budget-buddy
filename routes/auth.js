const express = require('express');
const router = express.Router();
const passport = require('passport');
const User = require('../models/User');
const { ensureGuest } = require('../middleware/auth');
const crypto = require('crypto');
const bcrypt = require('bcryptjs');

// Home route - show login page or redirect to dashboard
router.get('/', (req, res) => {
  if (req.isAuthenticated()) {
    res.redirect('/dashboard');
  } else {
    res.render('auth/login', {
      title: 'Login'
    });
  }
});

// Login page (alternative route)
router.get('/login', ensureGuest, (req, res) => {
  res.render('auth/login', {
    title: 'Login'
  });
});

// Register page
router.get('/register', ensureGuest, (req, res) => {
  res.render('auth/register', {
    title: 'Register'
  });
});

// Login process
router.post('/login', (req, res, next) => {
  passport.authenticate('local', {
    successRedirect: '/',
    failureRedirect: '/login',
    failureFlash: true
  })(req, res, next);
});

// Google Auth Routes
router.get('/auth/google', passport.authenticate('google', {
  scope: ['profile', 'email']
}));

// Google Auth Callback
router.get('/auth/google/callback',
  passport.authenticate('google', {
    failureRedirect: '/login',
    failureFlash: true
  }),
  (req, res) => {
    // Successful authentication
    res.redirect('/');
  }
);

// Register process
router.post('/register', async (req, res) => {
  try {
    const { name, email, password, confirmPassword } = req.body;

    // Validation
    let errors = [];

    if (!name || !email || !password || !confirmPassword) {
      errors.push({ msg: 'Please fill in all fields' });
    }

    if (password !== confirmPassword) {
      errors.push({ msg: 'Passwords do not match' });
    }

    if (password.length < 6) {
      errors.push({ msg: 'Password should be at least 6 characters' });
    }

    if (errors.length > 0) {
      return res.render('auth/register', {
        title: 'Register',
        errors,
        name,
        email
      });
    }

    // Check if user already exists
    const existingUser = await User.findOne({ email });

    if (existingUser) {
      errors.push({ msg: 'Email is already registered' });
      return res.render('auth/register', {
        title: 'Register',
        errors,
        name,
        email
      });
    }

    // Create new user
    const newUser = new User({
      name,
      email,
      password
    });

    await newUser.save();

    // Create default categories for the new user
    await createDefaultCategories(newUser._id);
    console.log('Default categories created for new user');

    req.flash('success', 'You are now registered and can log in');
    res.redirect('/login');
  } catch (err) {
    console.error(err);
    res.render('auth/register', {
      title: 'Register',
      errors: [{ msg: 'Server error. Please try again.' }]
    });
  }
});

// Import Category model
const Category = require('../models/Category');

// Helper function to create default categories for a user
async function createDefaultCategories(userId) {
  // Default income categories
  const incomeCategories = [
    {
      name: 'Salary',
      type: 'income',
      description: 'Regular employment income',
      color: '#4caf50', // Green
      icon: 'fas fa-money-bill-wave',
      user: userId
    },
    {
      name: 'Freelance',
      type: 'income',
      description: 'Income from freelance work',
      color: '#ff9800', // Orange
      icon: 'fas fa-laptop',
      user: userId
    },
    {
      name: 'Investment',
      type: 'income',
      description: 'Income from investments',
      color: '#2196f3', // Blue
      icon: 'fas fa-chart-line',
      user: userId
    },
    {
      name: 'Other Income',
      type: 'income',
      description: 'Other sources of income',
      color: '#9c27b0', // Purple
      icon: 'fas fa-gift',
      user: userId
    }
  ];

  // Default expense categories
  const expenseCategories = [
    {
      name: 'Housing',
      type: 'expense',
      description: 'Rent, mortgage, repairs',
      budgetLimit: 1500,
      color: '#2d8b78', // Teal
      icon: 'fas fa-home',
      user: userId
    },
    {
      name: 'Utilities',
      type: 'expense',
      description: 'Electricity, water, internet',
      budgetLimit: 300,
      color: '#2e51a3', // Blue
      icon: 'fas fa-bolt',
      user: userId
    },
    {
      name: 'Food',
      type: 'expense',
      description: 'Groceries, dining out',
      budgetLimit: 800,
      color: '#e07f10', // Orange
      icon: 'fas fa-utensils',
      user: userId
    },
    {
      name: 'Transportation',
      type: 'expense',
      description: 'Gas, public transit, car maintenance',
      budgetLimit: 400,
      color: '#383838', // Dark Gray
      icon: 'fas fa-car',
      user: userId
    },
    {
      name: 'Entertainment',
      type: 'expense',
      description: 'Movies, events, hobbies',
      budgetLimit: 200,
      color: '#e13333', // Red
      icon: 'fas fa-film',
      user: userId
    },
    {
      name: 'Healthcare',
      type: 'expense',
      description: 'Medical expenses, insurance',
      budgetLimit: 300,
      color: '#3f51b5', // Indigo
      icon: 'fas fa-heartbeat',
      user: userId
    },
    {
      name: 'Loans',
      type: 'expense',
      description: 'Loan payments, credit cards',
      budgetLimit: 500,
      color: '#c43131', // Dark Red
      icon: 'fas fa-money-bill',
      user: userId
    },
    {
      name: 'Shopping',
      type: 'expense',
      description: 'Clothing, electronics, etc.',
      budgetLimit: 300,
      color: '#9c27b0', // Purple
      icon: 'fas fa-shopping-bag',
      user: userId
    },
    {
      name: 'Other',
      type: 'expense',
      description: 'Miscellaneous expenses',
      budgetLimit: 200,
      color: '#af3c73', // Pink
      icon: 'fas fa-tag',
      user: userId
    }
  ];

  // Insert all categories
  await Category.insertMany([...incomeCategories, ...expenseCategories]);
  console.log('Default categories created for user');
}

// Guest login
router.get('/guest-login', async (req, res) => {
  try {
    // Check if guest user exists
    let guestUser = await User.findOne({ email: 'guest@budgetbuddy.com' });
    let isNewUser = false;

    // If guest user doesn't exist, create one
    if (!guestUser) {
      guestUser = new User({
        name: 'Guest User',
        email: 'guest@budgetbuddy.com',
        password: 'guestpassword123' // This will be hashed by the pre-save hook
      });

      await guestUser.save();
      console.log('Guest user created');
      isNewUser = true;
    }

    // Check if guest user has categories
    const categoriesCount = await Category.countDocuments({ user: guestUser._id });

    // If no categories exist, create default ones
    if (categoriesCount === 0 || isNewUser) {
      await createDefaultCategories(guestUser._id);
    }

    // Log in as guest
    req.login(guestUser, (err) => {
      if (err) {
        console.error('Error logging in as guest:', err);
        req.flash('error', 'Error logging in as guest');
        return res.redirect('/login');
      }

      return res.redirect('/');
    });
  } catch (err) {
    console.error('Guest login error:', err);
    req.flash('error', 'Error logging in as guest');
    res.redirect('/login');
  }
});

// Logout
router.get('/logout', (req, res) => {
  req.logout(function(err) {
    if (err) { return next(err); }
    res.redirect('/login');
  });
});

// Forgot Password page
router.get('/forgot-password', ensureGuest, (req, res) => {
  res.render('auth/forgot-password', {
    title: 'Forgot Password',
    errors: []
  });
});

// Forgot Password process
router.post('/forgot-password', async (req, res) => {
  try {
    const { email } = req.body;

    // Validation
    if (!email) {
      return res.render('auth/forgot-password', {
        title: 'Forgot Password',
        errors: [{ msg: 'Please enter your email address' }]
      });
    }

    // Find user by email
    const user = await User.findOne({ email });

    // If user doesn't exist, still show success message for security
    if (!user) {
      req.flash('success', 'If your email is registered, you will receive password reset instructions');
      return res.render('auth/forgot-password', {
        title: 'Forgot Password',
        success_msg: 'If your email is registered, you will receive password reset instructions'
      });
    }

    // Generate token
    const token = crypto.randomBytes(20).toString('hex');

    // Set token and expiration
    user.resetPasswordToken = token;
    user.resetPasswordExpires = Date.now() + 3600000; // 1 hour

    await user.save();

    // In a real application, you would send an email with the reset link
    // For this demo, we'll just show the token in the console
    console.log(`Password reset token for ${email}: ${token}`);
    console.log(`Reset link: http://localhost:${process.env.PORT || 5002}/reset-password/${token}`);

    req.flash('success', 'If your email is registered, you will receive password reset instructions');
    res.render('auth/forgot-password', {
      title: 'Forgot Password',
      success_msg: 'If your email is registered, you will receive password reset instructions'
    });
  } catch (err) {
    console.error(err);
    res.render('auth/forgot-password', {
      title: 'Forgot Password',
      errors: [{ msg: 'Server error. Please try again.' }]
    });
  }
});

// Reset Password page
router.get('/reset-password/:token', async (req, res) => {
  try {
    const { token } = req.params;

    // Find user by token and check if token is still valid
    const user = await User.findOne({
      resetPasswordToken: token,
      resetPasswordExpires: { $gt: Date.now() }
    });

    if (!user) {
      req.flash('error', 'Password reset token is invalid or has expired');
      return res.redirect('/forgot-password');
    }

    res.render('auth/reset-password', {
      title: 'Reset Password',
      token,
      errors: []
    });
  } catch (err) {
    console.error(err);
    res.redirect('/forgot-password');
  }
});

// Reset Password process
router.post('/reset-password/:token', async (req, res) => {
  try {
    const { token } = req.params;
    const { password, confirmPassword } = req.body;

    // Validation
    let errors = [];

    if (!password || !confirmPassword) {
      errors.push({ msg: 'Please fill in all fields' });
    }

    if (password !== confirmPassword) {
      errors.push({ msg: 'Passwords do not match' });
    }

    if (password.length < 6) {
      errors.push({ msg: 'Password should be at least 6 characters' });
    }

    if (errors.length > 0) {
      return res.render('auth/reset-password', {
        title: 'Reset Password',
        token,
        errors
      });
    }

    // Find user by token and check if token is still valid
    const user = await User.findOne({
      resetPasswordToken: token,
      resetPasswordExpires: { $gt: Date.now() }
    });

    if (!user) {
      req.flash('error', 'Password reset token is invalid or has expired');
      return res.redirect('/forgot-password');
    }

    // Update password
    user.password = password;
    user.resetPasswordToken = null;
    user.resetPasswordExpires = null;

    await user.save();

    req.flash('success', 'Your password has been updated. You can now log in with your new password');
    res.redirect('/login');
  } catch (err) {
    console.error(err);
    res.redirect('/forgot-password');
  }
});

module.exports = router;
