const express = require('express');
const router = express.Router();
const { ensureAuthenticated } = require('../middleware/auth');
const Expense = require('../models/Expense');
const Category = require('../models/Category');
const moment = require('moment');
const { calculateCurrentBalance } = require('../utils/balance');

// Get all expenses
router.get('/', ensureAuthenticated, async (req, res) => {
  try {
    // Get expenses for the user
    const expenses = await Expense.find({ user: req.user.id })
      .populate('category')
      .sort({ date: -1 });

    // Get expense categories for the user
    const categories = await Category.find({
      user: req.user.id,
      type: 'expense'
    });

    console.log('Expense categories:', categories);

    // Calculate total expenses
    const totalExpenses = expenses.reduce((sum, expense) => sum + expense.amount, 0);

    // Group expenses by category
    const expenseCategories = [];
    const categoryMap = {};

    categories.forEach(category => {
      categoryMap[category._id.toString()] = {
        name: category.name,
        amount: 0,
        budget: category.budgetLimit,
        color: category.color
      };
    });

    expenses.forEach(expense => {
      const categoryId = expense.category._id.toString();
      if (categoryMap[categoryId]) {
        categoryMap[categoryId].amount += expense.amount;
      }
    });

    Object.values(categoryMap).forEach(category => {
      expenseCategories.push(category);
    });

    // Format expenses for display
    const expenseList = expenses.map(expense => ({
      id: expense._id,
      date: expense.date,
      category: expense.category.name,
      category_id: expense.category._id,
      categoryColor: expense.category.color,
      description: expense.description,
      amount: expense.amount
    }));

    // Calculate current balance
    const currentBalance = await calculateCurrentBalance(req.user.id);

    res.render('expenses', {
      title: 'Expenses',
      user: req.user,
      totalExpenses,
      expenseCategories,
      expenseList,
      categories,
      currentBalance
    });
  } catch (err) {
    console.error(err);
    res.status(500).render('error', {
      title: 'Error',
      message: 'Failed to load expenses',
      user: req.user
    });
  }
});

// Add new expense
router.post('/', ensureAuthenticated, async (req, res) => {
  try {
    const { amount, description, category, date } = req.body;

    // Validate input
    if (!amount || !description || !category) {
      return res.status(400).json({
        success: false,
        message: 'Please provide all required fields'
      });
    }

    // Create new expense
    const newExpense = new Expense({
      amount,
      description,
      category,
      date: date || Date.now(),
      user: req.user.id
    });

    await newExpense.save();

    res.redirect('/expenses');
  } catch (err) {
    console.error(err);
    res.status(500).render('error', {
      title: 'Error',
      message: 'Failed to create expense',
      user: req.user
    });
  }
});

// Update expense
router.put('/:id', ensureAuthenticated, async (req, res) => {
  try {
    const { amount, description, category, date } = req.body;

    // Find expense and check ownership
    const expense = await Expense.findById(req.params.id);

    if (!expense) {
      return res.status(404).json({
        success: false,
        message: 'Expense not found'
      });
    }

    if (expense.user.toString() !== req.user.id) {
      return res.status(401).json({
        success: false,
        message: 'Not authorized'
      });
    }

    // Update expense
    expense.amount = amount;
    expense.description = description;
    expense.category = category;
    expense.date = date || expense.date;

    await expense.save();

    res.redirect('/expenses');
  } catch (err) {
    console.error(err);
    res.status(500).render('error', {
      title: 'Error',
      message: 'Failed to update expense',
      user: req.user
    });
  }
});

// Delete expense
router.delete('/:id', ensureAuthenticated, async (req, res) => {
  try {
    // Find expense and check ownership
    const expense = await Expense.findById(req.params.id);

    if (!expense) {
      return res.status(404).json({
        success: false,
        message: 'Expense not found'
      });
    }

    if (expense.user.toString() !== req.user.id) {
      return res.status(401).json({
        success: false,
        message: 'Not authorized'
      });
    }

    // Delete expense
    await Expense.deleteOne({ _id: expense._id });

    return res.redirect('/expenses');
  } catch (err) {
    console.error('Delete expense error:', err);
    return res.status(500).json({
      success: false,
      message: 'Failed to delete expense'
    });
  }
});

module.exports = router;
