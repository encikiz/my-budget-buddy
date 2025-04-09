const express = require('express');
const router = express.Router();
const { ensureAuthenticated } = require('../middleware/auth');
const Expense = require('../models/Expense');
const Income = require('../models/Income');
const Category = require('../models/Category');
const moment = require('moment');
const { Parser } = require('json2csv');
const fs = require('fs');
const path = require('path');
const { calculateCurrentBalance } = require('../utils/balance');

// Get reports page
router.get('/', ensureAuthenticated, async (req, res) => {
  try {
    // Get date range from query parameters or use current year
    const startDate = req.query.startDate
      ? new Date(req.query.startDate)
      : new Date(new Date().getFullYear(), 0, 1);

    const endDate = req.query.endDate
      ? new Date(req.query.endDate)
      : new Date(new Date().getFullYear(), 11, 31);

    // Format dates for display
    const formattedStartDate = moment(startDate).format('YYYY-MM-DD');
    const formattedEndDate = moment(endDate).format('YYYY-MM-DD');

    // Get expenses and income within date range
    const expenses = await Expense.find({
      user: req.user.id,
      date: { $gte: startDate, $lte: endDate }
    }).populate('category');

    const incomes = await Income.find({
      user: req.user.id,
      date: { $gte: startDate, $lte: endDate }
    }).populate('source');

    // Calculate yearly totals
    const yearlyExpenses = expenses.reduce((sum, expense) => sum + expense.amount, 0);
    const yearlyIncome = incomes.reduce((sum, income) => sum + income.amount, 0);
    const yearlySavings = yearlyIncome - yearlyExpenses;
    const yearlySavingsRatio = yearlyIncome > 0 ? (yearlySavings / yearlyIncome) * 100 : 0;

    // Group expenses by category
    const yearlyExpensesByCategory = {};
    expenses.forEach(expense => {
      const categoryName = expense.category.name;
      if (!yearlyExpensesByCategory[categoryName]) {
        yearlyExpensesByCategory[categoryName] = {
          amount: 0,
          color: expense.category.color
        };
      }
      yearlyExpensesByCategory[categoryName].amount += expense.amount;
    });

    // Get monthly data
    const monthlyData = [];

    // Determine the number of months to display based on date range
    const months = moment(endDate).diff(moment(startDate), 'months') + 1;
    const startMonth = startDate.getMonth();
    const startYear = startDate.getFullYear();

    for (let i = 0; i < months; i++) {
      const month = new Date(startYear, startMonth + i, 1);
      const monthName = month.toLocaleString('default', { month: 'long' });

      const monthStartDate = new Date(month.getFullYear(), month.getMonth(), 1);
      const monthEndDate = new Date(month.getFullYear(), month.getMonth() + 1, 0);

      // Filter expenses and income for this month
      const monthExpenses = expenses.filter(expense => {
        const expenseDate = new Date(expense.date);
        return expenseDate >= monthStartDate && expenseDate <= monthEndDate;
      });

      const monthIncome = incomes.filter(income => {
        const incomeDate = new Date(income.date);
        return incomeDate >= monthStartDate && incomeDate <= monthEndDate;
      });

      // Calculate totals
      const monthTotalExpenses = monthExpenses.reduce((sum, expense) => sum + expense.amount, 0);
      const monthTotalIncome = monthIncome.reduce((sum, income) => sum + income.amount, 0);
      const monthSavings = monthTotalIncome - monthTotalExpenses;

      monthlyData.push({
        month: monthName,
        expenses: monthTotalExpenses,
        income: monthTotalIncome,
        savings: monthSavings
      });
    }

    // Calculate current balance
    const currentBalance = await calculateCurrentBalance(req.user.id);

    res.render('reports', {
      title: 'Reports',
      user: req.user,
      monthlyData,
      yearlyExpenses,
      yearlyIncome,
      yearlySavings,
      yearlySavingsRatio,
      yearlyExpensesByCategory,
      startDate: formattedStartDate,
      endDate: formattedEndDate,
      currentYear: new Date().getFullYear(),
      currentBalance
    });
  } catch (err) {
    console.error(err);
    res.status(500).render('error', {
      title: 'Error',
      message: 'Failed to load reports data',
      user: req.user
    });
  }
});

