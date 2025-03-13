const jwt = require('jsonwebtoken');
const { User } = require('../models');
const { admin, isFirebaseInitialized } = require('../config/firebase');
const { verifyFirebaseToken, findOrCreateUserFromFirebase } = require('../utils/firebase-auth');

/**
 * Protect routes - Verify JWT token
 */
exports.protect = async (req, res, next) => {
  let token;

  // Check if token exists in headers
  if (
    req.headers.authorization &&
    req.headers.authorization.startsWith('Bearer')
  ) {
    // Set token from Bearer token in header
    token = req.headers.authorization.split(' ')[1];
  }
  // Check if token exists in cookies
  else if (req.cookies?.token) {
    token = req.cookies.token;
  }

  // Make sure token exists
  if (!token) {
    return res.status(401).json({
      success: false,
      message: 'Not authorized to access this route'
    });
  }

  try {
    // Verify token
    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    // Add user to request object
    req.user = await User.findByPk(decoded.id);
    
    if (!req.user) {
      return res.status(401).json({
        success: false,
        message: 'User not found'
      });
    }

    next();
  } catch (err) {
    return res.status(401).json({
      success: false,
      message: 'Not authorized to access this route'
    });
  }
};

/**
 * Protect routes - Verify Firebase ID token
 */
exports.protectWithFirebase = async (req, res, next) => {
  // Check if Firebase is initialized
  if (!isFirebaseInitialized()) {
    return res.status(503).json({
      success: false,
      message: 'Firebase authentication is not available'
    });
  }

  let idToken;

  // Check if token exists in headers
  if (
    req.headers.authorization &&
    req.headers.authorization.startsWith('Bearer')
  ) {
    // Set token from Bearer token in header
    idToken = req.headers.authorization.split(' ')[1];
  }

  // Make sure token exists
  if (!idToken) {
    return res.status(401).json({
      success: false,
      message: 'Not authorized to access this route'
    });
  }

  try {
    // Verify Firebase token
    const firebaseUser = await verifyFirebaseToken(idToken);
    
    // Find or create user based on Firebase data
    const user = await findOrCreateUserFromFirebase(firebaseUser);
    
    // Add user to request object
    req.user = user;
    
    next();
  } catch (err) {
    return res.status(401).json({
      success: false,
      message: 'Not authorized to access this route: ' + err.message
    });
  }
};

/**
 * Protect routes - Verify either JWT or Firebase token
 * This middleware will try both authentication methods
 */
exports.protectWithAny = async (req, res, next) => {
  let token;

  // Check if token exists in headers
  if (
    req.headers.authorization &&
    req.headers.authorization.startsWith('Bearer')
  ) {
    // Set token from Bearer token in header
    token = req.headers.authorization.split(' ')[1];
  }
  // Check if token exists in cookies
  else if (req.cookies?.token) {
    token = req.cookies.token;
  }

  // Make sure token exists
  if (!token) {
    return res.status(401).json({
      success: false,
      message: 'Not authorized to access this route'
    });
  }

  try {
    // First try to verify as a JWT token
    try {
      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      req.user = await User.findByPk(decoded.id);
      
      if (req.user) {
        return next();
      }
    } catch (jwtError) {
      // JWT verification failed, continue to try Firebase
    }
    
    // If JWT verification fails or user not found, try Firebase
    if (isFirebaseInitialized()) {
      try {
        const firebaseUser = await verifyFirebaseToken(token);
        const user = await findOrCreateUserFromFirebase(firebaseUser);
        
        if (user) {
          req.user = user;
          return next();
        }
      } catch (firebaseError) {
        // Firebase verification failed
      }
    }
    
    // If we get here, both authentication methods failed
    throw new Error('Invalid authentication token');
  } catch (err) {
    return res.status(401).json({
      success: false,
      message: 'Not authorized to access this route: ' + err.message
    });
  }
};

/**
 * Authorize specific roles
 */
exports.authorize = (...roles) => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        message: 'Not authorized to access this route'
      });
    }

    if (!roles.includes(req.user.role)) {
      return res.status(403).json({
        success: false,
        message: `User role ${req.user.role} is not authorized to access this route`
      });
    }
    next();
  };
}; 