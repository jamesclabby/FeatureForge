import apiService from './api';

/**
 * Feature Service
 * Handles all API calls related to features
 */
const featureService = {
  /**
   * Get all features with optional filtering
   * @param {Object} params - Query parameters for filtering
   * @returns {Promise<Array>} - List of features
   */
  getAllFeatures: (params = {}) => {
    return apiService.get('/features', params);
  },

  /**
   * Get a single feature by ID
   * @param {string} id - Feature ID
   * @returns {Promise<Object>} - Feature details
   */
  getFeatureById: (id) => {
    return apiService.get(`/features/${id}`);
  },

  /**
   * Create a new feature
   * @param {Object} featureData - Feature data
   * @returns {Promise<Object>} - Created feature
   */
  createFeature: (featureData) => {
    return apiService.post('/features', featureData);
  },

  /**
   * Update an existing feature
   * @param {string} id - Feature ID
   * @param {Object} featureData - Updated feature data
   * @returns {Promise<Object>} - Updated feature
   */
  updateFeature: (id, featureData) => {
    return apiService.put(`/features/${id}`, featureData);
  },

  /**
   * Delete a feature
   * @param {string} id - Feature ID
   * @returns {Promise<Object>} - Response
   */
  deleteFeature: (id) => {
    return apiService.delete(`/features/${id}`);
  },

  /**
   * Vote for a feature
   * @param {string} id - Feature ID
   * @returns {Promise<Object>} - Updated feature with vote count
   */
  voteForFeature: (id) => {
    return apiService.put(`/features/${id}/vote`);
  },

  /**
   * Add a comment to a feature
   * @param {string} id - Feature ID
   * @param {string} text - Comment text
   * @returns {Promise<Object>} - Created comment
   */
  addComment: (id, text) => {
    return apiService.post(`/features/${id}/comments`, { text });
  }
};

export default featureService; 