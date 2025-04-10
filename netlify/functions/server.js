const express = require('express');
const serverless = require('serverless-http');
const mongoose = require('mongoose');
const session = require('express-session');
const MongoStore = require('connect-mongo');
const passport = require('passport');
const LocalStrategy = require('passport-local').Strategy;
const bcrypt = require('bcryptjs');
const flash = require('connect-flash');
const path = require('path');
const methodOverride = require('method-override');
const dotenv = require('dotenv');

// For debugging
const DEBUG = true;
const log = (...args) => DEBUG && console.log(...args);

// Load environment variables
dotenv.config();

// Import models
const User = require('../../models/User');

// Initialize Express app
const app = express();

// Connect to MongoDB
log('Attempting to connect to MongoDB with URI:', process.env.MONGODB_URI ? 'URI exists' : 'URI is missing');

// Handle MongoDB connection
let dbConnected = false;
mongoose.connect(process.env.MONGODB_URI, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
  serverSelectionTimeoutMS: 5000 // 5 second timeout for server selection
})
  .then(() => {
    log('MongoDB connected successfully');
    dbConnected = true;
  })
  .catch(err => {
    log('MongoDB connection error:', err.message);
    // Continue execution even if DB connection fails
  });

// Set up EJS as the view engine
app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, '../../views'));

// Middleware
app.use(express.urlencoded({ extended: false }));
app.use(express.json());
app.use(express.static(path.join(__dirname, '../../public')));

// Method override middleware
app.use(methodOverride('_method'));

// Session middleware
log('Setting up session middleware with secret:', process.env.SESSION_SECRET ? 'Secret exists' : 'Using fallback secret');

const sessionConfig = {
  secret: process.env.SESSION_SECRET || 'fallback_secret_key',
  resave: false,
  saveUninitialized: false,
  cookie: {
    maxAge: 1000 * 60 * 60 * 24, // 1 day
    secure: false // Setting to false for Netlify, even in production
  }
};

// Only use MongoStore if DB is connected
if (dbConnected) {
  sessionConfig.store = MongoStore.create({
    mongoUrl: process.env.MONGODB_URI,
    ttl: 60 * 60 * 24 // 1 day
  });
  log('Using MongoDB for session storage');
} else {
  log('Using memory for session storage (MongoDB not connected)');
}

app.use(session(sessionConfig));

// Flash middleware
app.use(flash());

// Passport middleware
app.use(passport.initialize());
app.use(passport.session());

// Passport local strategy
passport.use(new LocalStrategy(
  { usernameField: 'email' },
  async (email, password, done) => {
    try {
      // Find user by email
      const user = await User.findOne({ email });

      if (!user) {
        return done(null, false, { message: 'Incorrect email or password' });
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

// Serialize and deserialize user
passport.serializeUser((user, done) => {
  done(null, user.id);
});

passport.deserializeUser(async (id, done) => {
  try {
    const user = await User.findById(id);
    done(null, user);
  } catch (err) {
    done(err);
  }
});

// Global variables middleware
app.use((req, res, next) => {
  res.locals.user = req.user || null;
  res.locals.success_msg = req.flash('success') || '';
  res.locals.error_msg = req.flash('error') || '';
  next();
});

// Import routes
const authRoutes = require('../../routes/auth');
const dashboardRoutes = require('../../routes/dashboard');
const incomeRoutes = require('../../routes/income');
const expenseRoutes = require('../../routes/expenses');
const categoryRoutes = require('../../routes/categories');
const settingsRoutes = require('../../routes/settings');
const reportsRoutes = require('../../routes/reports');

// Use routes
app.use('/', authRoutes);
app.use('/', dashboardRoutes);
app.use('/income', incomeRoutes);
app.use('/expenses', expenseRoutes);
app.use('/categories', categoryRoutes);
app.use('/settings', settingsRoutes);
app.use('/reports', reportsRoutes);

// Error handling middleware
app.use((err, req, res, next) => {
  log('Error encountered:', err.message);
  res.status(500).render('error', {
    title: 'Error',
    message: 'An unexpected error occurred',
    user: req.user
  });
});

// 404 handler
app.use((req, res) => {
  log('404 Not Found:', req.originalUrl);
  res.status(404).render('404', { title: 'Page Not Found' });
});

// Create the serverless handler
const handler = serverless(app);

// Export the handler with additional error handling
module.exports.handler = async (event, context) => {
  // Log the incoming request
  log('Incoming request:', event.path, event.httpMethod);

  try {
    // Call the serverless handler
    const result = await handler(event, context);
    log('Response status:', result.statusCode);
    return result;
  } catch (error) {
    log('Serverless handler error:', error.message);
    return {
      statusCode: 500,
      body: JSON.stringify({ error: 'Internal Server Error' })
    };
  }
};
