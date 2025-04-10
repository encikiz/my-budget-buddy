const express = require('express');
const router = express.Router();
const { ensureAuthenticated } = require('../middleware/auth');
const Expense = require('../models/Expense');
const Income = require('../models/Income');
const Category = require('../models/Category');
const moment = require('moment');

// Dashboard route
router.get('/', ensureAuthenticated, async (req, res) => {
  try {
    // Get current month and year
    const now = new Date();
    const currentMonth = now.getMonth();
    const currentYear = now.getFullYear();

    // Create date range for current month
    const startDate = new Date(currentYear, currentMonth, 1);
    const endDate = new Date(currentYear, currentMonth + 1, 0);

    // Get expenses for current month
    const expenses = await Expense.find({
      user: req.user.id,
      date: { $gte: startDate, $lte: endDate }
    }).populate('category');

    // Get income for current month
    const incomes = await Income.find({
      user: req.user.id,
      date: { $gte: startDate, $lte: endDate }
    }).populate('source');

    // Calculate totals
    const totalExpenses = expenses.reduce((sum, expense) => sum + expense.amount, 0);
    const totalIncome = incomes.reduce((sum, income) => sum + income.amount, 0);
    const savings = totalIncome - totalExpenses;
    const savingsRatio = totalIncome > 0 ? (savings / totalIncome) * 100 : 0;

    // Group expenses by category
    const expensesByCategory = {};
    expenses.forEach(expense => {
      const categoryName = expense.category.name;
      if (!expensesByCategory[categoryName]) {
        expensesByCategory[categoryName] = {
          amount: 0,
          color: expense.category.color
        };
      }
      expensesByCategory[categoryName].amount += expense.amount;
    });

    // Group income by source
    const incomeBySource = {};
    incomes.forEach(income => {
      const sourceName = income.source.name;
      if (!incomeBySource[sourceName]) {
        incomeBySource[sourceName] = {
          amount: 0,
          color: income.source.color
        };
      }
      incomeBySource[sourceName].amount += income.amount;
    });

    // Get recent transactions (combined expenses and income)
    const recentExpenses = await Expense.find({ user: req.user.id })
      .populate('category')
      .sort({ date: -1 })
      .limit(5);

    const recentIncome = await Income.find({ user: req.user.id })
      .populate('source')
      .sort({ date: -1 })
      .limit(5);

    const recentTransactions = [...recentExpenses, ...recentIncome]
      .sort((a, b) => new Date(b.date) - new Date(a.date))
      .slice(0, 5)
      .map(transaction => {
        if (transaction.category) {
          return {
            type: 'expense',
            date: transaction.date,
            description: transaction.description,
            category: transaction.category.name,
            amount: transaction.amount,
            color: transaction.category.color
          };
        } else {
          return {
            type: 'income',
            date: transaction.date,
            description: transaction.description,
            source: transaction.source.name,
            amount: transaction.amount,
            color: transaction.source.color
          };
        }
      });

    // Get monthly data for the past 6 months
    const monthlyData = [];

    for (let i = 5; i >= 0; i--) {
      const month = new Date(currentYear, currentMonth - i, 1);
      const monthName = month.toLocaleString('default', { month: 'long' });

      const monthStartDate = new Date(month.getFullYear(), month.getMonth(), 1);
      const monthEndDate = new Date(month.getFullYear(), month.getMonth() + 1, 0);

      // Get expenses and income for this month
      const monthExpenses = await Expense.find({
        user: req.user.id,
        date: { $gte: monthStartDate, $lte: monthEndDate }
      });

      const monthIncome = await Income.find({
        user: req.user.id,
        date: { $gte: monthStartDate, $lte: monthEndDate }
      });

      const monthTotalExpenses = monthExpenses.reduce((sum, expense) => sum + expense.amount, 0);
      const monthTotalIncome = monthIncome.reduce((sum, income) => sum + income.amount, 0);

      monthlyData.push({
        month: monthName,
        expenses: monthTotalExpenses,
        income: monthTotalIncome
      });
    }

    res.render('dashboard', {
      title: 'Dashboard',
      user: req.user,
      totalExpenses,
      totalIncome,
      savings,
      savingsRatio,
      expensesByCategory,
      incomeBySource,
      recentTransactions,
      monthlyData,
      currentMonth: startDate.toLocaleString('default', { month: 'long' }),
      currentYear,
      currentBalance: totalIncome - totalExpenses
    });
  } catch (err) {
    console.error(err);
    res.status(500).render('error', {
      title: 'Error',
      message: 'Failed to load dashboard data',
      user: req.user
    });
  }
});

module.exports = router;
