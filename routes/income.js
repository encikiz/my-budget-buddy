const express = require('express');
const router = express.Router();
const { ensureAuthenticated } = require('../middleware/auth');
const Income = require('../models/Income');
const Category = require('../models/Category');
const moment = require('moment');
const { calculateCurrentBalance } = require('../utils/balance');

// Get all income
router.get('/', ensureAuthenticated, async (req, res) => {
  try {
    // Get income for the user
    const incomes = await Income.find({ user: req.user.id })
      .populate('source')
      .sort({ date: -1 });

    // Get income categories for the user
    const categories = await Category.find({
      user: req.user.id,
      type: 'income'
    });

    // Calculate total income
    const totalIncome = incomes.reduce((sum, income) => sum + income.amount, 0);

    // Group income by source
    const incomeSources = [];
    const sourceMap = {};

    categories.forEach(category => {
      sourceMap[category._id.toString()] = {
        name: category.name,
        amount: 0,
        color: category.color
      };
    });

    incomes.forEach(income => {
      const sourceId = income.source._id.toString();
      if (sourceMap[sourceId]) {
        sourceMap[sourceId].amount += income.amount;
      }
    });

    Object.values(sourceMap).forEach(source => {
      incomeSources.push(source);
    });

    // Format income for display
    const incomeList = incomes.map(income => ({
      id: income._id,
      date: income.date,
      source: income.source.name,
      sourceColor: income.source.color,
      description: income.description,
      amount: income.amount
    }));

    // Calculate current balance
    const currentBalance = await calculateCurrentBalance(req.user.id);

    res.render('income', {
      title: 'Income',
      user: req.user,
      totalIncome,
      incomeSources,
      incomeList,
      categories,
      currentBalance
    });
  } catch (err) {
    console.error(err);
    res.status(500).render('error', {
      title: 'Error',
      message: 'Failed to load income data',
      user: req.user
    });
  }
});

// Add new income
router.post('/', ensureAuthenticated, async (req, res) => {
  try {
    const { amount, description, source, date } = req.body;

    // Validate input
    if (!amount || !description || !source) {
      return res.status(400).json({
        success: false,
        message: 'Please provide all required fields'
      });
    }

    // Create new income
    const newIncome = new Income({
      amount,
      description,
      source,
      date: date || Date.now(),
      user: req.user.id
    });

    await newIncome.save();

    res.redirect('/income');
  } catch (err) {
    console.error(err);
    res.status(500).render('error', {
      title: 'Error',
      message: 'Failed to create income',
      user: req.user
    });
  }
});

// Update income
router.put('/:id', ensureAuthenticated, async (req, res) => {
  try {
    const { amount, description, source, date } = req.body;

    // Find income and check ownership
    const income = await Income.findById(req.params.id);

    if (!income) {
      return res.status(404).json({
        success: false,
        message: 'Income not found'
      });
    }

    if (income.user.toString() !== req.user.id) {
      return res.status(401).json({
        success: false,
        message: 'Not authorized'
      });
    }

    // Update income
    income.amount = amount;
    income.description = description;
    income.source = source;
    income.date = date || income.date;

    await income.save();

    res.redirect('/income');
  } catch (err) {
    console.error(err);
    res.status(500).render('error', {
      title: 'Error',
      message: 'Failed to update income',
      user: req.user
    });
  }
});

// Delete income
router.delete('/:id', ensureAuthenticated, async (req, res) => {
  try {
    // Find income and check ownership
    const income = await Income.findById(req.params.id);

    if (!income) {
      return res.status(404).json({
        success: false,
        message: 'Income not found'
      });
    }

    if (income.user.toString() !== req.user.id) {
      return res.status(401).json({
        success: false,
        message: 'Not authorized'
      });
    }

    // Delete income
    await Income.findByIdAndDelete(req.params.id);

    res.redirect('/income');
  } catch (err) {
    console.error(err);
    res.status(500).render('error', {
      title: 'Error',
      message: 'Failed to delete income',
      user: req.user
    });
  }
});

module.exports = router;
