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

// For Netlify deployment, we'll use a direct HTML response instead of EJS templates
app.get('/', (req, res) => {
  log('Request received with query:', req.query);

  // Check if this is a guest login request
  if (req.query.guest === 'true') {
    log('Guest login requested');
    return res.send(`
      <!DOCTYPE html>
      <html lang="en">
      <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Budget Buddy - Guest Login</title>
        <style>
          body { background-color: #1a1f2e; color: #ffffff; font-family: sans-serif; display: flex; justify-content: center; align-items: center; height: 100vh; margin: 0; }
          .container { background-color: #131726; padding: 2rem; border-radius: 8px; max-width: 400px; width: 100%; text-align: center; }
          h1 { color: #3a56e4; margin-bottom: 1rem; }
          p { margin-bottom: 1.5rem; line-height: 1.5; }
          .btn { background-color: #3a56e4; color: white; padding: 0.5rem 1rem; border: none; border-radius: 4px; cursor: pointer; text-decoration: none; }
        </style>
      </head>
      <body>
        <div class="container">
          <h1>Guest Login</h1>
          <p>This is a static demo of Budget Buddy deployed on Netlify. The full application with database functionality is available on the local development server.</p>
          <a href="/" class="btn">Back to Login</a>
        </div>
      </body>
      </html>
    `);
  }

  // Check if this is a register request
  if (req.query.register === 'true') {
    log('Register page requested');
    return res.send(`
      <!DOCTYPE html>
      <html lang="en">
      <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Budget Buddy - Register</title>
        <style>
          body { background-color: #1a1f2e; color: #ffffff; font-family: sans-serif; display: flex; justify-content: center; align-items: center; height: 100vh; margin: 0; }
          .container { background-color: #131726; padding: 2rem; border-radius: 8px; max-width: 400px; width: 100%; text-align: center; }
          h1 { color: #3a56e4; margin-bottom: 1rem; }
          p { margin-bottom: 1.5rem; line-height: 1.5; }
          .btn { background-color: #3a56e4; color: white; padding: 0.5rem 1rem; border: none; border-radius: 4px; cursor: pointer; text-decoration: none; }
        </style>
      </head>
      <body>
        <div class="container">
          <h1>Register</h1>
          <p>This is a static demo of Budget Buddy deployed on Netlify. The full application with database functionality is available on the local development server.</p>
          <a href="/" class="btn">Back to Login</a>
        </div>
      </body>
      </html>
    `);
  }

  log('Serving login page');

  // Send a complete HTML response that mimics the login page
  const loginHtml = `
    <!DOCTYPE html>
    <html lang="en">
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>Budget Buddy - Login</title>
      <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.4.0/css/all.min.css">
      <style>
        :root {
          --primary-color: #1a1f2e;
          --secondary-color: #131726;
          --accent-color: #3a56e4;
          --text-color: #ffffff;
          --text-muted: #a0a0a0;
          --border-color: #2a2f3f;
        }

        * {
          margin: 0;
          padding: 0;
          box-sizing: border-box;
          font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
        }

        html, body {
          width: 100%;
          height: 100%;
        }

        body {
          background-color: var(--primary-color);
          color: var(--text-color);
          line-height: 1.6;
        }

        .auth-container {
          display: flex;
          justify-content: center;
          align-items: center;
          min-height: 100vh;
          padding: 20px;
        }

        .auth-card {
          background-color: var(--secondary-color);
          border-radius: 10px;
          width: 100%;
          max-width: 400px;
          box-shadow: 0 5px 15px rgba(0, 0, 0, 0.3);
          overflow: hidden;
        }

        .auth-header {
          background-color: var(--primary-color);
          padding: 20px;
          text-align: center;
          border-bottom: 1px solid var(--border-color);
        }

        .auth-header .logo {
          display: flex;
          justify-content: center;
          align-items: center;
          margin-bottom: 10px;
        }

        .auth-header .logo i {
          font-size: 24px;
          margin-right: 10px;
          color: var(--accent-color);
        }

        .auth-body {
          padding: 20px;
        }

        .welcome-message {
          background-color: #1B1E26;
          border-radius: 4px;
          padding: 15px;
          margin-bottom: 20px;
          text-align: center;
        }

        .welcome-message p {
          margin-bottom: 8px;
          line-height: 1.5;
          color: #cccccc;
          font-size: 0.9rem;
        }

        .form-group {
          margin-bottom: 15px;
        }

        .form-group label {
          display: block;
          margin-bottom: 5px;
          color: var(--text-muted);
        }

        .form-control {
          width: 100%;
          padding: 10px;
          background-color: rgba(255, 255, 255, 0.1);
          border: 1px solid var(--border-color);
          border-radius: 5px;
          color: var(--text-color);
        }

        .btn-primary {
          background-color: var(--accent-color);
          color: var(--text-color);
          border: none;
          padding: 10px 20px;
          border-radius: 5px;
          cursor: pointer;
          display: inline-block;
          width: 100%;
          text-align: center;
        }

        .guest-login {
          margin: 20px 0;
          text-align: center;
        }

        .guest-login p {
          margin-bottom: 15px;
          color: var(--text-muted);
          position: relative;
        }

        .btn-secondary {
          background-color: rgba(58, 86, 228, 0.2);
          color: var(--text-color);
          border: 1px solid var(--accent-color);
          padding: 10px 20px;
          border-radius: 5px;
          cursor: pointer;
          display: inline-block;
          width: 100%;
          text-align: center;
          text-decoration: none;
        }

        .auth-footer {
          margin-top: 20px;
          text-align: center;
          color: var(--text-muted);
        }

        .auth-footer a {
          color: var(--accent-color);
          text-decoration: none;
        }

        footer {
          text-align: center;
          padding: 20px;
          color: var(--text-muted);
          font-size: 0.8rem;
        }
      </style>
    </head>
    <body>
      <div class="auth-container">
        <div class="auth-card">
          <div class="auth-header">
            <div class="logo">
              <i class="fas fa-dollar-sign"></i>
              <h1>Budget Buddy</h1>
            </div>
            <div class="tagline">
              "Your Wallet Will Thank You"
            </div>
          </div>

          <div class="auth-body">
            <div class="welcome-message">
              <p>Your personal finance assistant that makes tracking expenses simple and rewarding.</p>
              <p>Take control of your money, understand your spending habits, and reach your financial goals with ease.</p>
            </div>

            <form action="/.netlify/functions/simple-server" method="POST">
              <div class="form-group">
                <label for="email">Email</label>
                <input type="email" id="email" name="email" class="form-control" required>
              </div>

              <div class="form-group">
                <label for="password">Password</label>
                <input type="password" id="password" name="password" class="form-control" required>
              </div>

              <div class="form-actions">
                <button type="submit" class="btn-primary">Login</button>
              </div>
            </form>

            <div class="guest-login">
              <p>- OR -</p>
              <a href="/.netlify/functions/simple-server?guest=true" class="btn-secondary">Login as Guest</a>
            </div>

            <div class="auth-footer">
              <p>Don't have an account? <a href="/.netlify/functions/simple-server?register=true">Register</a></p>
            </div>
          </div>
        </div>
      </div>

      <footer>
        <p>Budget Buddy: Your Wallet Will Thank You. Developed by Hafizan.</p>
      </footer>
    </body>
    </html>
  `;

  res.status(200).send(loginHtml);
});

