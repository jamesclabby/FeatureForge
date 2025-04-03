import apiService from './api';

/**
 * Team Service
 * Handles all API calls related to teams
 */
const teamService = {
  /**
   * Get all teams for the current user
   * @returns {Promise<{data: Array}>} - List of teams
   */
  getAllTeams: async () => {
    return apiService.get('/teams/my-teams');
  },

  /**
   * Get a single team by ID
   * @param {string} id - Team ID
   * @returns {Promise<{data: Object}>} - Team details
   */
  getTeamById: async (id) => {
    return apiService.get(`/teams/${id}`);
  },

  /**
   * Create a new team
   * @param {Object} teamData - Team data
   * @returns {Promise<{data: Object}>} - Created team
   */
  createTeam: async (teamData) => {
    return apiService.post('/teams', teamData);
  },

  /**
   * Update an existing team
   * @param {string} id - Team ID
   * @param {Object} teamData - Updated team data
   * @returns {Promise<{data: Object}>} - Updated team
   */
  updateTeam: async (id, teamData) => {
    return apiService.put(`/teams/${id}`, teamData);
  },

  /**
   * Delete a team
   * @param {string} id - Team ID
   * @returns {Promise<{data: void}>} - Response
   */
  deleteTeam: async (id) => {
    return apiService.delete(`/teams/${id}`);
  },

  /**
   * Get all members of a team
   * @param {string} id - Team ID
   * @returns {Promise<{data: Array}>} - List of team members
   */
  getTeamMembers: async (id) => {
    return apiService.get(`/teams/${id}/members`);
  },

  /**
   * Add a member to a team
   * @param {string} id - Team ID
   * @param {Object} memberData - Member data
   * @returns {Promise<{data: Object}>} - Added member
   */
  addTeamMember: async (id, memberData) => {
    return apiService.post(`/teams/${id}/members`, memberData);
  },

  /**
   * Remove a member from a team
   * @param {string} id - Team ID
   * @param {string} userId - User ID
   * @returns {Promise<{data: void}>} - Response
   */
  removeTeamMember: async (id, userId) => {
    return apiService.delete(`/teams/${id}/members/${userId}`);
  },

  /**
   * Update a member's role in a team
   * @param {string} id - Team ID
   * @param {string} userId - User ID
   * @param {string} role - New role
   * @returns {Promise<{data: Object}>} - Updated member
   */
  updateMemberRole: async (id, userId, role) => {
    return apiService.put(`/teams/${id}/members/${userId}/role`, { role });
  }
};

export default teamService; 