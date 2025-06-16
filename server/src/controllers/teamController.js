const { Team, User, TeamMember, Feature } = require('../models');
const { validateTeamSize, validateUserTeamCount } = require('../utils/teamValidation');
const { sendInvitationEmail } = require('../utils/email');
const ApiError = require('../utils/ApiError');

/**
 * Create a new team
 * @route POST /api/teams
 * @access Private
 */
const createTeam = async (req, res) => {
  const { name, description } = req.body;
  const userId = req.user.id;
  const userEmail = req.user.email;

  try {
    // Create team
    const team = await Team.create({
      name,
      description,
      createdBy: userId,
      createdByEmail: userEmail
    });

    // Add creator as admin
    await TeamMember.create({
      teamId: team.id,
      userId: userId,
      role: 'admin'
    });

    res.status(201).json({
      success: true,
      data: team
    });
  } catch (error) {
    throw new ApiError(error.message, 400);
  }
};

/**
 * Update team details
 * @route PUT /api/teams/:teamId
 * @access Private (Admin only)
 */
const updateTeam = async (req, res) => {
  const { teamId } = req.params;
  const { name, description } = req.body;
  const userId = req.user.id;

  try {
    // Check if user is team admin
    const membership = await TeamMember.findOne({
      where: { teamId, userId, role: 'admin' }
    });

    if (!membership) {
      return res.status(403).json({
        success: false,
        error: 'Not authorized to update team'
      });
    }

    // Find and update team
    const team = await Team.findByPk(teamId);
    if (!team) {
      return res.status(404).json({
        success: false,
        error: 'Team not found'
      });
    }

    await team.update({ name, description });

    res.json({
      success: true,
      data: team
    });
  } catch (error) {
    res.status(error.statusCode || 400).json({
      success: false,
      error: error.message
    });
  }
};

/**
 * Delete a team
 * @route DELETE /api/teams/:teamId
 * @access Private (Admin only)
 */
const deleteTeam = async (req, res) => {
  const { teamId } = req.params;
  const userId = req.user.id;

  try {
    // Check if user is admin
    const membership = await TeamMember.findOne({
      where: { teamId, userId, role: 'admin' }
    });

    if (!membership) {
      throw new ApiError('Not authorized to delete team', 403);
    }

    const team = await Team.findByPk(teamId);
    if (!team) {
      throw new ApiError('Team not found', 404);
    }

    // Delete all features associated with the team
    await Feature.destroy({ where: { teamId } });

    // Delete all team members
    await TeamMember.destroy({ where: { teamId } });

    // Delete the team
    await team.destroy();

    res.json({
      success: true,
      data: {}
    });
  } catch (error) {
    throw new ApiError(error.message, error.statusCode || 400);
  }
};

/**
 * @desc    Add member to team
 * @route   POST /api/teams/:teamId/members
 * @access  Private
 */
const addTeamMember = async (req, res) => {
  const { teamId } = req.params;
  const { email, role = 'member' } = req.body;
  const userId = req.user.id;

  try {
    // Check if user is team admin
    const membership = await TeamMember.findOne({
      where: { teamId, userId, role: 'admin' }
    });

    if (!membership) {
      return res.status(403).json({
        success: false,
        error: 'Not authorized to add team members'
      });
    }

    // Get team details for the invitation email
    const team = await Team.findByPk(teamId);
    if (!team) {
      return res.status(404).json({
        success: false,
        error: 'Team not found'
      });
    }

    // Find user by email or create if doesn't exist
    let userToAdd = await User.findOne({ where: { email } });
    let isNewUser = false;
    
    if (!userToAdd) {
      // Create a new user account
      const tempPassword = Math.random().toString(36).slice(-8) + Math.random().toString(36).slice(-8);
      userToAdd = await User.create({
        name: email.split('@')[0], // Use email prefix as default name
        email: email,
        password: tempPassword, // They'll need to reset this
        firebaseUid: null // Will be set when they sign in with Firebase
      });
      isNewUser = true;
    }

    // Check if user is already a member
    const existingMember = await TeamMember.findOne({
      where: { teamId, userId: userToAdd.id }
    });

    if (existingMember) {
      return res.status(400).json({
        success: false,
        error: 'User is already a team member'
      });
    }

    // Validate team size
    const memberCount = await TeamMember.count({ where: { teamId } });
    if (memberCount >= 10) {
      return res.status(400).json({
        success: false,
        error: 'Team size limit exceeded'
      });
    }

    // Add user to team
    const teamMember = await TeamMember.create({
      teamId,
      userId: userToAdd.id,
      role: role || 'member'
    });

    // Send invitation email
    try {
      await sendInvitationEmail(
        userToAdd.email,
        team.name,
        req.user.name || req.user.email,
        isNewUser
      );
    } catch (emailError) {
      // Don't fail the request if email fails, just log it
    }

    res.status(201).json({
      success: true,
      data: {
        ...teamMember.toJSON(),
        user: {
          id: userToAdd.id,
          name: userToAdd.name,
          email: userToAdd.email
        },
        isNewUser
      },
      message: isNewUser 
        ? `Invitation sent to ${email}. They will receive an email with instructions to join.`
        : `${email} has been added to the team.`
    });
  } catch (error) {
    res.status(error.statusCode || 400).json({
      success: false,
      error: error.message
    });
  }
};

