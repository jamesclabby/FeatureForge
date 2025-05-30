const { Feature, User, Comment } = require('../models');
const { Op } = require('sequelize');

/**
 * @desc    Get all features
 * @route   GET /api/features
 * @access  Public
 */
exports.getFeatures = async (req, res) => {
  try {
    // Build query
    const queryObj = { ...req.query };
    
    // Fields to exclude from filtering
    const excludedFields = ['page', 'sort', 'limit', 'fields'];
    excludedFields.forEach(field => delete queryObj[field]);
    
    // Build where clause for Sequelize
    const where = {};
    
    // Handle specific filters
    if (queryObj.status) where.status = queryObj.status;
    if (queryObj.category) where.category = queryObj.category;
    if (queryObj.requestedById) where.requestedById = queryObj.requestedById;
    if (queryObj.assignedToId) where.assignedToId = queryObj.assignedToId;
    
    // Pagination
    const page = parseInt(req.query.page, 10) || 1;
    const limit = parseInt(req.query.limit, 10) || 10;
    const offset = (page - 1) * limit;
    
    // Sorting
    let order = [['createdAt', 'DESC']];
    if (req.query.sort) {
      const sortFields = req.query.sort.split(',');
      order = sortFields.map(field => {
        if (field.startsWith('-')) {
          return [field.substring(1), 'DESC'];
        }
        return [field, 'ASC'];
      });
    }
    
    // Execute query
    const { count, rows: features } = await Feature.findAndCountAll({
      where,
      limit,
      offset,
      order,
      include: [
        {
          model: User,
          as: 'requestedBy',
          attributes: ['id', 'name', 'email', 'avatar']
        },
        {
          model: User,
          as: 'assignedTo',
          attributes: ['id', 'name', 'email', 'avatar']
        }
      ]
    });
    
    res.status(200).json({
      success: true,
      count: features.length,
      total: count,
      pagination: {
        page,
        limit,
        totalPages: Math.ceil(count / limit)
      },
      data: features
    });
  } catch (err) {
    res.status(500).json({
      success: false,
      message: 'Server Error',
      error: err.message
    });
  }
};

/**
 * @desc    Get single feature
 * @route   GET /api/features/:id
 * @access  Public
 */
exports.getFeature = async (req, res) => {
  try {
    // Get the feature with minimal includes to avoid association errors
    const feature = await Feature.findByPk(req.params.id, {
      include: [
        {
          model: User,
          as: 'creator',
          attributes: ['id', 'name', 'email']
        }
      ]
    });
    
    if (!feature) {
      return res.status(404).json({
        success: false,
        message: 'Feature not found'
      });
    }
    
    // Convert to plain object to safely add additional data
    const featureData = feature.toJSON();
    
    // Make sure comments are initialized as an array if they don't exist
    if (!featureData.comments) {
      featureData.comments = [];
    }
    
    // Log what we're returning
    console.log(`Returning feature ${req.params.id} with ${featureData.comments.length} comments`);
    
    // Return the feature data
    res.status(200).json({
      success: true,
      data: featureData
    });
  } catch (err) {
    console.error('Error fetching feature:', err);
    res.status(500).json({
      success: false,
      message: 'Server Error',
      error: err.message
    });
  }
};

/**
 * @desc    Create new feature
 * @route   POST /api/features
 * @access  Private
 */
exports.createFeature = async (req, res) => {
  try {
    // Log authentication info for debugging
    console.log('Creating feature with user:', req.user ? req.user.id : 'No user');
    
    // Add user to req.body
    req.body.requestedById = req.user.id;
    
    const feature = await Feature.create(req.body);
    
    res.status(201).json({
      success: true,
      data: feature
    });
  } catch (err) {
    console.error('Error creating feature:', err);
    res.status(400).json({
      success: false,
      message: err.message
    });
  }
};

/**
 * @desc    Update feature
 * @route   PUT /api/features/:id
 * @access  Private
 */
