const { FeatureDependency, Feature, User } = require('../models');
const { Op } = require('sequelize');

// Dependency type configurations
const DEPENDENCY_TYPES = {
  blocks: {
    label: 'Blocks',
    description: 'This feature blocks the target feature',
    inverse: 'blocked_by'
  },
  blocked_by: {
    label: 'Blocked by',
    description: 'This feature is blocked by the target feature',
    inverse: 'blocks'
  },
  depends_on: {
    label: 'Depends on',
    description: 'This feature depends on the target feature',
    inverse: null // depends_on doesn't have an automatic inverse
  },
  relates_to: {
    label: 'Relates to',
    description: 'This feature is related to the target feature',
    inverse: 'relates_to' // relates_to is symmetric
  }
};

/**
 * @desc    Get dependencies for a feature
 * @route   GET /api/features/:featureId/dependencies
 * @access  Public
 */
exports.getFeatureDependencies = async (req, res) => {
  try {
    const { featureId } = req.params;

    // Verify the feature exists
    const feature = await Feature.findByPk(featureId);
    if (!feature) {
      return res.status(404).json({
        success: false,
        message: 'Feature not found'
      });
    }

    // Get outgoing dependencies (dependencies this feature has)
    const outgoingDependencies = await FeatureDependency.findAll({
      where: { sourceFeatureId: featureId },
      include: [
        {
          model: Feature,
          as: 'targetFeature',
          attributes: ['id', 'title', 'status', 'priority', 'type'],
          include: [
            {
              model: User,
              as: 'assignee',
              attributes: ['id', 'name', 'email', 'avatar']
            }
          ]
        },
        {
          model: User,
          as: 'creator',
          attributes: ['id', 'name', 'email']
        }
      ],
      order: [['createdAt', 'DESC']]
    });

    // Get incoming dependencies (dependencies on this feature)
    const incomingDependencies = await FeatureDependency.findAll({
      where: { targetFeatureId: featureId },
      include: [
        {
          model: Feature,
          as: 'sourceFeature',
          attributes: ['id', 'title', 'status', 'priority', 'type'],
          include: [
            {
              model: User,
              as: 'assignee',
              attributes: ['id', 'name', 'email', 'avatar']
            }
          ]
        },
        {
          model: User,
          as: 'creator',
          attributes: ['id', 'name', 'email']
        }
      ],
      order: [['createdAt', 'DESC']]
    });

    // Calculate dependency statistics
    const stats = {
      totalOutgoing: outgoingDependencies.length,
      totalIncoming: incomingDependencies.length,
      blockingCount: outgoingDependencies.filter(dep => dep.dependencyType === 'blocks').length,
      blockedByCount: incomingDependencies.filter(dep => dep.dependencyType === 'blocks').length,
      dependsOnCount: outgoingDependencies.filter(dep => dep.dependencyType === 'depends_on').length,
      relatedCount: outgoingDependencies.filter(dep => dep.dependencyType === 'relates_to').length + 
                   incomingDependencies.filter(dep => dep.dependencyType === 'relates_to').length
    };

    // Check if feature is blocked (has incomplete dependencies)
    const isBlocked = incomingDependencies.some(dep => 
      ['blocks', 'depends_on'].includes(dep.dependencyType) && 
      dep.sourceFeature.status !== 'done'
    );

    res.status(200).json({
      success: true,
      data: {
        feature: {
          id: feature.id,
          title: feature.title,
          status: feature.status
        },
        outgoing: outgoingDependencies,
        incoming: incomingDependencies,
        stats,
        isBlocked
      }
    });

  } catch (err) {
    console.error('Error fetching feature dependencies:', err);
    res.status(500).json({
      success: false,
      message: 'Server Error',
      error: err.message
    });
  }
};

/**
 * @desc    Create a new dependency
 * @route   POST /api/features/:featureId/dependencies
 * @access  Private
 */
