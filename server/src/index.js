const startServer = require('./scripts/startServer');

// Start the server with database as optional
startServer({ requireDb: false })
  .catch(error => {
    console.error('Failed to start server:', error);
    process.exit(1);
  }); 