exports.updateFeature = async (req, res) => {
  try {
    let feature = await Feature.findByPk(req.params.id);
    
    if (!feature) {
      return res.status(404).json({
        success: false,
        message: 'Feature not found'
      });
    }
    
    // Check if user is authorized to update
    if (
      feature.requestedById !== req.user.id &&
      req.user.role !== 'admin' &&
      req.user.role !== 'product-manager'
    ) {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to update this feature'
      });
    }
    
    await feature.update(req.body);
    
    // Fetch updated feature with associations
    feature = await Feature.findByPk(req.params.id, {
      include: [
        {
          model: User,
          as: 'requestedBy',
          attributes: ['id', 'name', 'email', 'avatar']
        },
        {
          model: User,
          as: 'assignedTo',
          attributes: ['id', 'name', 'email', 'avatar']
        }
      ]
    });
    
    res.status(200).json({
      success: true,
      data: feature
    });
  } catch (err) {
    res.status(400).json({
      success: false,
      message: err.message
    });
  }
};

/**
 * @desc    Delete feature
 * @route   DELETE /api/features/:id
 * @access  Private
 */
exports.deleteFeature = async (req, res) => {
  try {
    const feature = await Feature.findByPk(req.params.id);
    
    if (!feature) {
      return res.status(404).json({
        success: false,
        message: 'Feature not found'
      });
    }
    
    // Check if user is authorized to delete
    if (
      feature.requestedById !== req.user.id &&
      req.user.role !== 'admin' &&
      req.user.role !== 'product-manager'
    ) {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to delete this feature'
      });
    }
    
    await feature.destroy();
    
    res.status(200).json({
      success: true,
      data: {}
    });
  } catch (err) {
    res.status(400).json({
      success: false,
      message: err.message
    });
  }
};

/**
 * @desc    Vote for a feature
 * @route   POST /api/features/:id/vote
 * @access  Private
 */
exports.voteFeature = async (req, res) => {
  try {
    const feature = await Feature.findByPk(req.params.id);
    
    if (!feature) {
      return res.status(404).json({
        success: false,
        message: 'Feature not found'
      });
    }
    
    // Simply increment the vote count
    // Note: In a production app, you might want to track which users voted
    // to prevent duplicate votes, but for simplicity we'll just increment
    const currentVotes = feature.votes || 0;
    await feature.update({ votes: currentVotes + 1 });
    
    // Get updated feature
    const updatedFeature = await Feature.findByPk(req.params.id, {
      include: [
        {
          model: User,
          as: 'creator',
          attributes: ['id', 'name', 'email']
        }
      ]
    });
    
    res.status(200).json({
      success: true,
      data: updatedFeature
    });
  } catch (err) {
    console.error('Error voting for feature:', err);
    res.status(400).json({
      success: false,
      message: err.message
    });
  }
};

/**
 * @desc    Add comment to feature
 * @route   POST /api/features/:id/comments
 * @access  Private
 */
exports.addComment = async (req, res) => {
  try {
    const featureId = req.params.id;
    const userId = req.user.id;
    const text = req.body.text;
    
    console.log(`Adding comment to feature ${featureId}:`, {
      userId,
      text,
      body: req.body
    });

    // First get the current comments
    const feature = await Feature.findByPk(featureId);
    
    if (!feature) {
      return res.status(404).json({
        success: false,
        message: 'Feature not found'
      });
    }
    
    console.log('Current feature.comments:', feature.comments);
    
    // Create the new comment
    const newComment = {
      id: Date.now().toString(), // Simple ID generation
      userId: userId,
      userEmail: req.user.email,
      userName: req.user.name,
      text: text,
      createdAt: new Date().toISOString()
    };
    
    // Get current comments or initialize empty array
    let comments = feature.comments || [];
    if (!Array.isArray(comments)) {
      comments = [];
    }
    
    // Add new comment to the array
    comments.push(newComment);
    
    console.log('New comments array:', comments);
    
    // Direct SQL approach - simpler and more reliable than transactions for JSONB
    try {
      // Use raw SQL update with direct sequelize connection
      await Feature.sequelize.query(
        `UPDATE features SET comments = $comments, "updatedAt" = NOW() WHERE id = $featureId`,
        {
          bind: { 
            comments: JSON.stringify(comments),
            featureId: featureId
          },
          type: Feature.sequelize.QueryTypes.UPDATE
        }
      );
      
      console.log('Feature updated successfully with new comments via direct SQL');
    } catch (sqlError) {
      console.error('Error updating feature with SQL query:', sqlError);
      throw sqlError;
    }
    
    // Verify the update was successful by fetching the feature again
    const updatedFeature = await Feature.findByPk(featureId);
    console.log('After update, feature.comments:', updatedFeature.comments);
    console.log(`Comment added successfully. Feature now has ${updatedFeature.comments ? updatedFeature.comments.length : 0} comments.`);
    
    res.status(200).json({
      success: true,
      data: newComment
    });
  } catch (err) {
    console.error('Error adding comment:', err);
    res.status(400).json({
      success: false,
      message: err.message
    });
  }
};

