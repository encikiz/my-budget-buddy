// Test MongoDB connection in Vercel environment
const mongoose = require('mongoose');
const dotenv = require('dotenv');

// Load environment variables
dotenv.config();

module.exports = async (req, res) => {
  try {
    // Check if MongoDB URI is available
    if (!process.env.MONGODB_URI) {
      return res.status(500).json({
        status: 'error',
        message: 'MongoDB URI is not defined in environment variables'
      });
    }

    // Mask the password in the connection string for logging
    const maskedUri = process.env.MONGODB_URI.replace(
      /:([^:@]+)@/,
      ':****@'
    );

    // Try to connect to MongoDB
    await mongoose.connect(process.env.MONGODB_URI, {
      useNewUrlParser: true,
      useUnifiedTopology: true
    });

    // If connection is successful
    return res.status(200).json({
      status: 'success',
      message: 'MongoDB connection successful',
      uri: maskedUri,
      environment: process.env.NODE_ENV || 'development',
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    // If connection fails
    return res.status(500).json({
      status: 'error',
      message: 'MongoDB connection failed',
      error: error.message,
      timestamp: new Date().toISOString()
    });
  } finally {
    // Close the connection
    try {
      if (mongoose.connection.readyState !== 0) {
        await mongoose.disconnect();
      }
    } catch (err) {
      console.error('Error disconnecting from MongoDB:', err);
    }
  }
};
