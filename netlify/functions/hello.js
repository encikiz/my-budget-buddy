// Simple test function
exports.handler = async function(event, context) {
  console.log("Hello function called");
  return {
    statusCode: 200,
    body: JSON.stringify({ message: "Hello from Netlify Functions!" })
  };
};
