const express = require('express');
const router = express.Router();
const aiService = require('../services/aiService');
const { protectWithAny } = require('../middleware/auth');
const { Team, TeamMember, Feature, User } = require('../models');
const { Op } = require('sequelize');

/**
 * Send a chat message to AI (public for testing)
 * @route POST /api/chat/message-public
 * @access Public
 */
router.post('/message-public', async (req, res) => {
  try {
    const { message, teamName = 'Test Team', userRole = 'member' } = req.body;

    // Validate input
    if (!message || typeof message !== 'string' || message.trim().length === 0) {
      return res.status(400).json({
        success: false,
        error: 'Message is required and cannot be empty'
      });
    }

    if (message.length > 2000) {
      return res.status(400).json({
        success: false,
        error: 'Message too long. Maximum 2000 characters allowed.'
      });
    }

    // Build basic context for testing
    const context = {
      teamName,
      userRole,
      featuresCount: 0,
      recentActivity: 'none'
    };
    
    console.log(`Public chat request: "${message.substring(0, 50)}..."`);

    // Get AI response
    const aiResponse = await aiService.chat(message, context);

    // Log successful interaction
    console.log(`AI responded with ${aiResponse.length} characters`);

    res.json({
      success: true,
      data: {
        message: aiResponse,
        timestamp: new Date().toISOString(),
        provider: aiService.provider,
        context: {
          teamName: context.teamName,
          userRole: context.userRole
        }
      }
    });

  } catch (error) {
    console.error('Public chat message error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to process chat message',
      details: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

/**
 * Send a chat message to AI
 * @route POST /api/chat/message
 * @access Private
 */
router.post('/message', protectWithAny, async (req, res) => {
  try {
    const { message, teamId } = req.body;
    const userId = req.user.id;

    // Validate input
    if (!message || typeof message !== 'string' || message.trim().length === 0) {
      return res.status(400).json({
        success: false,
        error: 'Message is required and cannot be empty'
      });
    }

    if (message.length > 2000) {
      return res.status(400).json({
        success: false,
        error: 'Message too long. Maximum 2000 characters allowed.'
      });
    }

    // Build context for AI
    const context = await buildChatContext(userId, teamId);
    
    console.log(`Chat request from user ${userId} for team ${teamId}: "${message.substring(0, 50)}..."`);

    // Get AI response
    const aiResponse = await aiService.chat(message, context);

    // Handle structured responses with actions
    if (typeof aiResponse === 'object' && aiResponse.action) {
      console.log(`AI suggested action: ${aiResponse.action}`);
      
      // For simple actions, execute automatically
      if (!aiResponse.requiresConfirmation && aiResponse.parameters.teamId) {
        try {
          let actionResult;
          switch (aiResponse.action) {
            case 'create_feature':
              actionResult = await executeCreateFeature(aiResponse.parameters, userId);
              break;
            case 'update_feature':
              actionResult = await executeUpdateFeature(aiResponse.parameters, userId);
              break;
            case 'update_feature_status':
              actionResult = await executeUpdateFeatureStatus(aiResponse.parameters, userId);
              break;
          }

          if (actionResult) {
            console.log(`Automatically executed ${aiResponse.action}:`, actionResult);
            
            res.json({
              success: true,
              data: {
                message: aiResponse.message + `\n\n✅ **Action completed!** ${getActionSuccessMessage(aiResponse.action, actionResult)}`,
                timestamp: new Date().toISOString(),
                provider: aiService.provider,
                context: {
                  teamName: context.teamName,
                  userRole: context.userRole
                },
                actionExecuted: {
                  action: aiResponse.action,
                  result: actionResult
                }
              }
            });
            return;
          }
        } catch (error) {
          console.error('Auto-execution failed:', error);
          // Fall through to return action suggestion
        }
      }

      // Return action suggestion for confirmation
      res.json({
        success: true,
        data: {
          message: aiResponse.message,
          timestamp: new Date().toISOString(),
          provider: aiService.provider,
          context: {
            teamName: context.teamName,
            userRole: context.userRole
          },
          suggestedAction: {
            action: aiResponse.action,
            parameters: aiResponse.parameters,
            requiresConfirmation: aiResponse.requiresConfirmation
          }
        }
      });
      return;
    }

    // Regular response without actions
    const responseMessage = typeof aiResponse === 'string' ? aiResponse : aiResponse.message || aiResponse;

    // Log successful interaction
    console.log(`AI responded with ${responseMessage.length} characters`);

    res.json({
      success: true,
      data: {
        message: responseMessage,
        timestamp: new Date().toISOString(),
        provider: aiService.provider,
        context: {
          teamName: context.teamName,
          userRole: context.userRole
        }
      }
    });

  } catch (error) {
    console.error('Chat message error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to process chat message',
      details: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

/**
 * Analyze message intent
 * @route POST /api/chat/intent
 * @access Private
 */
router.post('/intent', protectWithAny, async (req, res) => {
  try {
    const { message } = req.body;

    if (!message) {
      return res.status(400).json({
        success: false,
        error: 'Message is required'
      });
    }

    const intent = await aiService.analyzeIntent(message);

    res.json({
      success: true,
      data: intent
    });

  } catch (error) {
    console.error('Intent analysis error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to analyze message intent'
    });
  }
});

/**
 * Get AI service health status (public for testing)
 * @route GET /api/chat/health-public
 * @access Public
 */
router.get('/health-public', async (req, res) => {
  try {
    const health = await aiService.healthCheck();
    
    res.json({
      success: true,
      data: health
    });

  } catch (error) {
    console.error('AI health check error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to check AI service health'
    });
  }
});

/**
 * Get AI service health status
 * @route GET /api/chat/health
 * @access Private
 */
router.get('/health', protectWithAny, async (req, res) => {
  try {
    const health = await aiService.healthCheck();
    
    res.json({
      success: true,
      data: health
    });

  } catch (error) {
    console.error('AI health check error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to check AI service health'
    });
  }
});

/**
 * Get chat suggestions based on current context
 * @route GET /api/chat/suggestions
 * @access Private
 */
router.get('/suggestions', protectWithAny, async (req, res) => {
  try {
    const { teamId, page } = req.query;
    const userId = req.user.id;

    const context = await buildChatContext(userId, teamId);
    const suggestions = generateContextualSuggestions(page, context);

    res.json({
      success: true,
      data: {
        suggestions,
        context: {
          page,
          teamName: context.teamName,
          userRole: context.userRole
        }
      }
    });

  } catch (error) {
    console.error('Chat suggestions error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to get chat suggestions'
    });
  }
});

/**
 * Execute AI-suggested actions
 * @route POST /api/chat/action
 * @access Private
 */
router.post('/action', protectWithAny, async (req, res) => {
  try {
    const { action, parameters } = req.body;
    const userId = req.user.id;

    if (!action || !parameters) {
      return res.status(400).json({
        success: false,
        error: 'Action and parameters are required'
      });
    }

    console.log(`Executing AI action: ${action} for user ${userId}`);

    let result;
    switch (action) {
      case 'create_feature':
        result = await executeCreateFeature(parameters, userId);
        break;
      case 'update_feature':
        result = await executeUpdateFeature(parameters, userId);
        break;
      case 'update_feature_status':
        result = await executeUpdateFeatureStatus(parameters, userId);
        break;
      default:
        return res.status(400).json({
          success: false,
          error: `Unknown action: ${action}`
        });
    }

    res.json({
      success: true,
      data: {
        action,
        result,
        message: `Successfully executed ${action}`
      }
    });

  } catch (error) {
    console.error('Chat action error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to execute action',
      details: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

/**
 * Build comprehensive context for AI chat
 */
async function buildChatContext(userId, teamId) {
  const context = {
    userId,
    teamId,
    teamName: 'Unknown Team',
    userRole: 'member',
    teamData: null,
    members: [],
    features: {
      total: 0,
      byStatus: {},
      byPriority: {},
      recent: [],
      overdue: [],
      assigned: []
    },
    analytics: {
      velocity: 0,
      completionRate: 0,
      averageEffort: 0
    },
    recentActivity: []
  };

  try {
    if (!teamId) {
      return context;
    }

    // Get comprehensive team information with members
    const team = await Team.findByPk(teamId, {
      include: [
        {
          model: User,
          as: 'members',
          through: {
            model: TeamMember,
            attributes: ['role', 'createdAt']
          },
          attributes: ['id', 'email', 'name']
        },
        {
          model: User,
          as: 'creator',
          attributes: ['id', 'email', 'name']
        }
      ]
    });

    if (!team) {
      console.log(`Team ${teamId} not found`);
      return context;
    }

    // Basic team info
    context.teamName = team.name;
    context.teamData = {
      id: team.id,
      name: team.name,
      description: team.description,
      createdAt: team.createdAt,
      memberCount: team.members ? team.members.length : 0
    };

    // Get user's role in the team
    const currentUserMember = team.members?.find(member => member.id === userId);
    if (currentUserMember) {
      context.userRole = currentUserMember.TeamMember.role;
    }

    // Process team members
    context.members = team.members?.map(member => ({
      id: member.id,
      email: member.email,
      displayName: member.name,
      role: member.TeamMember.role,
      joinedAt: member.TeamMember.createdAt
    })) || [];

    // Get comprehensive feature data
    const features = await Feature.findAll({
      where: { teamId },
      include: [
        {
          model: User,
          as: 'creator',
          attributes: ['id', 'email', 'name']
        }
      ],
      order: [['createdAt', 'DESC']]
    });

    // Process features data
    context.features.total = features.length;
    
    // Group by status
    context.features.byStatus = features.reduce((acc, feature) => {
      acc[feature.status] = (acc[feature.status] || 0) + 1;
      return acc;
    }, {});

    // Group by priority
    context.features.byPriority = features.reduce((acc, feature) => {
      acc[feature.priority] = (acc[feature.priority] || 0) + 1;
      return acc;
    }, {});

    // Recent features (last 10)
    context.features.recent = features.slice(0, 10).map(feature => ({
      id: feature.id,
      title: feature.title,
      status: feature.status,
      priority: feature.priority,
      createdAt: feature.createdAt,
      createdBy: feature.creator?.name || feature.createdByEmail,
      estimatedEffort: feature.estimatedEffort,
      dueDate: feature.dueDate
    }));

    // Overdue features
    const now = new Date();
    context.features.overdue = features
      .filter(feature => feature.dueDate && new Date(feature.dueDate) < now && feature.status !== 'done')
      .map(feature => ({
        id: feature.id,
        title: feature.title,
        dueDate: feature.dueDate,
        priority: feature.priority,
        status: feature.status
      }));

    // Features assigned to current user
    context.features.assigned = features
      .filter(feature => feature.assignedTo === userId)
      .map(feature => ({
        id: feature.id,
        title: feature.title,
        status: feature.status,
        priority: feature.priority,
        dueDate: feature.dueDate
      }));

    // Calculate analytics
    const completedFeatures = features.filter(f => f.status === 'done');
    const featuresWithEffort = features.filter(f => f.estimatedEffort);
    
    context.analytics.completionRate = features.length > 0 ? 
      Math.round((completedFeatures.length / features.length) * 100) : 0;
    
    context.analytics.averageEffort = featuresWithEffort.length > 0 ?
      Math.round(featuresWithEffort.reduce((sum, f) => sum + f.estimatedEffort, 0) / featuresWithEffort.length) : 0;

    // Calculate velocity (completed features in last 30 days)
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
    
    const recentCompletedFeatures = completedFeatures.filter(f => 
      f.updatedAt && new Date(f.updatedAt) > thirtyDaysAgo
    );
    context.analytics.velocity = recentCompletedFeatures.length;

    // Generate recent activity summary
    const recentActivities = [];
    
    // Recent feature creations
    const recentCreated = features.slice(0, 3);
    recentCreated.forEach(feature => {
      recentActivities.push({
        type: 'feature_created',
        description: `Feature "${feature.title}" was created`,
        timestamp: feature.createdAt,
        priority: feature.priority
      });
    });

    // Recently completed features
    const recentCompleted = completedFeatures.slice(0, 2);
    recentCompleted.forEach(feature => {
      recentActivities.push({
        type: 'feature_completed',
        description: `Feature "${feature.title}" was completed`,
        timestamp: feature.updatedAt,
        priority: feature.priority
      });
    });

    // Sort by timestamp and take most recent
    context.recentActivity = recentActivities
      .sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp))
      .slice(0, 5);

    console.log(`Built comprehensive context for team ${team.name}: ${features.length} features, ${context.members.length} members`);

  } catch (error) {
    console.error('Error building comprehensive chat context:', error);
    // Return basic context even if detailed lookup fails
  }

  return context;
}

/**
 * Generate contextual suggestions based on current page and team data
 */
function generateContextualSuggestions(page, context) {
  // Safely extract context data with defaults
  const teamName = context.teamName || 'your team';
  const features = context.features || {
    total: 0,
    byStatus: {},
    byPriority: {},
    overdue: [],
    assigned: []
  };
  const analytics = context.analytics || {
    velocity: 0,
    completionRate: 0
  };
  const members = context.members || [];
  
  const teamNameSafe = teamName;
  
  // Data-driven suggestion generation
  const urgentCount = features.byPriority?.urgent || 0;
  const overdueCount = features.overdue?.length || 0;
  const assignedCount = features.assigned?.length || 0;
  const inProgressCount = features.byStatus?.in_progress || 0;
  
  const suggestions = {
    dashboard: [
      urgentCount > 0 ? `Show me ${urgentCount} urgent features` : `What's ${teamNameSafe}'s current velocity?`,
      overdueCount > 0 ? `List ${overdueCount} overdue features` : 'Show me high priority features',
      assignedCount > 0 ? `My ${assignedCount} assigned features` : 'Any features need attention?',
      analytics.completionRate < 50 ? 'How can we improve completion rate?' : 'Help me create a new feature'
    ],
    features: [
      urgentCount > 0 ? 'Show urgent features first' : 'Create a new feature',
      assignedCount > 0 ? 'Show features assigned to me' : 'Show features assigned to me',
      inProgressCount > 0 ? `List ${inProgressCount} in-progress features` : 'List all in-progress features',
      overdueCount > 0 ? `What ${overdueCount} features are overdue?` : 'What features are overdue?'
    ],
    analytics: [
      analytics.velocity < 3 ? 'How to improve our velocity?' : 'Explain our team performance',
      analytics.completionRate < 70 ? 'Why is completion rate low?' : 'What trends do you see?',
      urgentCount > 0 ? 'Which urgent features to prioritize?' : 'Which features should we prioritize?',
      features.total > 20 ? 'How to manage feature backlog?' : 'How is our completion rate?'
    ],
    team: [
      `Tell me about ${teamNameSafe}`,
      members.length > 1 ? `Show ${members.length} team members` : 'Who\'s on the team?',
      'Recent team activity',
      'Team performance summary'
    ],
    default: [
      urgentCount > 0 ? `${urgentCount} urgent features need attention` : 'What can you help me with?',
      `Tell me about ${teamNameSafe}`,
      features.total > 0 ? `Analyze ${features.total} team features` : 'Show me team statistics',
      assignedCount > 0 ? `Help with my ${assignedCount} features` : 'Help me manage features'
    ]
  };

  return suggestions[page] || suggestions.default;
}

/**
 * Execute feature creation
 */
async function executeCreateFeature(parameters, userId) {
  const { Feature } = require('../models');
  
  // Map priority values to match the database enum
  const priorityMap = {
    'urgent': 'critical',
    'high': 'high',
    'medium': 'medium',
    'low': 'low'
  };
  
  // Map status values to match the database enum
  const statusMap = {
    'requested': 'backlog',
    'planned': 'backlog',
    'in_progress': 'in_progress',
    'in-progress': 'in_progress',
    'review': 'review',
    'done': 'done',
    'completed': 'done',
    'cancelled': 'done'
  };
  
  // Get user's email for the createdByEmail field
  const { User } = require('../models');
  const user = await User.findByPk(userId);
  
  const featureData = {
    title: parameters.title,
    description: parameters.description || '',
    priority: priorityMap[parameters.priority] || 'medium',
    status: statusMap[parameters.status] || 'backlog',
    estimatedEffort: parameters.estimatedEffort || null,
    dueDate: parameters.dueDate || null,
    teamId: parameters.teamId,
    createdBy: userId, // Fixed: use createdBy instead of requestedById
    createdByEmail: user ? user.email : parameters.createdByEmail || null
  };

  const feature = await Feature.create(featureData);
  return {
    id: feature.id,
    title: feature.title,
    status: feature.status,
    priority: feature.priority
  };
}

/**
 * Execute feature update
 */
async function executeUpdateFeature(parameters, userId) {
  const { Feature } = require('../models');
  
  console.log('Executing feature update with parameters:', parameters);
  console.log('User ID:', userId);
  
  if (!parameters.featureId) {
    console.log('No featureId provided in parameters');
    throw new Error('Feature ID is required for updates');
  }
  
  const feature = await Feature.findByPk(parameters.featureId);
  if (!feature) {
    console.log('Feature not found with ID:', parameters.featureId);
    throw new Error('Feature not found');
  }
  
  console.log('Found feature to update:', { id: feature.id, title: feature.title, currentStatus: feature.status });

  // Map priority and status values to match the database enum
  const priorityMap = {
    'urgent': 'critical',
    'high': 'high',
    'medium': 'medium',
    'low': 'low'
  };
  
  const statusMap = {
    'requested': 'backlog',
    'planned': 'backlog',
    'in_progress': 'in_progress',
    'in-progress': 'in_progress',
    'review': 'review',
    'done': 'done',
    'completed': 'done',
    'cancelled': 'done'
  };

  // Build update object with only provided parameters
  const updateData = {};
  if (parameters.title) updateData.title = parameters.title;
  if (parameters.description) updateData.description = parameters.description;
  if (parameters.priority) updateData.priority = priorityMap[parameters.priority] || parameters.priority;
  if (parameters.status) updateData.status = statusMap[parameters.status] || parameters.status;
  if (parameters.estimatedEffort !== undefined) updateData.estimatedEffort = parameters.estimatedEffort;
  if (parameters.dueDate !== undefined) updateData.dueDate = parameters.dueDate;

  console.log('Update data to apply:', updateData);

  await feature.update(updateData);
  
  // Reload the feature to get the updated values
  await feature.reload();
  
  console.log('Feature updated successfully:', { id: feature.id, title: feature.title, newStatus: feature.status });
  
  return {
    id: feature.id,
    title: feature.title,
    status: feature.status,
    priority: feature.priority,
    updatedFields: Object.keys(updateData)
  };
}

/**
 * Execute feature status update
 */
async function executeUpdateFeatureStatus(parameters, userId) {
  const { Feature } = require('../models');
  
  const feature = await Feature.findByPk(parameters.featureId);
  if (!feature) {
    throw new Error('Feature not found');
  }

  await feature.update({ status: parameters.status });
  
  return {
    id: feature.id,
    title: feature.title,
    oldStatus: feature.status,
    newStatus: parameters.status
  };
}

/**
 * Generate success message for completed actions
 */
function getActionSuccessMessage(action, result) {
  switch (action) {
    case 'create_feature':
      return `Created feature "${result.title}" with ${result.priority} priority.`;
    case 'update_feature':
      return `Updated feature "${result.title}". Changed: ${result.updatedFields.join(', ')}.`;
    case 'update_feature_status':
      return `Changed feature "${result.title}" status to ${result.newStatus}.`;
    default:
      return 'Action completed successfully.';
  }
}

module.exports = router; 