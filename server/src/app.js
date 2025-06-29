const express = require('express');
const cors = require('cors');
const compression = require('compression');
const swaggerUi = require('swagger-ui-express');
const YAML = require('yamljs');
const path = require('path');

// Environment variables are automatically provided by Vercel
// No need to load .env files in serverless functions

const { 
  generalRateLimit, 
  authRateLimit, 
  securityHeaders, 
  requestLogger,
  sanitizeInput 
} = require('./middleware/security');
const logger = require('./utils/logger');

const swaggerDocument = YAML.load(path.join(__dirname, 'docs/api.yaml'));

const teamRoutes = require('./routes/teamRoutes');
const featureRoutes = require('./routes/features');
const chatRoutes = require('./routes/chatRoutes');
const emailRoutes = require('./routes/emailRoutes');

const app = express();

// CORS configuration
const corsOptions = {
  origin: process.env.CORS_ORIGINS ? 
    process.env.CORS_ORIGINS.split(',') : 
    ['http://localhost:3000', 'http://localhost:3001'],
  methods: 'GET,HEAD,PUT,PATCH,POST,DELETE',
  credentials: true,
  optionsSuccessStatus: 204
};

// Security middleware
app.use(securityHeaders);
app.use(requestLogger);
app.use(generalRateLimit);
app.use(cors(corsOptions));
app.use(compression());
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));
app.use(sanitizeInput);

// Preflight response for OPTIONS requests
app.options('*', cors(corsOptions));

// API Documentation
app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerDocument));

// Health check endpoint (before auth routes)
app.use('/api/health', require('./routes/health'));

// Routes with specific rate limiting
app.use('/api/auth', authRateLimit, require('./routes/auth'));
app.use('/api/teams', teamRoutes);
app.use('/api/features', featureRoutes);
app.use('/api/chat', chatRoutes);
app.use('/api/email', emailRoutes);

// 404 handler
app.use('*', (req, res) => {
  res.status(404).json({
    success: false,
    error: 'Route not found'
  });
});

// Error handling middleware
app.use((err, req, res, next) => {
  logger.error('Unhandled error:', err);
  res.status(err.statusCode || 500).json({
    success: false,
    error: process.env.NODE_ENV === 'production' ? 
      'Internal Server Error' : 
      err.message
  });
});

module.exports = app; 