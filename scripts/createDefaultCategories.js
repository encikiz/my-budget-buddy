const mongoose = require('mongoose');
const Category = require('../models/Category');
const User = require('../models/User');
const dotenv = require('dotenv');

// Load environment variables
dotenv.config();

// Connect to MongoDB
mongoose.connect(process.env.MONGODB_URI, {
  useNewUrlParser: true,
  useUnifiedTopology: true
})
  .then(() => console.log('MongoDB connected'))
  .catch(err => console.error('MongoDB connection error:', err));

const createDefaultCategories = async () => {
  try {
    // Get all users
    const users = await User.find();
    
    // Default expense categories
    const defaultExpenseCategories = [
      { name: 'Housing', type: 'expense', color: 'var(--housing-color)', icon: 'fas fa-home' },
      { name: 'Utilities', type: 'expense', color: 'var(--utilities-color)', icon: 'fas fa-bolt' },
      { name: 'Food', type: 'expense', color: 'var(--food-color)', icon: 'fas fa-utensils' },
      { name: 'Transportation', type: 'expense', color: 'var(--transportation-color)', icon: 'fas fa-car' },
      { name: 'Entertainment', type: 'expense', color: 'var(--entertainment-color)', icon: 'fas fa-film' },
      { name: 'Loans', type: 'expense', color: 'var(--loans-color)', icon: 'fas fa-money-bill' },
      { name: 'Other', type: 'expense', color: 'var(--other-color)', icon: 'fas fa-shopping-bag' }
    ];
    
    // Default income categories
    const defaultIncomeCategories = [
      { name: 'Salary', type: 'income', color: 'var(--salary-color)', icon: 'fas fa-briefcase' },
      { name: 'Freelance', type: 'income', color: 'var(--freelance-color)', icon: 'fas fa-laptop' },
      { name: 'Investments', type: 'income', color: 'var(--investments-color)', icon: 'fas fa-chart-line' }
    ];
    
    // Create default categories for each user
    for (const user of users) {
      console.log(`Creating default categories for user: ${user.email}`);
      
      // Check if user already has expense categories
      const existingExpenseCategories = await Category.find({ user: user._id, type: 'expense' });
      
      if (existingExpenseCategories.length === 0) {
        console.log('Creating default expense categories');
        
        // Create default expense categories
        for (const category of defaultExpenseCategories) {
          await Category.create({
            name: category.name,
            type: category.type,
            color: category.color,
            icon: category.icon,
            user: user._id
          });
        }
      } else {
        console.log(`User already has ${existingExpenseCategories.length} expense categories`);
      }
      
      // Check if user already has income categories
      const existingIncomeCategories = await Category.find({ user: user._id, type: 'income' });
      
      if (existingIncomeCategories.length === 0) {
        console.log('Creating default income categories');
        
        // Create default income categories
        for (const category of defaultIncomeCategories) {
          await Category.create({
            name: category.name,
            type: category.type,
            color: category.color,
            icon: category.icon,
            user: user._id
          });
        }
      } else {
        console.log(`User already has ${existingIncomeCategories.length} income categories`);
      }
    }
    
    console.log('Default categories created successfully');
    mongoose.disconnect();
  } catch (err) {
    console.error('Error creating default categories:', err);
    mongoose.disconnect();
  }
};

createDefaultCategories();
