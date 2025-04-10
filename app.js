const express = require('express');
const path = require('path');
const mongoose = require('mongoose');
const session = require('express-session');
const MongoStore = require('connect-mongo');
const passport = require('passport');
const LocalStrategy = require('passport-local').Strategy;
const bcrypt = require('bcryptjs');
const flash = require('connect-flash');
const dotenv = require('dotenv');
const methodOverride = require('method-override');

// Load environment variables
dotenv.config();

// Import models
const User = require('./models/User');

// Initialize Express app
const app = express();

// Set the port
const PORT = process.env.PORT || 5002;

// Connect to MongoDB
mongoose.connect(process.env.MONGODB_URI, {
  useNewUrlParser: true,
  useUnifiedTopology: true
})
  .then(() => console.log('MongoDB connected'))
  .catch(err => console.error('MongoDB connection error:', err));

// Set up EJS as the view engine
app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));

// Middleware
app.use(express.urlencoded({ extended: false }));
app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));

// Method override middleware
app.use(methodOverride('_method'));

// Session middleware
app.use(session({
  secret: process.env.SESSION_SECRET,
  resave: false,
  saveUninitialized: false,
  store: MongoStore.create({ mongoUrl: process.env.MONGODB_URI }),
  cookie: { maxAge: 1000 * 60 * 60 * 24 } // 1 day
}));

// Flash middleware
app.use(flash());

// Passport middleware
app.use(passport.initialize());
app.use(passport.session());

// Configure Passport strategies
require('./config/passport')(passport);

// Global variables middleware
app.use((req, res, next) => {
  res.locals.user = req.user || null;
  res.locals.success_msg = req.flash('success') || '';
  res.locals.error_msg = req.flash('error') || '';
  next();
});

// Import routes
const authRoutes = require('./routes/auth');
const dashboardRoutes = require('./routes/dashboard');
const incomeRoutes = require('./routes/income');
const expenseRoutes = require('./routes/expenses');
const categoryRoutes = require('./routes/categories');
const settingsRoutes = require('./routes/settings');
const reportsRoutes = require('./routes/reports');
const { ensureAuthenticated } = require('./middleware/auth');

// Use routes - order matters for route matching
app.use('/', authRoutes); // Auth routes should be first to handle login/register
app.use('/dashboard', dashboardRoutes); // Dashboard routes with explicit path
app.use('/income', incomeRoutes);
app.use('/expenses', expenseRoutes);
app.use('/categories', categoryRoutes);
app.use('/settings', settingsRoutes);
app.use('/reports', reportsRoutes);

// All routes are now handled by their respective route files

// 404 handler
app.use((req, res) => {
  res.status(404).render('404', { title: 'Page Not Found' });
});

// Start the server if not being imported by Vercel
if (process.env.NODE_ENV !== 'production' || !process.env.VERCEL) {
  app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
  });
}

// Export the app for Vercel
module.exports = app;
