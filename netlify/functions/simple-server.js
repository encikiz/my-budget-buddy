const express = require('express');
const serverless = require('serverless-http');
const path = require('path');
const dotenv = require('dotenv');

// Load environment variables
dotenv.config();

// For debugging
const DEBUG = true;
const log = (...args) => DEBUG && console.log(...args);

// Initialize Express app
const app = express();

// Set up EJS as the view engine
app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, '../../views'));

// Serve static files
app.use(express.static(path.join(__dirname, '../../public')));

// Body parser middleware
app.use(express.urlencoded({ extended: false }));
app.use(express.json());

// Simple route to render login page
app.get('/', (req, res) => {
  try {
    log('Rendering login page');
    res.render('auth/login', {
      title: 'Login'
    });
  } catch (err) {
    log('Error rendering login page:', err.message);
    res.status(500).send('Error rendering login page: ' + err.message);
  }
});

// Simple route to check if the function is working
app.get('/health', (req, res) => {
  res.status(200).json({ status: 'ok', message: 'Simple server is running' });
});

// 404 handler
app.use((req, res) => {
  log('404 Not Found:', req.originalUrl);
  res.status(404).send('Page Not Found');
});

// Error handling middleware
app.use((err, req, res, next) => {
  log('Error encountered:', err.message);
  res.status(500).send('Internal Server Error: ' + err.message);
});

// Create the serverless handler
const handler = serverless(app);

// Export the handler with additional error handling
module.exports.handler = async (event, context) => {
  // Log the incoming request
  log('Incoming request:', event.path, event.httpMethod);
  
  try {
    // Call the serverless handler
    const result = await handler(event, context);
    log('Response status:', result.statusCode);
    return result;
  } catch (error) {
    log('Serverless handler error:', error.message);
    return {
      statusCode: 500,
      body: JSON.stringify({ error: 'Internal Server Error', message: error.message })
    };
  }
};
