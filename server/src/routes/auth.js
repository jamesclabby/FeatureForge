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

// Protected routes - support both JWT and Firebase auth
router.get('/me', protectWithAny, getMe);
router.put('/updatedetails', protectWithAny, updateDetails);
router.put('/updatepassword', protectWithAny, updatePassword);

// Keep these specific routes for individual auth methods
// Protected routes - Firebase authentication only
router.get('/me/firebase', protectWithFirebase, getMe);

// Protected routes - Any authentication method (already using this)
router.get('/me/any', protectWithAny, getMe);

module.exports = router; 