/**
 * Remove user from team
 * @route DELETE /api/teams/:teamId/members/:userId
 * @access Private (Admin only)
 */
const removeTeamMember = async (req, res) => {
  const { teamId, userId: targetUserId } = req.params;
  const adminId = req.user.id;

  try {
    // Validate required parameters
    if (!teamId) {
      return res.status(400).json({
        success: false,
        error: 'Team ID is required'
      });
    }

    if (!targetUserId || targetUserId === 'undefined') {
      return res.status(400).json({
        success: false,
        error: 'User ID is required'
      });
    }

    if (!adminId) {
      return res.status(400).json({
        success: false,
        error: 'Admin authentication required'
      });
    }

    // Check if admin
    const adminMembership = await TeamMember.findOne({
      where: { teamId, userId: adminId, role: 'admin' }
    });

    if (!adminMembership) {
      return res.status(403).json({
        success: false,
        error: 'Not authorized to remove team members'
      });
    }

    // Find and remove membership
    const membership = await TeamMember.findOne({
      where: { teamId, userId: targetUserId }
    });

    if (!membership) {
      return res.status(404).json({
        success: false,
        error: 'Team member not found'
      });
    }

    await membership.destroy();

    res.json({
      success: true,
      data: {}
    });
  } catch (error) {
    console.error('Error in removeTeamMember:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to remove team member'
    });
  }
};

/**
 * Update team member role
 * @route PUT /api/teams/:teamId/members/:userId
 * @access Private (Admin only)
 */
const updateTeamMemberRole = async (req, res) => {
  const { teamId, userId: targetUserId } = req.params;
  const { role } = req.body;
  const adminId = req.user.id;

  try {
    // Check if admin
    const adminMembership = await TeamMember.findOne({
      where: { teamId, userId: adminId, role: 'admin' }
    });

    if (!adminMembership) {
      throw new ApiError('Not authorized to update member roles', 403);
    }

    // Find and update membership
    const membership = await TeamMember.findOne({
      where: { teamId, userId: targetUserId }
    });

    if (!membership) {
      throw new ApiError('Team member not found', 404);
    }

    await membership.update({ role });

    res.json({
      success: true,
      data: membership
    });
  } catch (error) {
    throw new ApiError(error.message, error.statusCode || 400);
  }
};

/**
 * Get all members of a team
 * @route GET /api/teams/:teamId/members
 * @access Private (Team members only)
 */
const getTeamMembers = async (req, res) => {
  const { teamId } = req.params;
  const userId = req.user.id;

  try {
    // Check if user is team member
    const membership = await TeamMember.findOne({
      where: { teamId, userId }
    });

    if (!membership) {
      return res.status(403).json({
        success: false,
        error: 'You do not have permission to view team members'
      });
    }

    // Get team members
    const members = await TeamMember.findAll({
      where: { teamId },
      include: [{
        model: User,
        attributes: ['id', 'name', 'email']
      }]
    });

    // Filter out members where User association failed
    const validMembers = members
      .filter(member => member.User && member.User.id)
      .map(member => ({
        id: member.User.id,
        userId: member.User.id, // Include userId for removeTeamMember compatibility
        name: member.User.name,
        email: member.User.email,
        role: member.role,
        joinedAt: member.joinedAt
      }));

    res.json({
      success: true,
      data: validMembers
    });
  } catch (error) {
    console.error('Error fetching team members:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch team members'
    });
  }
};

