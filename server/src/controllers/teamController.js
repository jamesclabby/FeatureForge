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
 * Add new team member
 * @route POST /api/teams/:teamId/members
 * @access Private (Admin only)
 */
const addTeamMember = async (req, res) => {
  const { teamId } = req.params;
  const { email, role } = req.body;
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

    // Find user by email
    const userToAdd = await User.findOne({ where: { email } });
    if (!userToAdd) {
      return res.status(404).json({
        success: false,
        error: 'User not found'
      });
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
      role: role || 'user'
    });

    res.status(201).json({
      success: true,
      data: teamMember
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
    // Check if admin
    const adminMembership = await TeamMember.findOne({
      where: { teamId, userId: adminId, role: 'admin' }
    });

    if (!adminMembership) {
      throw new ApiError('Not authorized to remove team members', 403);
    }

    // Find and remove membership
    const membership = await TeamMember.findOne({
      where: { teamId, userId: targetUserId }
    });

    if (!membership) {
      throw new ApiError('Team member not found', 404);
    }

    await membership.destroy();

    res.json({
      success: true,
      data: {}
    });
  } catch (error) {
    throw new ApiError(error.message, error.statusCode || 400);
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
 * Get team members
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
      throw new ApiError('Not authorized to view team members', 403);
    }

    const members = await TeamMember.findAll({
      where: { teamId },
      include: [{
        model: User,
        as: 'user',
        attributes: ['id', 'name', 'email']
      }]
    });

    res.json({
      success: true,
      data: members
    });
  } catch (error) {
    throw new ApiError(error.message, error.statusCode || 400);
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

    const features = await Feature.findAll({
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

    res.json({
      success: true,
      data: features
    });
  } catch (error) {
    throw new ApiError(error.message, error.statusCode || 400);
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
    estimatedEffort,
    dueDate,
    assignedTo,
    tags,
    attachments,
    comments 
  } = req.body;
  const userId = req.user.id;
  const userEmail = req.user.email;

  try {
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

    // Create feature
    const feature = await Feature.create({
      title,
      description,
      priority,
      status,
      teamId,
      createdBy: userId,
      createdByEmail: userEmail,
      estimatedEffort,
      dueDate,
      assignedTo,
      tags: tags || [],
      attachments: attachments || [],
      comments: comments || []
    });

    res.status(201).json({
      success: true,
      data: feature
    });
  } catch (error) {
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
      throw new ApiError('Not authorized to update team features', 403);
    }

    // Check if feature exists and belongs to team
    const feature = await Feature.findOne({
      where: { id: featureId, teamId }
    });

    if (!feature) {
      throw new ApiError('Feature not found', 404);
    }

    // Only admin and product-owner can change status
    if (status && !['admin', 'product-owner'].includes(membership.role)) {
      throw new ApiError('Not authorized to change feature status', 403);
    }

    await feature.update({
      title,
      description,
      status,
      priority
    });

    res.json({
      success: true,
      data: feature
    });
  } catch (error) {
    throw new ApiError(error.message, error.statusCode || 400);
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
  deleteTeamFeature
}; 