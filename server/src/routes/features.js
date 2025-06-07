const express = require('express');
const {
  getFeatures,
  getFeature,
  createFeature,
  updateFeature,
  deleteFeature,
  voteFeature
} = require('../controllers/features');

const { protect, protectWithAny } = require('../middleware/auth');

const router = express.Router();

// Base routes
router
  .route('/')
  .get(getFeatures)
  .post(protectWithAny, createFeature);

router
  .route('/:id')
  .get(getFeature)
  .put(protectWithAny, updateFeature)
  .delete(protectWithAny, deleteFeature);

// Vote route
router.route('/:id/vote').post(protectWithAny, voteFeature);

module.exports = router; 