exports.createDependency = async (req, res) => {
  try {
    const { featureId } = req.params;
    const { targetFeatureId, dependencyType, description } = req.body;

    console.log('Creating dependency with data:', {
      featureId,
      targetFeatureId,
      dependencyType,
      description,
      userId: req.user?.id
    });

    // Validate required fields
    if (!targetFeatureId || !dependencyType) {
      console.log('Validation failed: Missing required fields', { targetFeatureId, dependencyType });
      return res.status(400).json({
        success: false,
        message: 'Target feature ID and dependency type are required'
      });
    }

    // Validate dependency type
    if (!DEPENDENCY_TYPES[dependencyType]) {
      console.log('Validation failed: Invalid dependency type', { dependencyType });
      return res.status(400).json({
        success: false,
        message: 'Invalid dependency type'
      });
    }

    // Verify both features exist and are in the same team
    const [sourceFeature, targetFeature] = await Promise.all([
      Feature.findByPk(featureId),
      Feature.findByPk(targetFeatureId)
    ]);

    console.log('Features found:', {
      sourceFeature: sourceFeature ? { id: sourceFeature.id, teamId: sourceFeature.teamId } : null,
      targetFeature: targetFeature ? { id: targetFeature.id, teamId: targetFeature.teamId } : null
    });

    if (!sourceFeature || !targetFeature) {
      console.log('Validation failed: One or both features not found');
      return res.status(404).json({
        success: false,
        message: 'One or both features not found'
      });
    }

    if (sourceFeature.teamId !== targetFeature.teamId) {
      console.log('Validation failed: Features in different teams', {
        sourceTeamId: sourceFeature.teamId,
        targetTeamId: targetFeature.teamId
      });
      return res.status(400).json({
        success: false,
        message: 'Dependencies can only be created between features in the same team'
      });
    }

    // Check if dependency already exists (including inverse relationships)
    const existingDependency = await FeatureDependency.findOne({
      where: {
        sourceFeatureId: featureId,
        targetFeatureId,
        dependencyType
      }
    });

    if (existingDependency) {
      console.log('Validation failed: Dependency already exists');
      return res.status(400).json({
        success: false,
        message: 'This dependency already exists'
      });
    }

    // Check if inverse relationship already exists
    const inverseType = DEPENDENCY_TYPES[dependencyType].inverse;
    if (inverseType) {
      const existingInverse = await FeatureDependency.findOne({
        where: {
          sourceFeatureId: targetFeatureId,
          targetFeatureId: featureId,
          dependencyType: inverseType
        }
      });

      if (existingInverse) {
        console.log('Validation failed: Inverse dependency already exists');
        return res.status(400).json({
          success: false,
          message: `This dependency already exists as a "${DEPENDENCY_TYPES[inverseType].label}" relationship`
        });
      }
    }

    console.log('Creating dependency with validated data:', {
      sourceFeatureId: featureId,
      targetFeatureId,
      dependencyType,
      description,
      createdBy: req.user.id
    });

    // Create the dependency
    const dependency = await FeatureDependency.create({
      sourceFeatureId: featureId,
      targetFeatureId,
      dependencyType,
      description,
      createdBy: req.user.id
    });

    console.log('Dependency created successfully:', dependency.id);

    // Create inverse relationship if applicable
    if (inverseType) {
      console.log('Creating inverse dependency:', { inverseType });
      // Check if inverse already exists (double-check since we already validated above)
      const existingInverse = await FeatureDependency.findOne({
        where: {
          sourceFeatureId: targetFeatureId,
          targetFeatureId: featureId,
          dependencyType: inverseType
        }
      });

      if (!existingInverse) {
        await FeatureDependency.create({
          sourceFeatureId: targetFeatureId,
          targetFeatureId: featureId,
          dependencyType: inverseType,
          description: `Inverse of: ${description || 'No description'}`,
          createdBy: req.user.id
        });
        console.log('Inverse dependency created successfully');
      } else {
        console.log('Inverse dependency already exists, skipping');
      }
    }

    // Fetch the created dependency with related data
    const createdDependency = await FeatureDependency.findByPk(dependency.id, {
      include: [
        {
          model: Feature,
          as: 'sourceFeature',
          attributes: ['id', 'title', 'status', 'priority', 'type']
        },
        {
          model: Feature,
          as: 'targetFeature',
          attributes: ['id', 'title', 'status', 'priority', 'type']
        },
        {
          model: User,
          as: 'creator',
          attributes: ['id', 'name', 'email']
        }
      ]
    });

    res.status(201).json({
      success: true,
      data: createdDependency
    });

  } catch (err) {
    console.error('Error creating dependency - Full error:', err);
    console.error('Error stack:', err.stack);
    
    // Handle specific validation errors
    if (err.message.includes('circular dependency')) {
      return res.status(400).json({
        success: false,
        message: err.message
      });
    }

    // Handle Sequelize validation errors
    if (err.name === 'SequelizeValidationError') {
      console.error('Sequelize validation error:', err.errors);
      return res.status(400).json({
        success: false,
        message: 'Validation error: ' + err.errors.map(e => e.message).join(', ')
      });
    }

    // Handle Sequelize unique constraint errors
    if (err.name === 'SequelizeUniqueConstraintError') {
      console.error('Sequelize unique constraint error:', err.errors);
      return res.status(400).json({
        success: false,
        message: 'This dependency relationship already exists'
      });
    }

    res.status(500).json({
      success: false,
      message: 'Server Error',
      error: err.message
    });
  }
};

