const express = require('express');
const router = express.Router();
const { ensureAuthenticated } = require('../middleware/auth');
const Category = require('../models/Category');
const Expense = require('../models/Expense');
const Income = require('../models/Income');
const { calculateCurrentBalance } = require('../utils/balance');

// Get all categories
router.get('/', ensureAuthenticated, async (req, res) => {
  try {
    // Get expense categories
    const expenseCategories = await Category.find({
      user: req.user.id,
      type: 'expense'
    });

    // Get income categories
    const incomeCategories = await Category.find({
      user: req.user.id,
      type: 'income'
    });

    // Get all expenses and income
    const expenses = await Expense.find({ user: req.user.id });
    const incomes = await Income.find({ user: req.user.id });

    // Calculate spent amount for each expense category
    const expenseCategoriesWithSpent = expenseCategories.map(category => {
      const categoryExpenses = expenses.filter(expense =>
        expense.category.toString() === category._id.toString()
      );

      const spent = categoryExpenses.reduce((sum, expense) => sum + expense.amount, 0);

      return {
        id: category._id,
        name: category.name,
        budget: category.budgetLimit,
        spent,
        color: category.color,
        icon: category.icon
      };
    });

    // Calculate total for each income category
    const incomeCategoriesWithTotal = incomeCategories.map(category => {
      const categoryIncomes = incomes.filter(income =>
        income.source.toString() === category._id.toString()
      );

      const total = categoryIncomes.reduce((sum, income) => sum + income.amount, 0);

      return {
        id: category._id,
        name: category.name,
        description: category.description,
        total,
        color: category.color,
        icon: category.icon
      };
    });

    // Calculate current balance
    const currentBalance = await calculateCurrentBalance(req.user.id);

    res.render('categories', {
      title: 'Categories',
      user: req.user,
      expenseCategories: expenseCategoriesWithSpent,
      incomeCategories: incomeCategoriesWithTotal,
      currentBalance
    });
  } catch (err) {
    console.error(err);
    res.status(500).render('error', {
      title: 'Error',
      message: 'Failed to load categories',
      user: req.user
    });
  }
});

// Add new category
router.post('/', ensureAuthenticated, async (req, res) => {
  console.log('POST /categories - Route hit');
  console.log('User:', req.user);
  console.log('Request body:', req.body);
  console.log('Request headers:', req.headers);
  try {
    const { name, type, budgetLimit, incomeBudget, description, color, icon } = req.body;
    console.log('Request body parsed:', { name, type, budgetLimit, incomeBudget, description, color, icon });

    // Validate input
    if (!name || !type) {
      return res.status(400).json({
        success: false,
        message: 'Please provide all required fields'
      });
    }

    // Create new category
    const newCategory = new Category({
      name,
      type,
      budgetLimit: type === 'income' ? (incomeBudget || 0) : (budgetLimit || 0),
      description: description || '',
      color: color || '#3a56e4',
      icon: icon || 'fas fa-tag',
      user: req.user.id
    });

    console.log('Creating new category with data:', {
      name,
      type,
      budgetLimit: type === 'income' ? (incomeBudget || 0) : (budgetLimit || 0),
      description: description || '',
      color: color || '#3a56e4',
      icon: icon || 'fas fa-tag'
    });

    await newCategory.save();

    console.log('Category created successfully:', newCategory);

    // Check if the request expects JSON or HTML response
    const acceptsJson = req.headers['content-type'] === 'application/json';

    if (acceptsJson) {
      return res.status(201).json({
        success: true,
        message: 'Category created successfully',
        category: newCategory
      });
    } else {
      // For traditional form submissions, redirect to the categories page
      return res.redirect('/categories');
    }
  } catch (err) {
    console.error('Create category error:', err);

    // Check if the request expects JSON or HTML response
    const acceptsJson = req.headers['content-type'] === 'application/json';

    if (acceptsJson) {
      return res.status(500).json({
        success: false,
        message: 'Failed to create category'
      });
    } else {
      // For traditional form submissions, render an error page
      return res.status(500).render('error', {
        title: 'Error',
        message: 'Failed to create category',
        user: req.user
      });
    }
  }
});

// Update category
router.put('/:id', ensureAuthenticated, async (req, res) => {
  try {
    const { name, type, budgetLimit, description, color, icon } = req.body;
    console.log('Update category request:', req.body);

    // Find category and check ownership
    const category = await Category.findById(req.params.id);

    if (!category) {
      return res.status(404).json({
        success: false,
        message: 'Category not found'
      });
    }

    if (category.user.toString() !== req.user.id) {
      return res.status(401).json({
        success: false,
        message: 'Not authorized'
      });
    }

    // Update category
    category.name = name;
    category.type = type;
    category.budgetLimit = type === 'expense' ? budgetLimit : 0;
    category.description = description || '';
    category.color = color || category.color;
    category.icon = icon || category.icon;

    await category.save();

    console.log('Category updated successfully:', category);

    // Check if the request expects JSON or HTML response
    const acceptsJson = req.headers['content-type'] === 'application/json';

    if (acceptsJson) {
      return res.status(200).json({
        success: true,
        message: 'Category updated successfully',
        category
      });
    } else {
      // For traditional form submissions, redirect to the categories page
      return res.redirect('/categories');
    }
  } catch (err) {
    console.error('Update category error:', err);

    // Check if the request expects JSON or HTML response
    const acceptsJson = req.headers['content-type'] === 'application/json';

    if (acceptsJson) {
      return res.status(500).json({
        success: false,
        message: 'Failed to update category'
      });
    } else {
      // For traditional form submissions, render an error page
      return res.status(500).render('error', {
        title: 'Error',
        message: 'Failed to update category',
        user: req.user
      });
    }
  }
});

// Delete category
router.delete('/:id', ensureAuthenticated, async (req, res) => {
  try {
    // Find category and check ownership
    const category = await Category.findById(req.params.id);

    if (!category) {
      return res.status(404).json({
        success: false,
        message: 'Category not found'
      });
    }

    if (category.user.toString() !== req.user.id) {
      return res.status(401).json({
        success: false,
        message: 'Not authorized'
      });
    }

    // Check if category is in use
    if (category.type === 'expense') {
      const expenseCount = await Expense.countDocuments({
        category: category._id,
        user: req.user.id
      });

      if (expenseCount > 0) {
        return res.status(400).json({
          success: false,
          message: 'Cannot delete category that is in use'
        });
      }
    } else {
      const incomeCount = await Income.countDocuments({
        source: category._id,
        user: req.user.id
      });

      if (incomeCount > 0) {
        return res.status(400).json({
          success: false,
          message: 'Cannot delete category that is in use'
        });
      }
    }

    // Delete category
    await Category.deleteOne({ _id: category._id });

    console.log('Category deleted successfully:', category._id);

    // Check if the request expects JSON or HTML response
    const acceptsJson = req.headers['content-type'] === 'application/json';

    if (acceptsJson) {
      return res.status(200).json({
        success: true,
        message: 'Category deleted successfully'
      });
    } else {
      // For traditional form submissions, redirect to the categories page
      return res.redirect('/categories');
    }
  } catch (err) {
    console.error('Delete category error:', err);

    // Check if the request expects JSON or HTML response
    const acceptsJson = req.headers['content-type'] === 'application/json';

    if (acceptsJson) {
      return res.status(500).json({
        success: false,
        message: 'Failed to delete category'
      });
    } else {
      // For traditional form submissions, render an error page
      return res.status(500).render('error', {
        title: 'Error',
        message: 'Failed to delete category',
        user: req.user
      });
    }
  }
});

module.exports = router;
