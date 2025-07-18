import apiService from './api';

// Mock data for development
const MOCK_ENABLED = false; // Set to false when the backend is ready

// Add some debugging to handle errors with more context
const handleApiError = (error, operation) => {
  console.error(`API Error during ${operation}:`, error);
  if (error.response) {
    console.error('Error response:', {
      status: error.response.status,
      data: error.response.data
    });
  } else if (error.request) {
    console.error('No response received:', error.request);
  } else {
    console.error('Error message:', error.message);
  }
  return Promise.reject(error);
};

const MOCK_FEATURES = [
  {
    id: '1',
    teamId: '1',
    title: 'User authentication system',
    description: 'Implement OAuth and email/password authentication for users',
    status: 'completed',
    priority: 'high',
    votes: 15,
    createdBy: 'user1',
    assignedTo: 'user2',
    createdAt: '2023-02-10T08:00:00.000Z',
    updatedAt: '2023-04-15T14:30:00.000Z',
    comments: [
      { id: '101', userId: 'user3', content: 'This looks great!', createdAt: '2023-02-12T09:15:00.000Z' }
    ],
    tags: ['security', 'user-management']
  },
  {
    id: '2',
    teamId: '1',
    title: 'Dashboard analytics',
    description: 'Add charts and metrics to the team dashboard',
    status: 'in-progress',
    priority: 'medium',
    votes: 8,
    createdBy: 'user2',
    assignedTo: 'user1',
    createdAt: '2023-03-05T10:30:00.000Z',
    updatedAt: '2023-03-20T16:45:00.000Z',
    comments: [],
    tags: ['analytics', 'ui']
  },
  {
    id: '3',
    teamId: '1',
    title: 'Mobile responsive design',
    description: 'Make the application fully responsive on mobile devices',
    status: 'planned',
    priority: 'medium',
    votes: 12,
    createdBy: 'user3',
    assignedTo: null,
    createdAt: '2023-03-15T11:20:00.000Z',
    updatedAt: '2023-03-15T11:20:00.000Z',
    comments: [
      { id: '201', userId: 'user1', content: 'I can work on this next sprint', createdAt: '2023-03-16T13:10:00.000Z' }
    ],
    tags: ['ui', 'mobile']
  },
  {
    id: '4',
    teamId: '2',
    title: 'Design system implementation',
    description: 'Create a comprehensive design system with components and guidelines',
    status: 'in-progress',
    priority: 'high',
    votes: 10,
    createdBy: 'user3',
    assignedTo: 'user3',
    createdAt: '2023-02-25T09:45:00.000Z',
    updatedAt: '2023-04-02T11:30:00.000Z',
    comments: [],
    tags: ['design', 'ui']
  },
  {
    id: '5',
    teamId: '3',
    title: 'Product roadmap tool',
    description: 'Build an interactive roadmap visualization for product planning',
    status: 'planned',
    priority: 'high',
    votes: 18,
    createdBy: 'user4',
    assignedTo: null,
    createdAt: '2023-03-30T14:20:00.000Z',
    updatedAt: '2023-03-30T14:20:00.000Z',
    comments: [],
    tags: ['product', 'planning']
  },
  {
    id: '6',
    teamId: '4',
    title: 'User feedback system',
    description: 'Add a way for users to submit feedback directly from the app',
    status: 'planned',
    priority: 'medium',
    votes: 7,
    createdBy: 'currentUser',
    assignedTo: null,
    createdAt: '2023-04-05T15:30:00.000Z',
    updatedAt: '2023-04-05T15:30:00.000Z',
    comments: [],
    tags: ['user-experience', 'feedback']
  }
];

// Feature status options
export const FEATURE_STATUSES = [
  { value: 'backlog', label: 'Planned', color: 'blue' },
  { value: 'in_progress', label: 'In Progress', color: 'amber' },
  { value: 'review', label: 'In Review', color: 'purple' },
  { value: 'done', label: 'Completed', color: 'green' }
];

