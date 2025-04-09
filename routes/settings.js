const express = require('express');
const router = express.Router();
const { ensureAuthenticated } = require('../middleware/auth');
const User = require('../models/User');
const bcrypt = require('bcryptjs');
const { calculateCurrentBalance } = require('../utils/balance');

// Get settings page
router.get('/', ensureAuthenticated, async (req, res) => {
  try {
    // Calculate current balance
    const currentBalance = await calculateCurrentBalance(req.user.id);

    res.render('settings', {
      title: 'Settings',
      user: req.user,
      settings: req.user.settings,
      currentBalance
    });
  } catch (err) {
    console.error(err);
    res.status(500).render('error', {
      title: 'Error',
      message: 'Failed to load settings',
      user: req.user
    });
  }
});

// Update settings
router.post('/', ensureAuthenticated, async (req, res) => {
  try {
    const { currency, notifications } = req.body;

    // Update user settings
    await User.findByIdAndUpdate(req.user.id, {
      'settings.currency': currency,
      'settings.notifications': notifications === 'on'
    });

    // Get the updated user to reflect changes
    const updatedUser = await User.findById(req.user.id);

    // Calculate current balance
    const currentBalance = await calculateCurrentBalance(req.user.id);

    // Render the settings page with success message and updated user data
    res.render('settings', {
      title: 'Settings',
      user: updatedUser,
      settings: updatedUser.settings,
      currentBalance,
      success: 'Settings updated successfully'
    });
  } catch (err) {
    console.error(err);
    res.status(500).render('error', {
      title: 'Error',
      message: 'Failed to update settings',
      user: req.user
    });
  }
});

// Change password
router.post('/change-password', ensureAuthenticated, async (req, res) => {
  try {
    const { currentPassword, newPassword, confirmPassword } = req.body;

    // Validation
    if (!currentPassword || !newPassword || !confirmPassword) {
      const currentBalance = await calculateCurrentBalance(req.user.id);
      return res.status(400).render('settings', {
        title: 'Settings',
        user: req.user,
        settings: req.user.settings,
        error: 'Please fill in all password fields',
        currentBalance
      });
    }

    if (newPassword !== confirmPassword) {
      const currentBalance = await calculateCurrentBalance(req.user.id);
      return res.status(400).render('settings', {
        title: 'Settings',
        user: req.user,
        settings: req.user.settings,
        error: 'New passwords do not match',
        currentBalance
      });
    }

    if (newPassword.length < 6) {
      const currentBalance = await calculateCurrentBalance(req.user.id);
      return res.status(400).render('settings', {
        title: 'Settings',
        user: req.user,
        settings: req.user.settings,
        error: 'Password should be at least 6 characters',
        currentBalance
      });
    }

    // Check current password
    const user = await User.findById(req.user.id);
    const isMatch = await user.comparePassword(currentPassword);

    if (!isMatch) {
      const currentBalance = await calculateCurrentBalance(req.user.id);
      return res.status(400).render('settings', {
        title: 'Settings',
        user: req.user,
        settings: req.user.settings,
        error: 'Current password is incorrect',
        currentBalance
      });
    }

    // Update password
    user.password = newPassword;
    await user.save();

    const currentBalance = await calculateCurrentBalance(req.user.id);
    res.render('settings', {
      title: 'Settings',
      user: req.user,
      settings: req.user.settings,
      success: 'Password updated successfully',
      currentBalance
    });
  } catch (err) {
    console.error(err);
    res.status(500).render('error', {
      title: 'Error',
      message: 'Failed to change password',
      user: req.user
    });
  }
});

// Export data as CSV
router.get('/export/csv', ensureAuthenticated, async (req, res) => {
  try {
    const Income = require('../models/Income');
    const Expense = require('../models/Expense');
    const { Parser } = require('json2csv');

    // Get all income and expenses for the user
    const incomes = await Income.find({ user: req.user.id }).populate('source').sort({ date: -1 });
    const expenses = await Expense.find({ user: req.user.id }).populate('category').sort({ date: -1 });

    // Prepare data for CSV
    const incomeData = incomes.map(income => ({
      type: 'Income',
      date: income.date.toISOString().split('T')[0],
      amount: income.amount,
      category: income.source ? income.source.name : 'Uncategorized',
      description: income.description
    }));

    const expenseData = expenses.map(expense => ({
      type: 'Expense',
      date: expense.date.toISOString().split('T')[0],
      amount: expense.amount,
      category: expense.category ? expense.category.name : 'Uncategorized',
      description: expense.description
    }));

    // Combine data
    const allData = [...incomeData, ...expenseData];

    // Sort by date (newest first)
    allData.sort((a, b) => new Date(b.date) - new Date(a.date));

    // Convert to CSV
    const fields = ['type', 'date', 'amount', 'category', 'description'];
    const json2csvParser = new Parser({ fields });
    const csv = json2csvParser.parse(allData);

    // Set headers for file download
    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', 'attachment; filename=budget-buddy-export.csv');

    // Send CSV data
    res.send(csv);
  } catch (err) {
    console.error('CSV Export Error:', err);
    // Instead of rendering an error page, redirect back to settings with an error message
    const currentBalance = await calculateCurrentBalance(req.user.id);
    res.render('settings', {
      title: 'Settings',
      user: req.user,
      settings: req.user.settings,
      error: 'Failed to export data as CSV. Please try again.',
      currentBalance
    });
  }
});

// Export data as JSON
router.get('/export/json', ensureAuthenticated, async (req, res) => {
  try {
    const Income = require('../models/Income');
    const Expense = require('../models/Expense');

    // Get all income and expenses for the user
    const incomes = await Income.find({ user: req.user.id }).populate('source').sort({ date: -1 });
    const expenses = await Expense.find({ user: req.user.id }).populate('category').sort({ date: -1 });

    // Prepare data for JSON
    const incomeData = incomes.map(income => ({
      type: 'Income',
      date: income.date.toISOString().split('T')[0],
      amount: income.amount,
      category: income.source ? income.source.name : 'Uncategorized',
      description: income.description
    }));

    const expenseData = expenses.map(expense => ({
      type: 'Expense',
      date: expense.date.toISOString().split('T')[0],
      amount: expense.amount,
      category: expense.category ? expense.category.name : 'Uncategorized',
      description: expense.description
    }));

    // Combine data
    const exportData = {
      user: {
        name: req.user.name,
        email: req.user.email,
        exportDate: new Date().toISOString()
      },
      transactions: [...incomeData, ...expenseData].sort((a, b) => new Date(b.date) - new Date(a.date))
    };

    // Set headers for file download
    res.setHeader('Content-Type', 'application/json');
    res.setHeader('Content-Disposition', 'attachment; filename=budget-buddy-export.json');

    // Send JSON data
    res.send(JSON.stringify(exportData, null, 2));
  } catch (err) {
    console.error('JSON Export Error:', err);
    // Instead of rendering an error page, redirect back to settings with an error message
    const currentBalance = await calculateCurrentBalance(req.user.id);
    res.render('settings', {
      title: 'Settings',
      user: req.user,
      settings: req.user.settings,
      error: 'Failed to export data as JSON. Please try again.',
      currentBalance
    });
  }
});

module.exports = router;
