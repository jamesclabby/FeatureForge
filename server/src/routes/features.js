const express = require('express');
const {
  getFeatures,
  getFeature,
  createFeature,
  updateFeature,
  deleteFeature,
  voteFeature,
  addComment,
  deleteComment,
  editComment
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
router.route('/:id/vote').put(protectWithAny, voteFeature);

// Comment routes
router.route('/:id/comments').post(protectWithAny, addComment);
router.route('/:id/comments/:commentId')
  .put(protectWithAny, editComment)
  .delete(protectWithAny, deleteComment);

module.exports = router; 