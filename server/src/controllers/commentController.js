const CommentService = require('../services/commentService');
const { Feature, Team, User, Comment } = require('../models');

/**
 * @desc    Get comments for a feature
 * @route   GET /api/features/:featureId/comments
 * @access  Private (team members only)
 */
exports.getComments = async (req, res) => {
  try {
    const { featureId } = req.params;
    const userId = req.user.id;

    // Verify user has access to the feature's team
    const feature = await Feature.findByPk(featureId, {
      include: [{
        model: Team,
        include: [{
          model: User,
          as: 'members',
          where: { id: userId },
          required: true
        }]
      }]
    });

    if (!feature) {
      return res.status(404).json({
        success: false,
        message: 'Feature not found or you do not have access'
      });
    }

    const comments = await CommentService.getCommentsForFeature(featureId);

    res.status(200).json({
      success: true,
      data: comments
    });
  } catch (error) {
    console.error('Error getting comments:', error);
    res.status(500).json({
      success: false,
      message: 'Error retrieving comments'
    });
  }
};

/**
 * @desc    Create a new comment
 * @route   POST /api/features/:featureId/comments
 * @access  Private (team members only)
 */
exports.createComment = async (req, res) => {
  try {
    const { featureId } = req.params;
    const { content, parentId } = req.body;
    const userId = req.user.id;

    console.log('Creating comment:', {
      featureId,
      content,
      parentId,
      userId,
      userInfo: {
        id: req.user.id,
        name: req.user.name,
        email: req.user.email
      }
    });

    // Validate required fields
    if (!content || content.trim().length === 0) {
      return res.status(400).json({
        success: false,
        message: 'Comment content is required'
      });
    }

    // Verify user has access to the feature's team
    const feature = await Feature.findByPk(featureId, {
      include: [{
        model: Team,
        include: [{
          model: User,
          as: 'members',
          where: { id: userId },
          required: true
        }]
      }]
    });

    if (!feature) {
      return res.status(404).json({
        success: false,
        message: 'Feature not found or you do not have access'
      });
    }

    // Create comment
    const comment = await CommentService.createComment({
      featureId,
      userId,
      content: content.trim(),
      parentId,
      teamId: feature.teamId
    });

    console.log('Created comment:', {
      id: comment.id,
      content: comment.content,
      author: comment.author,
      createdAt: comment.createdAt
    });

    res.status(201).json({
      success: true,
      data: comment
    });
  } catch (error) {
    console.error('Error creating comment:', error);
    res.status(500).json({
      success: false,
      message: 'Error creating comment'
    });
  }
};

/**
 * @desc    Update a comment
 * @route   PUT /api/comments/:id
 * @access  Private (comment author only)
 */
exports.updateComment = async (req, res) => {
  try {
    const { id } = req.params;
    const { content } = req.body;
    const userId = req.user.id;

    // Validate required fields
    if (!content || content.trim().length === 0) {
      return res.status(400).json({
        success: false,
        message: 'Comment content is required'
      });
    }

    // Get the comment to find its feature and team
    const comment = await Comment.findByPk(id, {
      include: [{
        model: Feature,
        as: 'feature',
        include: [{
          model: Team
        }]
      }]
    });

    if (!comment) {
      return res.status(404).json({
        success: false,
        message: 'Comment not found'
      });
    }

    const updatedComment = await CommentService.updateComment(
      id, 
      userId, 
      content.trim(), 
      comment.feature.teamId
    );

    res.status(200).json({
      success: true,
      data: updatedComment
    });
  } catch (error) {
    console.error('Error updating comment:', error);
    
    if (error.message === 'Comment not found' || error.message === 'Not authorized to edit this comment') {
      return res.status(404).json({
        success: false,
        message: error.message
      });
    }

    res.status(500).json({
      success: false,
      message: 'Error updating comment'
    });
  }
};

/**
 * @desc    Delete a comment
 * @route   DELETE /api/comments/:id
 * @access  Private (comment author only)
 */
exports.deleteComment = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user.id;

    await CommentService.deleteComment(id, userId);

    res.status(200).json({
      success: true,
      message: 'Comment deleted successfully'
    });
  } catch (error) {
    console.error('Error deleting comment:', error);
    
    if (error.message === 'Comment not found' || error.message === 'Not authorized to delete this comment') {
      return res.status(404).json({
        success: false,
        message: error.message
      });
    }

    res.status(500).json({
      success: false,
      message: 'Error deleting comment'
    });
  }
};

/**
 * @desc    Get team members for mention autocomplete
 * @route   GET /api/teams/:teamId/members/mentions
 * @access  Private (team members only)
 */
exports.getTeamMembersForMentions = async (req, res) => {
  try {
    const { teamId } = req.params;
    const { q } = req.query; // search query
    const userId = req.user.id;

    // Verify user is a member of the team
    const team = await Team.findByPk(teamId, {
      include: [{
        model: User,
        as: 'members',
        where: { id: userId },
        required: true
      }]
    });

    if (!team) {
      return res.status(404).json({
        success: false,
        message: 'Team not found or you do not have access'
      });
    }

    const members = await CommentService.getTeamMembersForMentions(teamId, q);

    res.status(200).json({
      success: true,
      data: members
    });
  } catch (error) {
    console.error('Error getting team members for mentions:', error);
    res.status(500).json({
      success: false,
      message: 'Error retrieving team members'
    });
  }
}; 