/**
 * @desc    Delete a comment from a feature
 * @route   DELETE /api/features/:id/comments/:commentId
 * @access  Private (Comment creator only)
 */
exports.deleteComment = async (req, res) => {
  try {
    const { id: featureId, commentId } = req.params;
    const userId = req.user.id;
    
    console.log(`Attempting to delete comment ${commentId} from feature ${featureId} by user ${userId}`);

    // Get the feature with its comments
    const feature = await Feature.findByPk(featureId);
    
    if (!feature) {
      return res.status(404).json({
        success: false,
        message: 'Feature not found'
      });
    }
    
    // Get current comments array
    let comments = feature.comments || [];
    if (!Array.isArray(comments)) {
      comments = [];
    }
    
    // Find the comment to delete
    const commentIndex = comments.findIndex(comment => comment.id === commentId);
    
    // If comment doesn't exist
    if (commentIndex === -1) {
      return res.status(404).json({
        success: false,
        message: 'Comment not found'
      });
    }
    
    // Check if user is authorized to delete this comment
    if (comments[commentIndex].userId !== userId) {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to delete this comment'
      });
    }
    
    // Remove the comment from the array
    comments.splice(commentIndex, 1);
    
    // Update the feature with the new comments array
    try {
      await Feature.sequelize.query(
        `UPDATE features SET comments = $comments, "updatedAt" = NOW() WHERE id = $featureId`,
        {
          bind: { 
            comments: JSON.stringify(comments),
            featureId: featureId
          },
          type: Feature.sequelize.QueryTypes.UPDATE
        }
      );
      
      console.log(`Comment ${commentId} deleted successfully from feature ${featureId}`);
    } catch (sqlError) {
      console.error('Error updating feature with SQL query:', sqlError);
      throw sqlError;
    }
    
    res.status(200).json({
      success: true,
      message: 'Comment deleted successfully'
    });
  } catch (err) {
    console.error('Error deleting comment:', err);
    res.status(400).json({
      success: false,
      message: err.message
    });
  }
};

/**
 * @desc    Edit a comment on a feature
 * @route   PUT /api/features/:id/comments/:commentId
 * @access  Private (Comment creator only)
 */
exports.editComment = async (req, res) => {
  try {
    const { id: featureId, commentId } = req.params;
    const userId = req.user.id;
    const { text } = req.body;
    
    if (!text || !text.trim()) {
      return res.status(400).json({
        success: false,
        message: 'Comment text is required'
      });
    }
    
    console.log(`Attempting to edit comment ${commentId} on feature ${featureId} by user ${userId}`);

    // Get the feature with its comments
    const feature = await Feature.findByPk(featureId);
    
    if (!feature) {
      return res.status(404).json({
        success: false,
        message: 'Feature not found'
      });
    }
    
    // Get current comments array
    let comments = feature.comments || [];
    if (!Array.isArray(comments)) {
      comments = [];
    }
    
    // Find the comment to edit
    const commentIndex = comments.findIndex(comment => comment.id === commentId);
    
    // If comment doesn't exist
    if (commentIndex === -1) {
      return res.status(404).json({
        success: false,
        message: 'Comment not found'
      });
    }
    
    // Check if user is authorized to edit this comment
    if (comments[commentIndex].userId !== userId) {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to edit this comment'
      });
    }
    
    // Update the comment text and add lastEdited timestamp
    comments[commentIndex].text = text;
    comments[commentIndex].lastEdited = new Date().toISOString();
    
    // Update the feature with the edited comment
    try {
      await Feature.sequelize.query(
        `UPDATE features SET comments = $comments, "updatedAt" = NOW() WHERE id = $featureId`,
        {
          bind: { 
            comments: JSON.stringify(comments),
            featureId: featureId
          },
          type: Feature.sequelize.QueryTypes.UPDATE
        }
      );
      
      console.log(`Comment ${commentId} edited successfully on feature ${featureId}`);
    } catch (sqlError) {
      console.error('Error updating feature with SQL query:', sqlError);
      throw sqlError;
    }
    
    res.status(200).json({
      success: true,
      data: comments[commentIndex]
    });
  } catch (err) {
    console.error('Error editing comment:', err);
    res.status(400).json({
      success: false,
      message: err.message
    });
  }
}; 