const dotenv = require('dotenv');
const express = require('express');
const cors = require('cors');
const morgan = require('morgan');
const helmet = require('helmet');
const { connectPostgres } = require('../config/db');
const { initializeFirebaseAdmin } = require('../config/firebase');
const errorHandler = require('../middleware/error');
const path = require('path');

// Load environment variables with explicit path
dotenv.config({ path: path.resolve(__dirname, '../../.env') });

// Import routes
const featureRoutes = require('../routes/features');
const authRoutes = require('../routes/auth');
const teamRoutes = require('../routes/teamRoutes');
const commentRoutes = require('../routes/comments');
const notificationRoutes = require('../routes/notifications');
const chatRoutes = require('../routes/chatRoutes');

/**
 * Start the server with database connection
 * @param {Object} options - Server options
 * @param {boolean} options.requireDb - Whether database connection is required
 */
const startServer = async (options = {}) => {
  const { requireDb = false } = options;
  
  try {
    // Initialize express app
    const app = express();
    
    // Set port
    const PORT = process.env.PORT || 5002;
    
    // Database connection (optional)
    let dbConnection = null;
    try {
      console.log('Connecting to PostgreSQL database...');
      // Connect to PostgreSQL database (pass requireDb to determine if it's required)
      dbConnection = await connectPostgres(requireDb);
      
      if (dbConnection) {
        console.log('Database connection established');
      } else {
        console.warn('Running without database connection. API functionality will be limited.');
      }
    } catch (error) {
      if (requireDb) {
        throw new Error(`Database connection required but failed: ${error.message}`);
      } else {
        console.warn(`Database connection failed: ${error.message}`);
        console.warn('Continuing without database. API functionality will be limited.');
      }
    }
    
    // Firebase initialization (optional)
    try {
      console.log('Initializing Firebase Admin SDK...');
      // Initialize Firebase Admin SDK
      await initializeFirebaseAdmin();
      console.log('Firebase Admin SDK initialized');
    } catch (error) {
      console.warn(`Firebase initialization failed: ${error.message}`);
      console.warn('Continuing without Firebase. Authentication functionality will be limited.');
    }
    
    // Middleware
    app.use(cors({
      origin: process.env.NODE_ENV === 'production' 
        ? 'https://featureforge-97936.web.app'  // Production frontend URL
        : 'http://localhost:3000',              // Development frontend URL
      credentials: true,
      methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
      allowedHeaders: ['Content-Type', 'Authorization']
    }));
    app.use(helmet({
      crossOriginResourcePolicy: { policy: "cross-origin" }
    }));
    app.use(morgan('dev'));
    app.use(express.json());
    app.use(express.urlencoded({ extended: true }));
    
    // Routes
    app.get('/', (req, res) => {
      res.json({ 
        message: 'Welcome to FeatureForge API',
        status: {
          database: dbConnection ? 'connected' : 'disconnected',
          version: process.env.npm_package_version || '1.0.0'
        }
      });
    });
    
    // API index route
    app.get('/api', (req, res) => {
      res.json({
        message: 'FeatureForge API',
        status: {
          database: dbConnection ? 'connected' : 'disconnected',
          version: process.env.npm_package_version || '1.0.0'
        },
        endpoints: {
          auth: '/api/auth',
          teams: '/api/teams',
          features: '/api/features',
          comments: '/api/features/:featureId/comments',
          notifications: '/api/notifications'
        },
        documentation: 'See README.md for API documentation'
      });
    });
    
    // API routes with database check middleware
    const dbCheckMiddleware = (req, res, next) => {
      if (!dbConnection && req.method !== 'GET') {
        return res.status(503).json({
          success: false,
          message: 'Database connection is not available. This action cannot be performed.'
        });
      }
      next();
    };
    
    app.use('/api/teams', dbCheckMiddleware, teamRoutes);
    app.use('/api/features', dbCheckMiddleware, featureRoutes);
    app.use('/api/auth', authRoutes);
    app.use('/api/chat', chatRoutes);
    app.use('/api', dbCheckMiddleware, commentRoutes);
    app.use('/api', dbCheckMiddleware, notificationRoutes);
    
    // Error handling middleware
    app.use(errorHandler);
    
    // Start server
    const server = app.listen(PORT, () => {
      console.log(`Server running on port ${PORT}`);
      console.log(`API available at http://localhost:${PORT}/api`);
    });
    
    // Store database connection on the server object
    server.dbConnection = dbConnection;
    
    return server;
  } catch (error) {
    console.error('Error starting server:', error);
    if (requireDb) {
      process.exit(1);
    }
    throw error;
  }
};

// Run the server if this file is executed directly
if (require.main === module) {
  // Get command line arguments
  const args = process.argv.slice(2);
  const requireDb = args.includes('--require-db');
  
  startServer({ requireDb })
    .catch(error => {
      console.error('Failed to start server:', error);
      process.exit(1);
    });
}

module.exports = startServer; 