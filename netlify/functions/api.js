// This is a simple example of a Netlify function
// In a real implementation, you would need to migrate your Express routes here
// or use a more complex setup with serverless-http

exports.handler = async function(event, context) {
  const path = event.path.replace('/.netlify/functions/api/', '');
  
  // Simple routing example
  if (path === 'status') {
    return {
      statusCode: 200,
      body: JSON.stringify({ status: 'ok', message: 'API is working' })
    };
  }
  
  // Default response
  return {
    statusCode: 404,
    body: JSON.stringify({ error: 'Not Found' })
  };
};
