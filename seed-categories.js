const mongoose = require('mongoose');
const dotenv = require('dotenv');
const Category = require('./models/Category');
const User = require('./models/User');

// Load environment variables
dotenv.config();

// Connect to MongoDB
mongoose.connect(process.env.MONGODB_URI, {
  useNewUrlParser: true,
  useUnifiedTopology: true
})
  .then(() => console.log('MongoDB connected for seeding'))
  .catch(err => console.error('MongoDB connection error:', err));

// Seed income categories
const seedIncomeCategories = async () => {
  try {
    // Get the first user (for testing purposes)
    const user = await User.findOne();
    
    if (!user) {
      console.error('No user found. Please register a user first.');
      process.exit(1);
    }
    
    // Check if income categories already exist for this user
    const existingCategories = await Category.find({ 
      user: user._id,
      type: 'income'
    });
    
    if (existingCategories.length > 0) {
      console.log(`User already has ${existingCategories.length} income categories.`);
      process.exit(0);
    }
    
    // Create income categories
    const incomeCategories = [
      {
        name: 'Salary',
        type: 'income',
        description: 'Regular employment income',
        color: '#4caf50',
        icon: 'fas fa-briefcase',
        user: user._id
      },
      {
        name: 'Freelance',
        type: 'income',
        description: 'Project-based income',
        color: '#ff9800',
        icon: 'fas fa-laptop',
        user: user._id
      },
      {
        name: 'Investments',
        type: 'income',
        description: 'Dividend and interest income',
        color: '#2196f3',
        icon: 'fas fa-chart-line',
        user: user._id
      }
    ];
    
    // Insert categories
    await Category.insertMany(incomeCategories);
    
    console.log('Income categories seeded successfully');
    process.exit(0);
  } catch (err) {
    console.error('Error seeding income categories:', err);
    process.exit(1);
  }
};

// Run the seed function
seedIncomeCategories();
