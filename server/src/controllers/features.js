const { Feature, User, Comment, Vote } = require('../models');
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
    const feature = await Feature.findByPk(req.params.id, {
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
        },
        {
          model: Comment,
          as: 'comments',
          include: [
            {
              model: User,
              as: 'user',
              attributes: ['id', 'name', 'email', 'avatar']
            }
          ]
        },
        {
          model: Vote,
          as: 'voterRecords',
          include: [
            {
              model: User,
              as: 'user',
              attributes: ['id', 'name', 'email']
            }
          ]
        }
      ]
    });
    
    if (!feature) {
      return res.status(404).json({
        success: false,
        message: 'Feature not found'
      });
    }
    
    res.status(200).json({
      success: true,
      data: feature
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
 * @desc    Create new feature
 * @route   POST /api/features
 * @access  Private
 */
exports.createFeature = async (req, res) => {
  try {
    // Add user to req.body
    req.body.requestedById = req.user.id;
    
    const feature = await Feature.create(req.body);
    
    res.status(201).json({
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
 * @route   PUT /api/features/:id/vote
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
    
    // Check if user has already voted
    const existingVote = await Vote.findOne({
      where: {
        userId: req.user.id,
        featureId: req.params.id
      }
    });
    
    if (existingVote) {
      // Remove vote
      await existingVote.destroy();
      await feature.update({ votes: feature.votes - 1 });
    } else {
      // Add vote
      await Vote.create({
        userId: req.user.id,
        featureId: req.params.id
      });
      await feature.update({ votes: feature.votes + 1 });
    }
    
    // Get updated feature
    const updatedFeature = await Feature.findByPk(req.params.id, {
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
        },
        {
          model: Vote,
          as: 'voterRecords',
          include: [
            {
              model: User,
              as: 'user',
              attributes: ['id', 'name', 'email']
            }
          ]
        }
      ]
    });
    
    res.status(200).json({
      success: true,
      data: updatedFeature
    });
  } catch (err) {
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
    const feature = await Feature.findByPk(req.params.id);
    
    if (!feature) {
      return res.status(404).json({
        success: false,
        message: 'Feature not found'
      });
    }
    
    const comment = await Comment.create({
      text: req.body.text,
      userId: req.user.id,
      featureId: req.params.id
    });
    
    // Get the comment with user data
    const commentWithUser = await Comment.findByPk(comment.id, {
      include: [
        {
          model: User,
          as: 'user',
          attributes: ['id', 'name', 'email', 'avatar']
        }
      ]
    });
    
    res.status(200).json({
      success: true,
      data: commentWithUser
    });
  } catch (err) {
    res.status(400).json({
      success: false,
      message: err.message
    });
  }
}; 