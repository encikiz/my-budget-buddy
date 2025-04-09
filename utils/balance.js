const Income = require('../models/Income');
const Expense = require('../models/Expense');

/**
 * Calculate the current balance for a user
 * @param {string} userId - The user ID
 * @returns {Promise<number>} - The current balance
 */
async function calculateCurrentBalance(userId) {
  try {
    // Get all income
    const incomes = await Income.find({ user: userId });
    
    // Get all expenses
    const expenses = await Expense.find({ user: userId });
    
    // Calculate totals
    const totalIncome = incomes.reduce((sum, income) => sum + income.amount, 0);
    const totalExpenses = expenses.reduce((sum, expense) => sum + expense.amount, 0);
    
    // Calculate balance
    const balance = totalIncome - totalExpenses;
    
    return balance;
  } catch (error) {
    console.error('Error calculating balance:', error);
    return 0;
  }
}

module.exports = {
  calculateCurrentBalance
};
