// Vercel Serverless Function Entry Point
// Environment variables are automatically loaded by Vercel

const app = require('./app');

// Export the Express app as a Vercel serverless function
module.exports = app; 