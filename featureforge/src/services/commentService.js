import apiService from './api';

class CommentService {
  /**
   * Get comments for a feature
   * @param {string} featureId - Feature ID
   * @returns {Promise<Object>} - API response with comments
   */
  async getComments(featureId) {
    return await apiService.get(`/features/${featureId}/comments`);
  }

  /**
   * Create a new comment
   * @param {string} featureId - Feature ID
   * @param {Object} commentData - Comment data
   * @returns {Promise<Object>} - API response with created comment
   */
  async createComment(featureId, commentData) {
    return await apiService.post(`/features/${featureId}/comments`, commentData);
  }

  /**
   * Update a comment
   * @param {string} commentId - Comment ID
   * @param {Object} commentData - Updated comment data
   * @returns {Promise<Object>} - API response with updated comment
   */
  async updateComment(commentId, commentData) {
    return await apiService.put(`/comments/${commentId}`, commentData);
  }

  /**
   * Delete a comment
   * @param {string} commentId - Comment ID
   * @returns {Promise<Object>} - API response
   */
  async deleteComment(commentId) {
    return await apiService.delete(`/comments/${commentId}`);
  }

  /**
   * Get team members for mention autocomplete
   * @param {string} teamId - Team ID
   * @param {string} query - Search query
   * @returns {Promise<Object>} - API response with team members
   */
  async getTeamMembersForMentions(teamId, query = '') {
    const params = query ? { q: query } : {};
    return await apiService.get(`/teams/${teamId}/members/mentions`, { params });
  }
}

export const commentService = new CommentService(); 