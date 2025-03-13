const express = require('express');
const {
  register,
  login,
  firebaseAuth,
  getMe,
  logout,
  updateDetails,
  updatePassword
} = require('../controllers/auth');

const { protect, protectWithFirebase, protectWithAny } = require('../middleware/auth');

const router = express.Router();

// Public routes
router.post('/register', register);
router.post('/login', login);
router.post('/firebase', firebaseAuth);
router.get('/logout', logout);

// Protected routes - JWT authentication
router.get('/me', protect, getMe);
router.put('/updatedetails', protect, updateDetails);
router.put('/updatepassword', protect, updatePassword);

// Protected routes - Firebase authentication
router.get('/me/firebase', protectWithFirebase, getMe);

// Protected routes - Any authentication method
router.get('/me/any', protectWithAny, getMe);

module.exports = router; 