// Simple route to check if the function is working
app.get('/health', (req, res) => {
  res.status(200).json({ status: 'ok', message: 'Simple server is running' });
});

// Handle login form submission
app.post('/', (req, res) => {
  const { email, password } = req.body;
  log('Login attempt:', email);

  // For Netlify demo, just show a message
  const message = `
    <!DOCTYPE html>
    <html lang="en">
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>Budget Buddy - Login</title>
      <style>
        body { background-color: #1a1f2e; color: #ffffff; font-family: sans-serif; display: flex; justify-content: center; align-items: center; height: 100vh; margin: 0; }
        .container { background-color: #131726; padding: 2rem; border-radius: 8px; max-width: 400px; width: 100%; text-align: center; }
        h1 { color: #3a56e4; margin-bottom: 1rem; }
        p { margin-bottom: 1.5rem; line-height: 1.5; }
        .btn { background-color: #3a56e4; color: white; padding: 0.5rem 1rem; border: none; border-radius: 4px; cursor: pointer; text-decoration: none; }
      </style>
    </head>
    <body>
      <div class="container">
        <h1>Login Attempt Received</h1>
        <p>This is a static demo of Budget Buddy deployed on Netlify. The full application with database functionality is available on the local development server.</p>
        <p>Email: ${email}</p>
        <a href="/" class="btn">Back to Login</a>
      </div>
    </body>
    </html>
  `;

  res.status(200).send(message);
});

// Note: Guest login and register routes are now handled in the main route with query parameters

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
