const { Team, User, TeamMember, Feature, Comment, FeatureDependency } = require('../models');
const { validateTeamSize, validateUserTeamCount } = require('../utils/teamValidation');
const emailService = require('../services/email/EmailService');
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
      // If user was just created but membership already exists, this is likely a retry
      // Clean up the newly created user if they were just created
      if (isNewUser) {
        try {
          await userToAdd.destroy();
          console.log(`Cleaned up duplicate user: ${userToAdd.email}`);
        } catch (cleanupError) {
          console.error('Failed to cleanup duplicate user:', cleanupError);
        }
      }
      
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

    // Add user to team with mapped role
    const teamMember = await TeamMember.create({
      teamId,
      userId: userToAdd.id,
      role: role || 'member'
    });

    // Send invitation email with timeout
    try {
      // Add timeout wrapper to prevent infinite hangs
      const emailPromise = emailService.sendInvitation({
        email: userToAdd.email,
        teamName: team.name,
        inviterName: req.user.name || req.user.email,
        inviteToken: isNewUser ? null : undefined
      });
      
      // Set 30 second timeout for email sending
      const timeoutPromise = new Promise((_, reject) => {
        setTimeout(() => reject(new Error('Email sending timeout after 30 seconds')), 30000);
      });
      
      await Promise.race([emailPromise, timeoutPromise]);
      console.log(`Invitation email sent successfully to ${userToAdd.email}`);
    } catch (emailError) {
      // Don't fail the request if email fails, just log it
      console.error('Email sending failed:', emailError.message);
      console.error('Email error details:', emailError);
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
    console.error('Error in addTeamMember:', error);
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
      throw new ApiError(403, 'Not authorized to view team features');
    }

    // Get only columns that are guaranteed to exist
    const features = await Feature.findAll({
      attributes: [
        'id', 'title', 'description', 'status', 'priority', 
        'type', 'parentId', 'teamId', 'createdBy', 'createdAt', 'updatedAt',
        'dueDate', 'tags', 'estimatedEffort', 'assignedTo'
      ],
      where: { teamId },
      include: [
        {
          model: User,
          as: 'creator',
          attributes: ['id', 'name', 'email']
        },
        {
          model: User,
          as: 'assignee',
          attributes: ['id', 'name', 'email']
        },
        {
          model: Feature,
          as: 'parent',
          attributes: ['id', 'title', 'type', 'status']
        },
        {
          model: Feature,
          as: 'children',
          attributes: ['id', 'title', 'type', 'status', 'priority']
        },
        {
          model: Comment,
          as: 'commentsList',
          attributes: ['id'],
          required: false
        }
      ],
      order: [
        ['priority', 'DESC'],
        ['createdAt', 'DESC']
      ]
    });

    // Get all dependencies for features in this team
    let allDependencies = [];
    try {
      allDependencies = await FeatureDependency.findAll({
        include: [
          {
            model: Feature,
            as: 'sourceFeature',
            where: { teamId },
            attributes: ['id', 'title', 'status', 'priority', 'type', 'teamId']
          },
          {
            model: Feature,
            as: 'targetFeature',
            attributes: ['id', 'title', 'status', 'priority', 'type']
          }
        ]
      });
    } catch (dependencyError) {
      console.error('Error loading dependencies for team features:', dependencyError);
      // Continue without dependencies if there's an error
      allDependencies = [];
    }

    // Build dependency maps for efficient lookup
    const outgoingDependenciesMap = new Map();
    const incomingDependenciesMap = new Map();

    allDependencies.forEach(dep => {
      const sourceId = dep.sourceFeatureId;
      const targetId = dep.targetFeatureId;

      // Outgoing dependencies (this feature depends on others)
      if (!outgoingDependenciesMap.has(sourceId)) {
        outgoingDependenciesMap.set(sourceId, []);
      }
      outgoingDependenciesMap.get(sourceId).push(dep);

      // Incoming dependencies (others depend on this feature)
      if (!incomingDependenciesMap.has(targetId)) {
        incomingDependenciesMap.set(targetId, []);
      }
      incomingDependenciesMap.get(targetId).push(dep);
    });

    // Add default values for missing columns and dependency stats
    const enhancedFeatures = features.map(feature => {
      const featureJson = feature.toJSON();
      const featureId = featureJson.id;
      
      // Get dependencies for this feature
      const outgoingDeps = outgoingDependenciesMap.get(featureId) || [];
      const incomingDeps = incomingDependenciesMap.get(featureId) || [];

      // Calculate dependency statistics
      const dependencyStats = {
        totalOutgoing: outgoingDeps.length,
        totalIncoming: incomingDeps.length,
        blockingCount: outgoingDeps.filter(dep => dep.dependencyType === 'blocks').length,
        blockedByCount: incomingDeps.filter(dep => dep.dependencyType === 'blocks').length,
        dependsOnCount: outgoingDeps.filter(dep => dep.dependencyType === 'depends_on').length,
        relatedCount: outgoingDeps.filter(dep => dep.dependencyType === 'relates_to').length + 
                     incomingDeps.filter(dep => dep.dependencyType === 'relates_to').length
      };

      // Check if feature is blocked by incomplete dependencies
      const isBlocked = incomingDeps.some(dep => 
        ['blocks', 'depends_on'].includes(dep.dependencyType) && 
        dep.sourceFeature && dep.sourceFeature.status !== 'done'
      );

      dependencyStats.isBlocked = isBlocked;

      // Debug logging for features with dependencies
      if (outgoingDeps.length > 0 || incomingDeps.length > 0) {
        console.log(`Feature "${featureJson.title}" (${featureId}) dependency stats:`, {
          outgoing: outgoingDeps.length,
          incoming: incomingDeps.length,
          isBlocked,
          incomingDeps: incomingDeps.map(dep => ({
            type: dep.dependencyType,
            sourceFeature: dep.sourceFeature?.title,
            sourceStatus: dep.sourceFeature?.status
          }))
        });
      }

      // Add fields that might be missing with default values
      return {
        ...featureJson,
        due_date: featureJson.dueDate, // Add snake_case version for frontend compatibility
        votes: 0,
        impact: 5,
        effort: 5,
        category: 'functionality',
        tags: featureJson.tags || [],
        comments: featureJson.commentsList || [], // Use the actual comments list
        comments_count: featureJson.commentsList ? featureJson.commentsList.length : 0, // Add comment count
        dependencyStats // Add dependency statistics
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
    type,
    parentId,
    priority,
    status,
    impact,
    effort,
    category,
    targetRelease,
    tags,
    dueDate
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
      title, description, type, parentId, priority, status, 
      impact, effort, category, targetRelease, tags, dueDate
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
    console.log(`Type received: "${type}" (${typeof type})`);
    console.log(`ParentId received: "${parentId}" (${typeof parentId})`);

    // Create feature with the sanitized status
    const feature = await Feature.create({
      title,
      description,
      type: type || 'task', // Default to 'task' if not specified
      parentId: parentId === '' || parentId === 'none' ? null : parentId,
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
      comments: [],
      dueDate: dueDate === '' ? null : dueDate
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
  const { title, description, type, parentId, status, priority, dueDate, tags } = req.body;
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

    // Build update data with all supported fields
    const updateData = {};
    if (title !== undefined) updateData.title = title;
    if (description !== undefined) updateData.description = description;
    if (type !== undefined) updateData.type = type;
    if (parentId !== undefined) updateData.parentId = parentId === '' || parentId === 'none' ? null : parentId;
    if (status !== undefined) updateData.status = status;
    if (priority !== undefined) updateData.priority = priority;
    if (dueDate !== undefined) updateData.dueDate = dueDate === '' ? null : dueDate;
    if (tags !== undefined) updateData.tags = tags;

    await feature.update(updateData);

    // Add missing fields with default values
    const updatedFeature = feature.toJSON();
    const enhancedFeature = {
      ...updatedFeature,
      due_date: updatedFeature.dueDate, // Add snake_case version for frontend compatibility
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
        attributes: ['id', 'status', 'priority', 'type'],
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
      },
      byType: {
        parent: features.filter(f => f.type === 'parent').length,
        story: features.filter(f => f.type === 'story').length,
        task: features.filter(f => f.type === 'task').length,
        research: features.filter(f => f.type === 'research').length
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