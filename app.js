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
const authRoutes = require('./routes/auth');
const dashboardRoutes = require('./routes/dashboard');
const incomeRoutes = require('./routes/income');
const expenseRoutes = require('./routes/expenses');
const categoryRoutes = require('./routes/categories');
const settingsRoutes = require('./routes/settings');
const { calculateCurrentBalance } = require('./utils/balance');
const { getMonthlyDataForYear, getExpensesByCategory, getYearlyTotals } = require('./utils/reports');
const { ensureAuthenticated } = require('./middleware/auth');

// Use routes
app.use('/', authRoutes);
app.use('/', dashboardRoutes);
app.use('/income', incomeRoutes);
app.use('/expenses', expenseRoutes);
app.use('/categories', categoryRoutes);
app.use('/settings', settingsRoutes);

// Settings route is now handled by settingsRoutes

// Reports route
app.get('/reports', ensureAuthenticated, async (req, res) => {
  try {
    // Calculate current balance
    const currentBalance = req.user ? await calculateCurrentBalance(req.user.id) : 0;

    // Default values for date range (current year)
    const currentYear = new Date().getFullYear();
    const previousYear = currentYear - 1;
    const defaultStartDate = new Date(currentYear, 0, 1);
    const defaultEndDate = new Date(currentYear, 11, 31);

    // Get date range from query parameters or use defaults
    const startDate = req.query.startDate
      ? new Date(req.query.startDate)
      : defaultStartDate;

    const endDate = req.query.endDate
      ? new Date(req.query.endDate)
      : defaultEndDate;

    // Check if comparison view is requested
    const showComparison = req.query.compare === 'true';

    // Format dates for display in the date picker
    const formattedStartDate = startDate.toISOString().split('T')[0];
    const formattedEndDate = endDate.toISOString().split('T')[0];

    // Get real data for current year
    const currentYearMonthlyData = await getMonthlyDataForYear(req.user.id, currentYear);

    // Get expense breakdown by category
    const yearlyExpensesByCategory = await getExpensesByCategory(
      req.user.id,
      new Date(currentYear, 0, 1),
      new Date(currentYear, 11, 31, 23, 59, 59)
    );

    // Get yearly totals
    const yearlyTotals = await getYearlyTotals(req.user.id, currentYear);

    // For comparison view, get previous year data
    let previousYearMonthlyData = [];
    let previousYearTotals = {};

    if (showComparison) {
      previousYearMonthlyData = await getMonthlyDataForYear(req.user.id, previousYear);
      previousYearTotals = await getYearlyTotals(req.user.id, previousYear);
    }

    res.render('reports', {
      title: 'Reports',
      monthlyData: currentYearMonthlyData,
      yearlyExpensesByCategory,
      yearlyIncome: yearlyTotals.yearlyIncome,
      yearlyExpenses: yearlyTotals.yearlyExpenses,
      yearlySavings: yearlyTotals.yearlySavings,
      yearlySavingsRatio: yearlyTotals.yearlySavingsRatio,
      currentYear,
      previousYear,
      startDate: formattedStartDate,
      endDate: formattedEndDate,
      currentBalance,
      showComparison,
      previousYearMonthlyData,
      previousYearTotals
    });
  } catch (err) {
    console.error(err);
    res.status(500).render('error', {
      title: 'Error',
      message: 'Failed to load reports',
      user: req.user
    });
  }
});

// 404 handler
app.use((req, res) => {
  res.status(404).render('404', { title: 'Page Not Found' });
});

// Start the server
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