/**
 * Get team settings
 * @route GET /api/teams/:teamId/settings
 * @access Private (Admin only)
 */
const getTeamSettings = async (req, res) => {
  const { teamId } = req.params;
  const userId = req.user.id;

  try {
    // Check if admin
    const membership = await TeamMember.findOne({
      where: { teamId, userId, role: 'admin' }
    });

    if (!membership) {
      throw new ApiError('Not authorized to view team settings', 403);
    }

    const team = await Team.findByPk(teamId, {
      include: [{
        model: User,
        as: 'members',
        through: { attributes: ['role', 'joinedAt'] }
      }]
    });

    if (!team) {
      throw new ApiError('Team not found', 404);
    }

    res.json({
      success: true,
      data: team
    });
  } catch (error) {
    throw new ApiError(error.message, error.statusCode || 400);
  }
};

/**
 * Get user's teams
 * @route GET /api/teams/my-teams
 * @access Private
 */
const getMyTeams = async (req, res) => {
  const userId = req.user.id;

  try {
    const teams = await Team.findAll({
      include: [{
        model: User,
        as: 'members',
        through: { attributes: ['role', 'joinedAt'] },
        where: { id: userId }
      }],
      attributes: ['id', 'name', 'description', 'createdBy', 'createdByEmail', 'createdAt']
    });

    res.json({
      success: true,
      data: teams
    });
  } catch (error) {
    throw new ApiError(error.message, error.statusCode || 400);
  }
};

/**
 * Get team features
 * @route GET /api/teams/:teamId/features
 * @access Private (Team members only)
 */
const getTeamFeatures = async (req, res) => {
  const { teamId } = req.params;
  const userId = req.user.id;

  try {
    // Check if user is team member
    const membership = await TeamMember.findOne({
      where: { teamId, userId }
    });

    if (!membership) {
      throw new ApiError('Not authorized to view team features', 403);
    }

    // Get only columns that are guaranteed to exist
    const features = await Feature.findAll({
      attributes: [
        'id', 'title', 'description', 'status', 'priority', 
        'teamId', 'createdBy', 'createdAt', 'updatedAt'
      ],
      where: { teamId },
      include: [{
        model: User,
        as: 'creator',
        attributes: ['id', 'name', 'email']
      }],
      order: [
        ['priority', 'DESC'],
        ['createdAt', 'DESC']
      ]
    });

    // Add default values for missing columns
    const enhancedFeatures = features.map(feature => {
      const featureJson = feature.toJSON();
      // Add fields that might be missing with default values
      return {
        ...featureJson,
        votes: 0,
        impact: 5,
        effort: 5,
        category: 'functionality',
        tags: featureJson.tags || [],
        comments: featureJson.comments || []
      };
    });

    res.json({
      success: true,
      data: enhancedFeatures
    });
  } catch (error) {
    console.error('Error fetching team features:', error);
    res.status(error.statusCode || 400).json({
      success: false,
      error: error.message
    });
  }
};

/**
 * Create feature for team
 * @route POST /api/teams/:teamId/features
 * @access Private (Team members only)
 */