/**
 * @desc    Delete a dependency
 * @route   DELETE /api/features/:featureId/dependencies/:dependencyId
 * @access  Private
 */
exports.deleteDependency = async (req, res) => {
  try {
    const { featureId, dependencyId } = req.params;

    // Find the dependency
    const dependency = await FeatureDependency.findOne({
      where: {
        id: dependencyId,
        sourceFeatureId: featureId
      }
    });

    if (!dependency) {
      return res.status(404).json({
        success: false,
        message: 'Dependency not found'
      });
    }

    // Check if user has permission to delete (creator or team member)
    // For now, we'll allow any authenticated user to delete
    // TODO: Add proper permission checking

    // Delete inverse relationship if it exists
    const inverseType = DEPENDENCY_TYPES[dependency.dependencyType].inverse;
    if (inverseType) {
      await FeatureDependency.destroy({
        where: {
          sourceFeatureId: dependency.targetFeatureId,
          targetFeatureId: dependency.sourceFeatureId,
          dependencyType: inverseType
        }
      });
    }

    // Delete the main dependency
    await dependency.destroy();

    res.status(200).json({
      success: true,
      message: 'Dependency deleted successfully'
    });

  } catch (err) {
    console.error('Error deleting dependency:', err);
    res.status(500).json({
      success: false,
      message: 'Server Error',
      error: err.message
    });
  }
};

/**
 * @desc    Get all dependencies for a team
 * @route   GET /api/teams/:teamId/dependencies
 * @access  Private
 */
exports.getTeamDependencies = async (req, res) => {
  try {
    const { teamId } = req.params;

    // Get all dependencies for features in this team
    const dependencies = await FeatureDependency.findAll({
      include: [
        {
          model: Feature,
          as: 'sourceFeature',
          where: { teamId },
          attributes: ['id', 'title', 'status', 'priority', 'type', 'teamId'],
          include: [
            {
              model: User,
              as: 'assignee',
              attributes: ['id', 'name', 'email', 'avatar']
            }
          ]
        },
        {
          model: Feature,
          as: 'targetFeature',
          attributes: ['id', 'title', 'status', 'priority', 'type'],
          include: [
            {
              model: User,
              as: 'assignee',
              attributes: ['id', 'name', 'email', 'avatar']
            }
          ]
        },
        {
          model: User,
          as: 'creator',
          attributes: ['id', 'name', 'email']
        }
      ],
      order: [['createdAt', 'DESC']]
    });

    // Group dependencies by type for analytics
    const dependencyStats = {
      total: dependencies.length,
      byType: {
        blocks: dependencies.filter(dep => dep.dependencyType === 'blocks').length,
        blocked_by: dependencies.filter(dep => dep.dependencyType === 'blocked_by').length,
        depends_on: dependencies.filter(dep => dep.dependencyType === 'depends_on').length,
        relates_to: dependencies.filter(dep => dep.dependencyType === 'relates_to').length
      },
      blockedFeatures: new Set(
        dependencies
          .filter(dep => dep.dependencyType === 'blocked_by' && dep.targetFeature.status !== 'done')
          .map(dep => dep.sourceFeatureId)
      ).size
    };

    res.status(200).json({
      success: true,
      data: {
        dependencies,
        stats: dependencyStats
      }
    });

  } catch (err) {
    console.error('Error fetching team dependencies:', err);
    res.status(500).json({
      success: false,
      message: 'Server Error',
      error: err.message
    });
  }
};

/**
 * @desc    Get dependency types and their configurations
 * @route   GET /api/dependencies/types
 * @access  Public
 */
exports.getDependencyTypes = async (req, res) => {
  try {
    res.status(200).json({
      success: true,
      data: DEPENDENCY_TYPES
    });
  } catch (err) {
    console.error('Error fetching dependency types:', err);
    res.status(500).json({
      success: false,
      message: 'Server Error',
      error: err.message
    });
  }
}; 