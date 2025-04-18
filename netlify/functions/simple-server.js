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
        <title>Budget Buddy - Guest Dashboard</title>
        <style>
          :root {
            --primary-color: #1a1f2e;
            --secondary-color: #131726;
            --accent-color: #3a56e4;
            --text-color: #ffffff;
            --text-muted: #a0a0a0;
            --border-color: #2a2f3f;
            --housing-color: #ffa500;
            --utilities-color: #4169e1;
            --food-color: #32cd32;
            --transportation-color: #ff6347;
            --entertainment-color: #9370db;
            --other-color: #20b2aa;
            --loans-color: #e91e63;
            --salary-color: #4caf50;
            --freelance-color: #ff9800;
            --investments-color: #2196f3;
          }

          * {
            margin: 0;
            padding: 0;
            box-sizing: border-box;
            font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
          }

          body {
            background-color: var(--primary-color);
            color: var(--text-color);
            line-height: 1.6;
            display: flex;
            flex-direction: column;
            min-height: 100vh;
          }

          .container {
            display: flex;
            flex: 1;
          }

          .sidebar {
            width: 250px;
            background-color: var(--secondary-color);
            padding: 20px;
            display: flex;
            flex-direction: column;
            height: 100vh;
            position: fixed;
          }

          .logo {
            display: flex;
            align-items: center;
            margin-bottom: 10px;
          }

          .logo svg {
            width: 40px;
            height: 40px;
            margin-right: 10px;
          }

          .logo h1 {
            font-size: 20px;
            font-weight: 600;
          }

          .tagline {
            font-size: 12px;
            color: var(--text-muted);
            margin-bottom: 30px;
            font-style: italic;
          }

          nav ul {
            list-style: none;
          }

          nav ul li {
            margin-bottom: 10px;
            padding: 10px;
            border-radius: 5px;
            cursor: pointer;
          }

          nav ul li.active {
            background-color: var(--accent-color);
          }

          nav ul li a {
            color: var(--text-color);
            text-decoration: none;
            display: flex;
            align-items: center;
          }

          .main-content {
            flex: 1;
            padding: 20px;
            margin-left: 250px;
          }

          .header {
            display: flex;
            justify-content: space-between;
            align-items: center;
            margin-bottom: 20px;
            padding-bottom: 20px;
            border-bottom: 1px solid var(--border-color);
          }

          .page-title {
            font-size: 24px;
            font-weight: 600;
          }

          .btn {
            background-color: var(--accent-color);
            color: white;
            padding: 10px 15px;
            border: none;
            border-radius: 4px;
            cursor: pointer;
            text-decoration: none;
            display: inline-block;
            font-size: 14px;
          }

          .card {
            background-color: var(--secondary-color);
            border-radius: 8px;
            padding: 20px;
            margin-bottom: 20px;
          }

          .card-title {
            font-size: 18px;
            margin-bottom: 15px;
            display: flex;
            justify-content: space-between;
            align-items: center;
          }

          .message-box {
            background-color: #1B1E26;
            border-radius: 8px;
            padding: 20px;
            margin: 20px 0;
            text-align: center;
          }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="sidebar">
            <div class="logo">
              <!-- Inline SVG logo to avoid path issues -->
              <svg width="40" height="40" viewBox="0 0 100 100" xmlns="http://www.w3.org/2000/svg">
                <!-- Background Circle with darker border -->
                <circle cx="50" cy="50" r="48" fill="white" stroke="#2e7d32" stroke-width="3"/>

                <!-- Glasses based on Flaticon design with increased contrast -->
                <g transform="translate(15, 35) scale(0.7)">
                  <!-- Left Lens -->
                  <circle cx="25" cy="25" r="20" fill="none" stroke="#1b5e20" stroke-width="5" stroke-linecap="round"/>

                  <!-- Right Lens -->
                  <circle cx="75" cy="25" r="20" fill="none" stroke="#1b5e20" stroke-width="5" stroke-linecap="round"/>

                  <!-- Bridge -->
                  <path d="M45 25 L55 25" stroke="#1b5e20" stroke-width="5" stroke-linecap="round"/>

                  <!-- Left Temple -->
                  <path d="M5 25 L0 20" stroke="#1b5e20" stroke-width="5" stroke-linecap="round"/>

                  <!-- Right Temple -->
                  <path d="M95 25 L100 20" stroke="#1b5e20" stroke-width="5" stroke-linecap="round"/>
                </g>

                <!-- Add subtle shadow for depth -->
                <circle cx="50" cy="50" r="48" fill="none" stroke="#e8f5e9" stroke-width="1" opacity="0.5" transform="translate(2, 2)"/>
              </svg>
              <h1>Budget Buddy</h1>
            </div>
            <div class="tagline">
              "Your Wallet Will Thank You"
            </div>
            <nav>
              <ul>
                <li class="active"><a href="#">Dashboard</a></li>
                <li><a href="#">Income</a></li>
                <li><a href="#">Categories</a></li>
                <li><a href="#">Expenses</a></li>
                <li><a href="#">Reports</a></li>
                <li><a href="#">Settings</a></li>
              </ul>
            </nav>
          </div>

          <div class="main-content">
            <div class="header">
              <h2 class="page-title">Dashboard</h2>
            </div>

            <div class="message-box">
              <h3>Welcome to Budget Buddy Demo</h3>
              <p>This is a static demo of Budget Buddy deployed on Netlify.</p>
              <p>The full application with database functionality is available on the local development server.</p>
              <p>You're currently viewing the demo in guest mode.</p>
              <br>
              <a href="/.netlify/functions/simple-server" class="btn">Back to Login</a>
            </div>

            <div class="card">
              <div class="card-title">
                <h3>Monthly Overview</h3>
              </div>
              <p>Income: RM 5,000.00</p>
              <p>Expenses: RM 3,200.00</p>
              <p>Balance: RM 1,800.00</p>
            </div>

            <div class="card">
              <div class="card-title">
                <h3>Recent Transactions</h3>
              </div>
              <p>Grocery Shopping - RM 150.00</p>
              <p>Electricity Bill - RM 85.00</p>
              <p>Salary - RM 5,000.00</p>
            </div>
          </div>
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
          <a href="/.netlify/functions/simple-server" class="btn">Back to Login</a>
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
          background-color: #2d3447; /* Changed to make it pop out */
          padding: 20px;
          text-align: center;
          border-bottom: 1px solid var(--border-color);
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          box-shadow: 0 2px 10px rgba(0, 0, 0, 0.2);
        }

        .auth-header .logo {
          display: flex;
          justify-content: center;
          align-items: center;
          margin-bottom: 10px;
          width: 100%;
          text-align: center;
        }

        .auth-header .logo img {
          width: 40px;
          height: 40px;
          margin-right: 10px;
        }

        .auth-header .tagline {
          font-style: italic;
          color: var(--text-muted);
          margin-bottom: 10px;
          font-size: 0.9rem;
          width: 100%;
          text-align: center;
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

        .guest-info {
          margin-top: 5px;
          font-size: 0.85rem;
          color: var(--text-muted);
          text-align: center;
        }

        .btn-guest {
          display: flex;
          align-items: center;
          justify-content: center;
          width: 100%;
          padding: 12px 20px;
          background-color: rgba(58, 86, 228, 0.2);
          color: var(--text-color);
          border-radius: 5px;
          border: 1px solid var(--accent-color);
          font-weight: 500;
          text-decoration: none;
          transition: background-color 0.3s;
          font-size: 16px;
        }

        .btn-guest:hover {
          background-color: rgba(58, 86, 228, 0.4);
        }

        .btn-guest i {
          font-size: 20px;
          margin-right: 10px;
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

        /* Social login styles */
        .login-options {
          margin: 20px 0;
          text-align: center;
          display: flex;
          flex-direction: column;
          gap: 10px;
        }

        .option-divider {
          position: relative;
          text-align: center;
          margin: 5px 0;
        }

        .option-divider span {
          background-color: var(--secondary-color);
          color: var(--text-muted);
          padding: 0 15px;
          position: relative;
          z-index: 1;
          font-size: 14px;
        }

        .option-divider::before {
          content: '';
          position: absolute;
          top: 50%;
          left: 0;
          right: 0;
          height: 1px;
          background-color: var(--border-color);
          z-index: 0;
        }

        .btn-google {
          display: flex;
          align-items: center;
          justify-content: center;
          width: 100%;
          padding: 10px 20px;
          background-color: white;
          color: #444;
          border-radius: 5px;
          border: 1px solid #ddd;
          font-weight: 500;
          text-decoration: none;
          transition: background-color 0.3s;
        }

        .btn-google:hover {
          background-color: #f5f5f5;
        }

        .btn-google img {
          width: 18px;
          height: 18px;
          margin-right: 10px;
        }

        /* Guest info styles */
        .guest-info {
          margin-top: 10px;
          font-size: 0.85rem;
          color: var(--text-muted);
          text-align: center;
        }

        footer {
          text-align: center;
          padding: 20px;
          color: var(--text-muted);
          font-size: 0.8rem;
        }

        /* Modal styles */
        .modal {
          display: none;
          position: fixed;
          z-index: 1000;
          left: 0;
          top: 0;
          width: 100%;
          height: 100%;
          background-color: rgba(0, 0, 0, 0.7);
          overflow: auto;
        }

        .modal-content {
          background-color: var(--secondary-color);
          margin: 15% auto;
          padding: 0;
          border-radius: 8px;
          width: 90%;
          max-width: 500px;
          box-shadow: 0 5px 15px rgba(0, 0, 0, 0.3);
          animation: modalFadeIn 0.3s;
        }

        @keyframes modalFadeIn {
          from {opacity: 0; transform: translateY(-20px);}
          to {opacity: 1; transform: translateY(0);}
        }

        .modal-header {
          padding: 15px 20px;
          background-color: var(--accent-color);
          color: white;
          border-top-left-radius: 8px;
          border-top-right-radius: 8px;
          display: flex;
          justify-content: space-between;
          align-items: center;
        }

        .modal-header h3 {
          margin: 0;
          font-size: 18px;
        }

        .close-modal {
          color: white;
          font-size: 24px;
          font-weight: bold;
          cursor: pointer;
        }

        .modal-body {
          padding: 20px;
          line-height: 1.5;
        }

        .modal-footer {
          padding: 15px 20px;
          text-align: right;
          border-top: 1px solid var(--border-color);
        }

        .btn-modal {
          background-color: var(--accent-color);
          color: white;
          border: none;
          padding: 8px 16px;
          border-radius: 4px;
          cursor: pointer;
          font-size: 14px;
        }

        .btn-modal:hover {
          background-color: #2a46d4;
        }
      </style>

      <script>
        // Modal functionality
        function showGoogleLoginMessage() {
          document.getElementById('googleLoginModal').style.display = 'block';
        }

        function closeGoogleLoginMessage() {
          document.getElementById('googleLoginModal').style.display = 'none';
        }

        // Close modal when clicking outside of it
        window.onclick = function(event) {
          const modal = document.getElementById('googleLoginModal');
          if (event.target === modal) {
            modal.style.display = 'none';
          }
        }
      </script>
    </head>
    <body>
      <div class="auth-container">
        <div class="auth-card">
          <div class="auth-header">
            <div class="logo">
              <!-- Inline SVG logo to avoid path issues -->
              <svg width="40" height="40" viewBox="0 0 100 100" xmlns="http://www.w3.org/2000/svg">
                <!-- Background Circle with darker border -->
                <circle cx="50" cy="50" r="48" fill="white" stroke="#2e7d32" stroke-width="3"/>

                <!-- Glasses based on Flaticon design with increased contrast -->
                <g transform="translate(15, 35) scale(0.7)">
                  <!-- Left Lens -->
                  <circle cx="25" cy="25" r="20" fill="none" stroke="#1b5e20" stroke-width="5" stroke-linecap="round"/>

                  <!-- Right Lens -->
                  <circle cx="75" cy="25" r="20" fill="none" stroke="#1b5e20" stroke-width="5" stroke-linecap="round"/>

                  <!-- Bridge -->
                  <path d="M45 25 L55 25" stroke="#1b5e20" stroke-width="5" stroke-linecap="round"/>

                  <!-- Left Temple -->
                  <path d="M5 25 L0 20" stroke="#1b5e20" stroke-width="5" stroke-linecap="round"/>

                  <!-- Right Temple -->
                  <path d="M95 25 L100 20" stroke="#1b5e20" stroke-width="5" stroke-linecap="round"/>
                </g>

                <!-- Add subtle shadow for depth -->
                <circle cx="50" cy="50" r="48" fill="none" stroke="#e8f5e9" stroke-width="1" opacity="0.5" transform="translate(2, 2)"/>
              </svg>
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

            <div class="login-options">
              <a href="#" class="btn-google" onclick="showGoogleLoginMessage()">
                <img src="https://developers.google.com/identity/images/g-logo.png" alt="Google logo">
                <span>Login with Google</span>
              </a>

              <!-- Custom modal for Google login message -->
              <div id="googleLoginModal" class="modal">
                <div class="modal-content">
                  <div class="modal-header">
                    <h3>Google Login</h3>
                    <span class="close-modal" onclick="closeGoogleLoginMessage()">&times;</span>
                  </div>
                  <div class="modal-body">
                    <p>Google login is only available in the full application running on a local development server.</p>
                    <p>Please use the Guest login option to explore the demo version.</p>
                  </div>
                  <div class="modal-footer">
                    <button onclick="closeGoogleLoginMessage()" class="btn-modal">OK</button>
                  </div>
                </div>
              </div>

              <div class="option-divider">
                <span>OR</span>
              </div>

              <a href="/?guest=true" class="btn-guest">
                <i class="fas fa-user-circle"></i>
                <span>Login as Guest</span>
              </a>

              <p class="guest-info">Try without registration. Experience all features with sample data.</p>
            </div>

            <div class="auth-footer">
              <p>Don't have an account? <a href="/?register=true">Register</a></p>
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
        <a href="/.netlify/functions/simple-server" class="btn">Back to Login</a>
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
  log('Incoming request:', event.path, event.httpMethod, event.queryStringParameters);

  // For Netlify, we need to modify the event path to work with Express routing
  // This ensures that query parameters like ?guest=true are properly handled
  if (event.queryStringParameters) {
    // If there are query parameters, make sure they're passed to the Express app
    const queryString = Object.entries(event.queryStringParameters)
      .map(([key, value]) => `${key}=${value}`)
      .join('&');

    if (queryString) {
      log('Query string:', queryString);
      // Keep the original path but ensure query params are preserved
      event.path = event.path.split('?')[0];
      log('Modified path:', event.path);
    }
  }

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