const createTeamFeature = async (req, res) => {
  const { teamId } = req.params;
  const { 
    title, 
    description, 
    priority,
    status,
    impact,
    effort,
    category,
    targetRelease,
    tags,
  } = req.body;
  const userId = req.user.id;
  const userEmail = req.user.email;

  try {
    // Validate teamId format
    if (!teamId || typeof teamId !== 'string' || !/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(teamId)) {
      console.error(`Invalid teamId format: ${teamId}`);
      return res.status(400).json({
        success: false,
        error: `Invalid teamId format: ${teamId}. Must be a valid UUID.`
      });
    }

    // Check if user is team member
    const membership = await TeamMember.findOne({
      where: { teamId, userId }
    });

    if (!membership) {
      return res.status(403).json({
        success: false,
        error: 'Not authorized to create features for this team'
      });
    }
    
    // Log received values for troubleshooting
    console.log('Creating feature with data:', { 
      title, description, priority, status, 
      impact, effort, category, targetRelease, tags
    });
    
    // Check the actual database enum values
    try {
      const describeResult = await Feature.sequelize.query("SHOW COLUMNS FROM features LIKE 'status'");
      console.log('Database status enum values:', describeResult[0][0].Type);
    } catch (err) {
      console.error('Error checking enum values:', err);
    }
    
    // Make sure status is one of the allowed values
    // Check case sensitivity in the enum values
    let sanitizedStatus;
    
    // Force the status to use one of the exact values expected by the database schema
    // This handles potential case sensitivity issues
    const statusMap = {
      // Current database values
      'backlog': 'backlog',
      'in_progress': 'in_progress', 
      'review': 'review',
      'done': 'done',
      
      // Map from the frontend's logical names to database values
      'planned': 'backlog',
      'in-progress': 'in_progress',
      'in_progress': 'in_progress',
      'inprogress': 'in_progress',
      'in-review': 'review',
      'inreview': 'review',
      'completed': 'done',
      'cancelled': 'done'
    };
    
    if (status && statusMap[status]) {
      sanitizedStatus = statusMap[status];
    } else {
      sanitizedStatus = 'in_progress'; // Default to in_progress as fallback
    }
    
    console.log(`Status received: "${status}" (${typeof status}), sanitized to: "${sanitizedStatus}"`);

    // Create feature with the sanitized status
    const feature = await Feature.create({
      title,
      description,
      priority,
      status: sanitizedStatus,
      teamId,
      createdBy: userId,
      createdByEmail: userEmail,
      votes: 0,
      impact: impact || 5,
      effort: effort || 5,
      category,
      targetRelease,
      tags: tags || [],
      comments: []
    });

    res.status(201).json({
      success: true,
      data: feature
    });
  } catch (error) {
    console.error('Error creating feature:', error);
    res.status(error.statusCode || 400).json({
      success: false,
      error: error.message
    });
  }
};

/**
 * Update feature
 * @route PUT /api/teams/:teamId/features/:featureId
 * @access Private (Team members only)
 */
const updateTeamFeature = async (req, res) => {
  const { teamId, featureId } = req.params;
  const { title, description, status, priority } = req.body;
  const userId = req.user.id;

  try {
    // Check if user is team member
    const membership = await TeamMember.findOne({
      where: { teamId, userId }
    });

    if (!membership) {
      return res.status(403).json({
        success: false,
        error: 'Not authorized to update team features'
      });
    }

    // Check if feature exists and belongs to team
    const feature = await Feature.findOne({
      where: { id: featureId, teamId }
    });

    if (!feature) {
      return res.status(404).json({
        success: false,
        error: 'Feature not found'
      });
    }

    // Only admin and product-owner can change status
    if (status && !['admin', 'product-owner'].includes(membership.role)) {
      return res.status(403).json({
        success: false,
        error: 'Not authorized to change feature status'
      });
    }

    // Only update fields that are guaranteed to exist
    const updateData = {};
    if (title) updateData.title = title;
    if (description) updateData.description = description;
    if (status) updateData.status = status;
    if (priority) updateData.priority = priority;

    await feature.update(updateData);

    // Add missing fields with default values
    const updatedFeature = feature.toJSON();
    const enhancedFeature = {
      ...updatedFeature,
      votes: updatedFeature.votes || 0,
      impact: updatedFeature.impact || 5,
      effort: updatedFeature.effort || 5,
      category: updatedFeature.category || 'functionality',
      tags: updatedFeature.tags || [],
      comments: updatedFeature.comments || []
    };

    res.json({
      success: true,
      data: enhancedFeature
    });
  } catch (error) {
    console.error('Error updating team feature:', error);
    res.status(error.statusCode || 400).json({
      success: false,
      error: error.message
    });
  }
};

/**
 * Delete feature
 * @route DELETE /api/teams/:teamId/features/:featureId
 * @access Private (Admin and Product Owner only)
 */
