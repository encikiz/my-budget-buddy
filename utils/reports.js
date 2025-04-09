const Expense = require('../models/Expense');
const Income = require('../models/Income');
const Category = require('../models/Category');
const moment = require('moment');

/**
 * Get monthly data for a specific year
 * @param {string} userId - The user ID
 * @param {number} year - The year to get data for
 * @returns {Promise<Array>} - Array of monthly data
 */
async function getMonthlyDataForYear(userId, year) {
  const monthlyData = [];
  
  for (let month = 0; month < 12; month++) {
    const monthStartDate = new Date(year, month, 1);
    const monthEndDate = new Date(year, month + 1, 0);
    const monthName = monthStartDate.toLocaleString('default', { month: 'long' });
    
    // Get expenses and income for this month
    const monthExpenses = await Expense.find({
      user: userId,
      date: { $gte: monthStartDate, $lte: monthEndDate }
    });
    
    const monthIncome = await Income.find({
      user: userId,
      date: { $gte: monthStartDate, $lte: monthEndDate }
    });
    
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
  
  return monthlyData;
}

/**
 * Get expense breakdown by category for a date range
 * @param {string} userId - The user ID
 * @param {Date} startDate - Start date
 * @param {Date} endDate - End date
 * @returns {Promise<Object>} - Object with category breakdown
 */
async function getExpensesByCategory(userId, startDate, endDate) {
  // Get all expenses in the date range
  const expenses = await Expense.find({
    user: userId,
    date: { $gte: startDate, $lte: endDate }
  }).populate('category');
  
  // Group expenses by category
  const expensesByCategory = {};
  
  for (const expense of expenses) {
    if (!expense.category) continue;
    
    const categoryName = expense.category.name;
    if (!expensesByCategory[categoryName]) {
      expensesByCategory[categoryName] = {
        amount: 0,
        color: expense.category.color
      };
    }
    expensesByCategory[categoryName].amount += expense.amount;
  }
  
  return expensesByCategory;
}

/**
 * Get yearly totals for a specific year
 * @param {string} userId - The user ID
 * @param {number} year - The year to get data for
 * @returns {Promise<Object>} - Object with yearly totals
 */
async function getYearlyTotals(userId, year) {
  const startDate = new Date(year, 0, 1);
  const endDate = new Date(year, 11, 31, 23, 59, 59);
  
  // Get all expenses and income for the year
  const expenses = await Expense.find({
    user: userId,
    date: { $gte: startDate, $lte: endDate }
  });
  
  const income = await Income.find({
    user: userId,
    date: { $gte: startDate, $lte: endDate }
  });
  
  const totalExpenses = expenses.reduce((sum, expense) => sum + expense.amount, 0);
  const totalIncome = income.reduce((sum, income) => sum + income.amount, 0);
  const totalSavings = totalIncome - totalExpenses;
  const savingsRatio = totalIncome > 0 ? (totalSavings / totalIncome) * 100 : 0;
  
  return {
    yearlyExpenses: totalExpenses,
    yearlyIncome: totalIncome,
    yearlySavings: totalSavings,
    yearlySavingsRatio: savingsRatio
  };
}

module.exports = {
  getMonthlyDataForYear,
  getExpensesByCategory,
  getYearlyTotals
};
