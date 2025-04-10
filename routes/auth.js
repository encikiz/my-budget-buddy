const express = require('express');
const router = express.Router();
const passport = require('passport');
const User = require('../models/User');
const { ensureGuest } = require('../middleware/auth');

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

// Guest login
router.get('/guest-login', async (req, res) => {
  try {
    // Check if guest user exists
    let guestUser = await User.findOne({ email: 'guest@budgetbuddy.com' });

    // If guest user doesn't exist, create one
    if (!guestUser) {
      guestUser = new User({
        name: 'Guest User',
        email: 'guest@budgetbuddy.com',
        password: 'guestpassword123' // This will be hashed by the pre-save hook
      });

      await guestUser.save();
      console.log('Guest user created');
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

module.exports = router;
