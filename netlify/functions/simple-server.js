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

// Determine the correct path for views
// In Netlify Functions, __dirname is /var/task/netlify/functions
// We need to adjust the path to find the views directory
const viewsPath = process.env.NETLIFY
  ? path.join(__dirname, '../..', 'views')
  : path.join(__dirname, '../../views');

console.log('Views path:', viewsPath);
app.set('views', viewsPath);

// Serve static files
// Similar to views, we need to adjust the path for static files
const staticPath = process.env.NETLIFY
  ? path.join(__dirname, '../..', 'public')
  : path.join(__dirname, '../../public');

console.log('Static files path:', staticPath);
app.use(express.static(staticPath));

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
    // Provide a fallback HTML response if EJS rendering fails
    const fallbackHtml = `
      <!DOCTYPE html>
      <html lang="en">
      <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Budget Buddy - Login</title>
        <style>
          body { background-color: #1a1f2e; color: #ffffff; font-family: sans-serif; display: flex; justify-content: center; align-items: center; height: 100vh; margin: 0; }
          .container { background-color: #131726; padding: 2rem; border-radius: 8px; max-width: 400px; width: 100%; }
          h1 { color: #3a56e4; }
          p { margin-bottom: 1rem; }
          .btn { background-color: #3a56e4; color: white; padding: 0.5rem 1rem; border: none; border-radius: 4px; cursor: pointer; text-decoration: none; display: inline-block; }
        </style>
      </head>
      <body>
        <div class="container">
          <h1>Budget Buddy</h1>
          <p>Your personal finance assistant that makes tracking expenses simple and rewarding.</p>
          <p>We're experiencing some technical difficulties with the login page. Our team has been notified.</p>
          <a href="/.netlify/functions/test" class="btn">Check API Status</a>
        </div>
      </body>
      </html>
    `;
    res.status(500).send(fallbackHtml);
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
