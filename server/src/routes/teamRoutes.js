const express = require('express');
const router = express.Router();
const {
  createTeam,
  updateTeam,
  deleteTeam,
  addTeamMember,
  removeTeamMember,
  updateTeamMemberRole,
  getTeamMembers,
  getTeamSettings,
  getMyTeams,
  getTeamFeatures,
  createTeamFeature,
  updateTeamFeature,
  deleteTeamFeature,
  getTeamById,
  getTeamFeatureStats
} = require('../controllers/teamController');

const {
  getTeamDependencies
} = require('../controllers/dependencies');

const { protectWithAny } = require('../middleware/auth');

// Base route: /api/teams

// Get user's teams
router.get('/my-teams', protectWithAny, getMyTeams);

// Team management routes
router.post('/', protectWithAny, createTeam);
router.get('/:teamId', protectWithAny, getTeamById);
router.put('/:teamId', protectWithAny, updateTeam);
router.delete('/:teamId', protectWithAny, deleteTeam);

// Team member management routes
router.post('/:teamId/members', protectWithAny, addTeamMember);
router.delete('/:teamId/members/:userId', protectWithAny, removeTeamMember);
router.put('/:teamId/members/:userId', protectWithAny, updateTeamMemberRole);

// Team information routes
router.get('/:teamId/members', protectWithAny, getTeamMembers);
router.get('/:teamId/settings', protectWithAny, getTeamSettings);

// Team feature routes
router.get('/:teamId/features', protectWithAny, getTeamFeatures);
router.get('/:teamId/features/stats', protectWithAny, getTeamFeatureStats);
router.post('/:teamId/features', protectWithAny, createTeamFeature);
router.put('/:teamId/features/:featureId', protectWithAny, updateTeamFeature);
router.delete('/:teamId/features/:featureId', protectWithAny, deleteTeamFeature);

// Team dependency routes
router.get('/:teamId/dependencies', protectWithAny, getTeamDependencies);

module.exports = router; 