// Export data as CSV
router.get('/export/csv', ensureAuthenticated, async (req, res) => {
  try {
    // Get date range from query parameters or use current year
    const startDate = req.query.startDate
      ? new Date(req.query.startDate)
      : new Date(new Date().getFullYear(), 0, 1);

    const endDate = req.query.endDate
      ? new Date(req.query.endDate)
      : new Date(new Date().getFullYear(), 11, 31);

    // Get expenses and income within date range
    const expenses = await Expense.find({
      user: req.user.id,
      date: { $gte: startDate, $lte: endDate }
    }).populate('category');

    const incomes = await Income.find({
      user: req.user.id,
      date: { $gte: startDate, $lte: endDate }
    }).populate('source');

    // Format data for CSV
    const expensesData = expenses.map(expense => ({
      type: 'Expense',
      date: moment(expense.date).format('YYYY-MM-DD'),
      category: expense.category.name,
      description: expense.description,
      amount: expense.amount
    }));

    const incomesData = incomes.map(income => ({
      type: 'Income',
      date: moment(income.date).format('YYYY-MM-DD'),
      category: income.source.name,
      description: income.description,
      amount: income.amount
    }));

    const data = [...expensesData, ...incomesData].sort((a, b) =>
      new Date(a.date) - new Date(b.date)
    );

    // Define fields for CSV
    const fields = ['type', 'date', 'category', 'description', 'amount'];

    // Create CSV parser
    const json2csvParser = new Parser({ fields });
    const csv = json2csvParser.parse(data);

    // Set headers for download
    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', 'attachment; filename=budget-data.csv');

    // Send CSV data
    res.send(csv);
  } catch (err) {
    console.error(err);
    res.status(500).render('error', {
      title: 'Error',
      message: 'Failed to export data as CSV',
      user: req.user
    });
  }
});

// Export data as JSON
router.get('/export/json', ensureAuthenticated, async (req, res) => {
  try {
    // Get date range from query parameters or use current year
    const startDate = req.query.startDate
      ? new Date(req.query.startDate)
      : new Date(new Date().getFullYear(), 0, 1);

    const endDate = req.query.endDate
      ? new Date(req.query.endDate)
      : new Date(new Date().getFullYear(), 11, 31);

    // Get expenses and income within date range
    const expenses = await Expense.find({
      user: req.user.id,
      date: { $gte: startDate, $lte: endDate }
    }).populate('category');

    const incomes = await Income.find({
      user: req.user.id,
      date: { $gte: startDate, $lte: endDate }
    }).populate('source');

    // Format data for JSON
    const expensesData = expenses.map(expense => ({
      type: 'Expense',
      date: moment(expense.date).format('YYYY-MM-DD'),
      category: expense.category.name,
      description: expense.description,
      amount: expense.amount
    }));

    const incomesData = incomes.map(income => ({
      type: 'Income',
      date: moment(income.date).format('YYYY-MM-DD'),
      category: income.source.name,
      description: income.description,
      amount: income.amount
    }));

    const data = {
      user: req.user.name,
      dateRange: {
        start: moment(startDate).format('YYYY-MM-DD'),
        end: moment(endDate).format('YYYY-MM-DD')
      },
      transactions: [...expensesData, ...incomesData].sort((a, b) =>
        new Date(a.date) - new Date(b.date)
      )
    };

    // Set headers for download
    res.setHeader('Content-Type', 'application/json');
    res.setHeader('Content-Disposition', 'attachment; filename=budget-data.json');

    // Send JSON data
    res.send(JSON.stringify(data, null, 2));
  } catch (err) {
    console.error(err);
    res.status(500).render('error', {
      title: 'Error',
      message: 'Failed to export data as JSON',
      user: req.user
    });
  }
});

module.exports = router;
