const express = require('express');
const {
  getFeatures,
  getFeature,
  createFeature,
  updateFeature,
  deleteFeature,
  voteFeature,
  addComment
} = require('../controllers/features');

const { protect, authorize } = require('../middleware/auth');

const router = express.Router();

// Base routes
router
  .route('/')
  .get(getFeatures)
  .post(protect, createFeature);

router
  .route('/:id')
  .get(getFeature)
  .put(protect, updateFeature)
  .delete(protect, deleteFeature);

// Vote route
router.route('/:id/vote').put(protect, voteFeature);

// Comment route
router.route('/:id/comments').post(protect, addComment);

module.exports = router; 