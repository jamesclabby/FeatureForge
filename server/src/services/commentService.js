const { User, Comment, Notification, TeamMember, Team } = require('../models');
const { Op } = require('sequelize');

class CommentService {
  /**
   * Parse @mentions from comment content and return user data
   * @param {string} content - Comment content
   * @param {string} teamId - Team ID to validate mentions against
   * @returns {Promise<Array>} - Array of mentioned users
   */
  static async parseMentions(content, teamId) {
    // Extract @username patterns from content - allow dots, hyphens, underscores
    const mentionRegex = /@([\w.-]+)/g;
    const matches = [...content.matchAll(mentionRegex)];
    
    if (matches.length === 0) {
      return [];
    }

    // Get unique usernames
    const usernames = [...new Set(matches.map(match => match[1]))];
    
    // Get the team with its members and filter by mentioned usernames
    const team = await Team.findByPk(teamId, {
      include: [{
        model: User,
        as: 'members',
        attributes: ['id', 'name', 'email'],
        where: {
          name: {
            [Op.iLike]: {
              [Op.any]: usernames.map(name => `%${name}%`)
            }
          }
        },
        required: true
      }]
    });

    if (!team || !team.members) {
      return [];
    }

    return team.members.map(user => ({
      userId: user.id,
      username: user.name,
      email: user.email
    }));
  }

  /**
   * Create a new comment with mention parsing and notifications
   * @param {Object} commentData - Comment data
   * @returns {Promise<Object>} - Created comment with author info
   */
  static async createComment(commentData) {
    const { featureId, userId, content, parentId, teamId } = commentData;

    // Parse mentions from content
    const mentions = await this.parseMentions(content, teamId);

    // Create the comment
    const comment = await Comment.create({
      featureId,
      userId,
      content,
      parentId,
      mentions
    });

    // Load comment with author info
    const commentWithAuthor = await Comment.findByPk(comment.id, {
      include: [{
        model: User,
        as: 'author',
        attributes: ['id', 'name', 'email']
      }]
    });

    // Create notifications for mentions
    if (mentions.length > 0) {
      await this.createMentionNotifications(comment, mentions);
    }

    // Create notification for reply if this is a reply
    if (parentId) {
      await this.createReplyNotification(comment, parentId);
    }

    return commentWithAuthor;
  }

  /**
   * Create notifications for mentioned users
   * @param {Object} comment - Comment object
   * @param {Array} mentions - Array of mentioned users
   */
  static async createMentionNotifications(comment, mentions) {
    const notifications = mentions
      .filter(mention => mention.userId !== comment.userId) // Don't notify self
      .map(mention => ({
        userId: mention.userId,
        type: 'mention',
        relatedId: comment.id,
        relatedType: 'comment',
        message: `${comment.author?.name || 'Someone'} mentioned you in a comment`,
        triggeredBy: comment.userId,
        metadata: {
          featureId: comment.featureId,
          commentId: comment.id,
          mentionedUsername: mention.username
        }
      }));

    if (notifications.length > 0) {
      await Notification.bulkCreate(notifications);
    }
  }

  /**
   * Create notification for comment reply
   * @param {Object} comment - Reply comment object
   * @param {string} parentId - Parent comment ID
   */
  static async createReplyNotification(comment, parentId) {
    // Get parent comment author
    const parentComment = await Comment.findByPk(parentId, {
      include: [{
        model: User,
        as: 'author',
        attributes: ['id', 'name']
      }]
    });

    if (parentComment && parentComment.userId !== comment.userId) {
      await Notification.create({
        userId: parentComment.userId,
        type: 'reply',
        relatedId: comment.id,
        relatedType: 'comment',
        message: `${comment.author?.name || 'Someone'} replied to your comment`,
        triggeredBy: comment.userId,
        metadata: {
          featureId: comment.featureId,
          commentId: comment.id,
          parentCommentId: parentId
        }
      });
    }
  }

  /**
   * Get comments for a feature with replies threaded
   * @param {string} featureId - Feature ID
   * @returns {Promise<Array>} - Threaded comments
   */
  static async getCommentsForFeature(featureId) {
    // Get all comments for the feature
    const comments = await Comment.findAll({
      where: { featureId },
      include: [{
        model: User,
        as: 'author',
        attributes: ['id', 'name', 'email']
      }],
      order: [['createdAt', 'ASC']]
    });

    // Build threaded structure
    const commentMap = new Map();
    const rootComments = [];

    // First pass: create map and identify root comments
    comments.forEach(comment => {
      const commentData = {
        ...comment.toJSON(),
        replies: []
      };
      commentMap.set(comment.id, commentData);
      
      if (!comment.parentId) {
        rootComments.push(commentData);
      }
    });

    // Second pass: attach replies to parents
    comments.forEach(comment => {
      if (comment.parentId) {
        const parent = commentMap.get(comment.parentId);
        const child = commentMap.get(comment.id);
        if (parent && child) {
          parent.replies.push(child);
        }
      }
    });

    return rootComments;
  }

  /**
   * Update a comment
   * @param {string} commentId - Comment ID
   * @param {string} userId - User ID (for permission check)
   * @param {string} content - New content
   * @param {string} teamId - Team ID for mention validation
   * @returns {Promise<Object>} - Updated comment
   */
  static async updateComment(commentId, userId, content, teamId) {
    const comment = await Comment.findByPk(commentId);
    
    if (!comment) {
      throw new Error('Comment not found');
    }

    if (comment.userId !== userId) {
      throw new Error('Not authorized to edit this comment');
    }

    // Parse new mentions
    const mentions = await this.parseMentions(content, teamId);

    // Update comment
    await comment.update({
      content,
      mentions,
      isEdited: true,
      editedAt: new Date()
    });

    // Return updated comment with author
    return await Comment.findByPk(commentId, {
      include: [{
        model: User,
        as: 'author',
        attributes: ['id', 'name', 'email']
      }]
    });
  }

  /**
   * Delete a comment
   * @param {string} commentId - Comment ID
   * @param {string} userId - User ID (for permission check)
   */
  static async deleteComment(commentId, userId) {
    const comment = await Comment.findByPk(commentId);
    
    if (!comment) {
      throw new Error('Comment not found');
    }

    if (comment.userId !== userId) {
      throw new Error('Not authorized to delete this comment');
    }

    await comment.destroy();
  }

  /**
   * Get team members for mention autocomplete
   * @param {string} teamId - Team ID
   * @param {string} query - Search query
   * @returns {Promise<Array>} - Team members matching query
   */
  static async getTeamMembersForMentions(teamId, query = '') {
    // Get the team with its members
    const team = await Team.findByPk(teamId, {
      include: [{
        model: User,
        as: 'members',
        attributes: ['id', 'name', 'email'],
        where: query ? {
          name: {
            [Op.iLike]: `%${query}%`
          }
        } : {},
        required: true
      }]
    });

    if (!team || !team.members) {
      return [];
    }

    return team.members.map(user => ({
      id: user.id,
      name: user.name,
      email: user.email
    }));
  }
}

module.exports = CommentService; 