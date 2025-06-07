const express = require('express');
const router = express.Router();
const commentController = require('../controllers/commentController');
const { protectWithAny } = require('../middleware/auth');

// All comment routes require authentication
router.use(protectWithAny);

// Feature comments routes
router.get('/features/:featureId/comments', commentController.getComments);
router.post('/features/:featureId/comments', commentController.createComment);

// Individual comment routes
router.put('/comments/:id', commentController.updateComment);
router.delete('/comments/:id', commentController.deleteComment);

// Team member mentions autocomplete
router.get('/teams/:teamId/members/mentions', commentController.getTeamMembersForMentions);

module.exports = router; 