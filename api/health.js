// Health check API route for Vercel
module.exports = (req, res) => {
  const status = {
    status: 'ok',
    environment: process.env.NODE_ENV,
    timestamp: new Date().toISOString()
  };
  
  res.status(200).json(status);
};
