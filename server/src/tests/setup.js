const { connectPostgres } = require('../config/db');
const logger = require('../utils/logger');

// Set test environment
process.env.NODE_ENV = 'test';
process.env.LOG_LEVEL = 'error'; // Reduce log noise in tests

// Mock logger for tests to reduce console output
jest.mock('../utils/logger', () => ({
  info: jest.fn(),
  warn: jest.fn(),
  error: jest.fn(),
  debug: jest.fn()
}));

// Global test setup
beforeAll(async () => {
  // Connect to test database
  try {
    await connectPostgres(false);
    logger.info('Test database connected');
  } catch (error) {
    logger.warn('Test database connection failed:', error.message);
  }
});

// Clean up after tests
afterAll(async () => {
  // Close database connection
  const { closeConnection } = require('../config/db');
  await closeConnection();
});

// Test utilities
global.testUtils = {
  /**
   * Create a mock request object
   */
  mockRequest: (overrides = {}) => ({
    body: {},
    params: {},
    query: {},
    headers: {},
    user: null,
    ip: '127.0.0.1',
    ...overrides
  }),

  /**
   * Create a mock response object
   */
  mockResponse: () => {
    const res = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn().mockReturnThis(),
      send: jest.fn().mockReturnThis(),
      cookie: jest.fn().mockReturnThis(),
      clearCookie: jest.fn().mockReturnThis()
    };
    return res;
  },

  /**
   * Create a mock next function
   */
  mockNext: () => jest.fn(),

  /**
   * Create test user data
   */
  createTestUser: (overrides = {}) => ({
    id: 'test-user-id',
    name: 'Test User',
    email: 'test@example.com',
    role: 'user',
    ...overrides
  }),

  /**
   * Create test team data
   */
  createTestTeam: (overrides = {}) => ({
    id: 'test-team-id',
    name: 'Test Team',
    description: 'A test team',
    memberCount: 1,
    ...overrides
  }),

  /**
   * Create test feature data
   */
  createTestFeature: (overrides = {}) => ({
    id: 'test-feature-id',
    title: 'Test Feature',
    description: 'A test feature',
    status: 'pending',
    priority: 'medium',
    ...overrides
  }),

  /**
   * Wait for a specified amount of time
   */
  wait: (ms) => new Promise(resolve => setTimeout(resolve, ms)),

  /**
   * Generate random string
   */
  randomString: (length = 10) => {
    return Math.random().toString(36).substring(2, length + 2);
  }
};

// Global test timeout
jest.setTimeout(30000); 