const express = require('express');
const path = require('path');

// Initialize Express app
const app = express();

// Set the port
const PORT = 5000;

// Set up EJS as the view engine
app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));

// Middleware
app.use(express.urlencoded({ extended: false }));
app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));

// Routes
app.get('/', (req, res) => {
  res.render('dashboard', { 
    title: 'Dashboard',
    currentBalance: 5000,
    totalIncome: 5500,
    totalExpenses: 3800,
    savings: 1700
  });
});

// Settings route
app.get('/settings', (req, res) => {
  res.render('settings', {
    title: 'Settings',
    settings: {
      currency: 'MYR',
      theme: 'dark',
      language: 'en',
      notifications: true
    }
  });
});

// Reports route
app.get('/reports', (req, res) => {
  // Sample data for reports
  const monthlyData = [
    { month: 'January', income: 4500, expenses: 3200, savings: 1300 },
    { month: 'February', income: 4800, expenses: 3500, savings: 1300 },
    { month: 'March', income: 5000, expenses: 3800, savings: 1200 },
    { month: 'April', income: 4700, expenses: 3300, savings: 1400 },
    { month: 'May', income: 5200, expenses: 3900, savings: 1300 },
    { month: 'June', income: 5500, expenses: 4100, savings: 1400 }
  ];
  
  const yearlyExpensesByCategory = {
    'Housing': { amount: 12000, color: '#ffa500' },
    'Utilities': { amount: 2500, color: '#4169e1' },
    'Food': { amount: 3500, color: '#32cd32' },
    'Transportation': { amount: 2000, color: '#ff6347' },
    'Entertainment': { amount: 1500, color: '#9370db' },
    'Other': { amount: 3500, color: '#20b2aa' },
    'Loans': { amount: 4800, color: '#e91e63' }
  };
  
  res.render('reports', {
    title: 'Reports',
    monthlyData,
    yearlyExpensesByCategory,
    yearlyIncome: 30000,
    yearlyExpenses: 25000,
    yearlySavings: 5000,
    yearlySavingsRatio: 16.7,
    currentYear: new Date().getFullYear()
  });
});

// 404 handler
app.use((req, res) => {
  res.status(404).render('404', { title: 'Page Not Found' });
});

// Start the server
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
