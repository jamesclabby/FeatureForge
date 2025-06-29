const express = require('express');
const {
  getFeatures,
  getFeature,
  createFeature,
  updateFeature,
  deleteFeature,
  voteFeature
} = require('../controllers/features');

const {
  getFeatureDependencies,
  createDependency,
  deleteDependency,
  getDependencyTypes
} = require('../controllers/dependencies');

const { protect, protectWithAny } = require('../middleware/auth');

const router = express.Router();

// Dependency types route (public)
router.route('/dependencies/types').get(getDependencyTypes);

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

// Dependency routes
router
  .route('/:featureId/dependencies')
  .get(getFeatureDependencies)
  .post(protectWithAny, createDependency);

router
  .route('/:featureId/dependencies/:dependencyId')
  .delete(protectWithAny, deleteDependency);

module.exports = router; 