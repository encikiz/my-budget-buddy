// Simple test function to check if serverless functions are working
exports.handler = async function(event, context) {
  console.log("Test function called");
  
  // Return environment variables (with sensitive info masked)
  const envVars = {
    NODE_ENV: process.env.NODE_ENV || 'not set',
    MONGODB_URI: process.env.MONGODB_URI ? 'exists (masked)' : 'not set',
    SESSION_SECRET: process.env.SESSION_SECRET ? 'exists (masked)' : 'not set'
  };
  
  return {
    statusCode: 200,
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      message: "Hello from Netlify Functions!",
      environment: envVars,
      path: event.path,
      httpMethod: event.httpMethod
    })
  };
};