const deleteTeamFeature = async (req, res) => {
  const { teamId, featureId } = req.params;
  const userId = req.user.id;

  try {
    // Check if user is admin or product-owner
    const membership = await TeamMember.findOne({
      where: { 
        teamId, 
        userId,
        role: ['admin', 'product-owner']
      }
    });

    if (!membership) {
      throw new ApiError('Not authorized to delete team features', 403);
    }

    // Check if feature exists and belongs to team
    const feature = await Feature.findOne({
      where: { id: featureId, teamId }
    });

    if (!feature) {
      throw new ApiError('Feature not found', 404);
    }

    await feature.destroy();

    res.json({
      success: true,
      data: {}
    });
  } catch (error) {
    throw new ApiError(error.message, error.statusCode || 400);
  }
};

/**
 * Get a team by ID
 * @route GET /api/teams/:teamId
 * @access Private (Team members only)
 */
const getTeamById = async (req, res) => {
  const { teamId } = req.params;
  const userId = req.user.id;

  try {
    console.log(`Getting team details for teamId: ${teamId}, userId: ${userId}`);
    
    // Check if user is team member
    const membership = await TeamMember.findOne({
      where: { teamId, userId }
    });

    if (!membership) {
      return res.status(403).json({
        success: false,
        error: 'Not authorized to view this team'
      });
    }

    // Get team details without members to avoid association issues
    const team = await Team.findByPk(teamId, {
      attributes: ['id', 'name', 'description', 'createdBy', 'createdByEmail', 'createdAt'],
    });

    if (!team) {
      return res.status(404).json({
        success: false,
        error: 'Team not found'
      });
    }

    // Get member count separately
    const memberCount = await TeamMember.count({
      where: { teamId }
    });

    // Get creator details
    let creator = null;
    if (team.createdBy) {
      creator = await User.findByPk(team.createdBy, {
        attributes: ['id', 'name', 'email']
      });
    }

    const enhancedTeam = {
      ...team.toJSON(),
      memberCount,
      creator: creator ? {
        id: creator.id,
        name: creator.name,
        email: creator.email
      } : null
    };

    res.json({
      success: true,
      data: enhancedTeam
    });
  } catch (error) {
    console.error('Error fetching team details:', error);
    res.status(error.statusCode || 500).json({
      success: false,
      error: error.message || 'Internal server error'
    });
  }
};

/**
 * Get feature statistics for a team
 * @route GET /api/teams/:teamId/features/stats
 * @access Private (Team members only)
 */
const getTeamFeatureStats = async (req, res) => {
  const { teamId } = req.params;
  const userId = req.user.id;

  try {
    console.log(`Getting feature stats for teamId: ${teamId}, userId: ${userId}`);
    
    // Check if user is team member (with error handling)
    try {
      const membership = await TeamMember.findOne({
        where: { teamId, userId }
      });

      if (!membership) {
        return res.status(403).json({
          success: false,
          error: 'Not authorized to view team statistics'
        });
      }
    } catch (memberError) {
      console.error('Error checking team membership:', memberError);
      return res.status(403).json({
        success: false,
        error: 'Error validating team membership. Please try again.'
      });
    }

    // Get all features for the team
    let features = [];
    try {
      features = await Feature.findAll({
        attributes: ['id', 'status', 'priority'],
        where: { teamId }
      });
    } catch (featureError) {
      console.error('Error fetching features:', featureError);
      // If feature fetch fails, return empty stats rather than error
      features = [];
    }

    // Calculate stats
    const stats = {
      total: features.length,
      byStatus: {
        backlog: features.filter(f => f.status === 'backlog').length,
        inProgress: features.filter(f => f.status === 'in_progress').length,
        review: features.filter(f => f.status === 'review').length,
        done: features.filter(f => f.status === 'done').length
      },
      byPriority: {
        low: features.filter(f => f.priority === 'low').length,
        medium: features.filter(f => f.priority === 'medium').length,
        high: features.filter(f => f.priority === 'high').length,
        critical: features.filter(f => f.priority === 'critical').length
      }
    };

    res.json({
      success: true,
      data: stats
    });
  } catch (error) {
    console.error('Error fetching feature statistics:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch feature statistics'
    });
  }
};

module.exports = {
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
}; 