// Feature priority options
export const FEATURE_PRIORITIES = [
  { value: 'low', label: 'Low', color: 'gray' },
  { value: 'medium', label: 'Medium', color: 'blue' },
  { value: 'high', label: 'High', color: 'amber' },
  { value: 'critical', label: 'Critical', color: 'red' }
];

/**
 * Feature Service
 * Handles all API calls related to features
 */
const featureService = {
  /**
   * Get all features for a team
   * @param {string} teamId - Team ID
   * @returns {Promise<{data: Array}>} - List of features
   */
  getTeamFeatures: async (teamId) => {
    if (MOCK_ENABLED) {
      console.log(`Using mock data for getTeamFeatures: ${teamId}`);
      const features = MOCK_FEATURES.filter(feature => feature.teamId === teamId);
      return Promise.resolve({ data: features });
    }
    return apiService.get(`/teams/${teamId}/features`)
      .catch(error => handleApiError(error, `getTeamFeatures(${teamId})`));
  },

  /**
   * Get a single feature by ID
   * @param {string} id - Feature ID
   * @returns {Promise<{data: Object}>} - Feature details
   */
  getFeatureById: async (id) => {
    if (MOCK_ENABLED) {
      console.log(`Using mock data for getFeatureById: ${id}`);
      const feature = MOCK_FEATURES.find(feature => feature.id === id);
      if (!feature) {
        return Promise.reject({ message: 'Feature not found' });
      }
      return Promise.resolve({ data: feature });
    }
    
    try {
      const response = await apiService.get(`/features/${id}`);
      
      // Ensure the feature has a comments array
      if (!response.data.comments) {
        response.data.comments = [];
      }
      
      console.log('Feature loaded with comments:', response.data.comments);
      return response;
    } catch (error) {
      return handleApiError(error, `getFeatureById(${id})`);
    }
  },

  /**
   * Create a new feature
   * @param {string} teamId - Team ID
   * @param {Object} featureData - Feature data
   * @returns {Promise<{data: Object}>} - Created feature
   */
  createFeature: async (teamId, featureData) => {
    // Validate teamId is a valid UUID
    console.log("Creating feature with teamId:", teamId, "Type:", typeof teamId);
    
    if (!teamId || !/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(teamId)) {
      console.error("Invalid teamId format:", teamId);
      return Promise.reject({ 
        message: `Invalid team ID format. Expected UUID, got: ${teamId}`,
        teamId: teamId
      });
    }
    
    if (MOCK_ENABLED) {
      console.log(`Using mock data for createFeature for team: ${teamId}`, featureData);
      const newFeature = {
        id: Date.now().toString(),
        teamId,
        ...featureData,
        votes: 0,
        comments: [],
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      };
      MOCK_FEATURES.push(newFeature);
      return Promise.resolve({ data: newFeature });
    }
    return apiService.post(`/teams/${teamId}/features`, featureData)
      .catch(error => handleApiError(error, `createFeature(${teamId})`));
  },

  /**
   * Update an existing feature
   * @param {string} id - Feature ID
   * @param {Object} featureData - Updated feature data
   * @param {string} teamId - Team ID (required for proper authorization)
   * @returns {Promise<{data: Object}>} - Updated feature
   */
  updateFeature: async (id, featureData, teamId) => {
    if (MOCK_ENABLED) {
      console.log(`Using mock data for updateFeature: ${id}`, featureData);
      const index = MOCK_FEATURES.findIndex(feature => feature.id === id);
      if (index === -1) {
        return Promise.reject({ message: 'Feature not found' });
      }
      const updatedFeature = { 
        ...MOCK_FEATURES[index], 
        ...featureData,
        updatedAt: new Date().toISOString()
      };
      MOCK_FEATURES[index] = updatedFeature;
      return Promise.resolve({ data: updatedFeature });
    }
    
    // Use team-specific endpoint for better authorization
    if (teamId) {
      return apiService.put(`/teams/${teamId}/features/${id}`, featureData)
        .catch(error => handleApiError(error, `updateFeature(${id}) via team ${teamId}`));
    } else {
      // Fallback to generic endpoint if no teamId provided (for backward compatibility)
      return apiService.put(`/features/${id}`, featureData)
        .catch(error => handleApiError(error, `updateFeature(${id})`));
    }
  },

  /**
   * Delete a feature
   * @param {string} id - Feature ID
   * @returns {Promise<{data: void}>} - Response
   */
  deleteFeature: async (id) => {
    if (MOCK_ENABLED) {
      console.log(`Using mock data for deleteFeature: ${id}`);
      const index = MOCK_FEATURES.findIndex(feature => feature.id === id);
      if (index === -1) {
        return Promise.reject({ message: 'Feature not found' });
      }
      MOCK_FEATURES.splice(index, 1);
      return Promise.resolve({ data: null });
    }
    return apiService.delete(`/features/${id}`);
  },

  /**
   * Vote for a feature
   * @param {string} id - Feature ID
   * @returns {Promise<{data: Object}>} - Updated feature with new vote count
   */
  voteForFeature: async (id) => {
    if (MOCK_ENABLED) {
      console.log(`Using mock data for voteForFeature: ${id}`);
      const index = MOCK_FEATURES.findIndex(feature => feature.id === id);
      if (index === -1) {
        return Promise.reject({ message: 'Feature not found' });
      }
      MOCK_FEATURES[index].votes += 1;
      return Promise.resolve({ data: MOCK_FEATURES[index] });
    }
    return apiService.post(`/features/${id}/vote`)
      .catch(error => handleApiError(error, `voteForFeature(${id})`));
  },

  /**
   * Add a comment to a feature
   * @param {string} id - Feature ID
   * @param {string} content - Comment content
   * @returns {Promise<{data: Object}>} - Created comment
   */
  addComment: async (id, content) => {
    if (MOCK_ENABLED) {
      console.log(`Using mock data for addComment to feature: ${id}`);
      const index = MOCK_FEATURES.findIndex(feature => feature.id === id);
      if (index === -1) {
        return Promise.reject({ message: 'Feature not found' });
      }

      const newComment = {
        id: Date.now().toString(),
        userId: 'currentUser',
        content,
        createdAt: new Date().toISOString()
      };

      MOCK_FEATURES[index].comments.push(newComment);
      return Promise.resolve({ data: newComment });
    }
    
    console.log(`Sending comment to feature ${id}:`, content);
    return apiService.post(`/features/${id}/comments`, { text: content })
      .catch(error => handleApiError(error, `addComment(${id})`));
  },

  /**
   * Edit an existing comment
   * @param {string} featureId - Feature ID
   * @param {string} commentId - Comment ID
   * @param {string} text - Updated comment text
   * @returns {Promise<{data: Object}>} - Updated comment
   */
  editComment: async (featureId, commentId, text) => {
    if (MOCK_ENABLED) {
      console.log(`Using mock data for editComment: ${commentId} on feature: ${featureId}`);
      const featureIndex = MOCK_FEATURES.findIndex(feature => feature.id === featureId);
      if (featureIndex === -1) {
        return Promise.reject({ message: 'Feature not found' });
      }
      
      const commentIndex = MOCK_FEATURES[featureIndex].comments.findIndex(
        comment => comment.id === commentId
      );
      
      if (commentIndex === -1) {
        return Promise.reject({ message: 'Comment not found' });
      }
      
      MOCK_FEATURES[featureIndex].comments[commentIndex].content = text;
      MOCK_FEATURES[featureIndex].comments[commentIndex].lastEdited = new Date().toISOString();
      
      return Promise.resolve({ 
        data: MOCK_FEATURES[featureIndex].comments[commentIndex] 
      });
    }
    
    console.log(`Editing comment ${commentId} on feature ${featureId}:`, text);
    return apiService.put(`/features/${featureId}/comments/${commentId}`, { text })
      .catch(error => handleApiError(error, `editComment(${featureId}, ${commentId})`));
  },

  /**
   * Delete a comment
   * @param {string} featureId - Feature ID
   * @param {string} commentId - Comment ID
   * @returns {Promise<{success: boolean}>} - Result of deletion
   */
  deleteComment: async (featureId, commentId) => {
    if (MOCK_ENABLED) {
      console.log(`Using mock data for deleteComment: ${commentId} from feature: ${featureId}`);
      const featureIndex = MOCK_FEATURES.findIndex(feature => feature.id === featureId);
      if (featureIndex === -1) {
        return Promise.reject({ message: 'Feature not found' });
      }
      
      const commentIndex = MOCK_FEATURES[featureIndex].comments.findIndex(
        comment => comment.id === commentId
      );
      
      if (commentIndex === -1) {
        return Promise.reject({ message: 'Comment not found' });
      }
      
      MOCK_FEATURES[featureIndex].comments.splice(commentIndex, 1);
      
      return Promise.resolve({ 
        success: true,
        message: 'Comment deleted successfully'
      });
    }
    
    console.log(`Deleting comment ${commentId} from feature ${featureId}`);
    return apiService.delete(`/features/${featureId}/comments/${commentId}`)
      .catch(error => handleApiError(error, `deleteComment(${featureId}, ${commentId})`));
  },

  /**
   * Get feature statistics for a team
   * @param {string} teamId - Team ID
   * @returns {Promise<{data: Object}>} - Feature statistics
   */
  getFeatureStats: async (teamId) => {
    if (MOCK_ENABLED) {
      console.log(`Using mock data for getFeatureStats: ${teamId}`);
      
      const teamFeatures = MOCK_FEATURES.filter(feature => feature.teamId === teamId);
      
      const stats = {
        total: teamFeatures.length,
        byStatus: {
          planned: teamFeatures.filter(f => f.status === 'planned').length,
          inProgress: teamFeatures.filter(f => f.status === 'in-progress').length,
          inReview: teamFeatures.filter(f => f.status === 'in-review').length,
          completed: teamFeatures.filter(f => f.status === 'completed').length,
          cancelled: teamFeatures.filter(f => f.status === 'cancelled').length
        },
        byPriority: {
          low: teamFeatures.filter(f => f.priority === 'low').length,
          medium: teamFeatures.filter(f => f.priority === 'medium').length,
          high: teamFeatures.filter(f => f.priority === 'high').length,
          critical: teamFeatures.filter(f => f.priority === 'critical').length
        },
        byType: {
          parent: teamFeatures.filter(f => f.type === 'parent').length,
          story: teamFeatures.filter(f => f.type === 'story').length,
          task: teamFeatures.filter(f => f.type === 'task').length,
          research: teamFeatures.filter(f => f.type === 'research').length
        }
      };
      
      return Promise.resolve({ data: stats });
    }
    
    // Try first to get stats directly from dedicated endpoint
    try {
      return await apiService.get(`/teams/${teamId}/features/stats`)
        .catch(error => {
          console.warn(`Stats endpoint failed, falling back to calculating from features list: ${error.message}`);
          throw error; // Rethrow to trigger the fallback
        });
    } catch (error) {
      // Fallback: Calculate stats from the feature list if stats endpoint isn't available
      console.log('Using fallback calculation for stats');
      try {
        const response = await apiService.get(`/teams/${teamId}/features`);
        const features = response.data || [];
        
        // Calculate stats from features
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
        
        return { data: stats };
      } catch (finalError) {
        // If even the fallback fails, return empty stats
        console.error('Failed to calculate stats even with fallback:', finalError);
        return { 
          data: { 
            total: 0, 
            byStatus: { backlog: 0, inProgress: 0, review: 0, done: 0 },
            byPriority: { low: 0, medium: 0, high: 0, critical: 0 },
            byType: { parent: 0, story: 0, task: 0, research: 0 }
          } 
        };
      }
    }
  }
};

export default featureService;