import apiService from './api';

// Polyfill for crypto.randomUUID in older browsers
const generateUUID = () => {
  if (typeof crypto !== 'undefined' && crypto.randomUUID) {
    return crypto.randomUUID();
  }
  // Fallback for older browsers
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
    const r = Math.random() * 16 | 0;
    const v = c === 'x' ? r : (r & 0x3 | 0x8);
    return v.toString(16);
  });
};

// Mock data for development
const MOCK_ENABLED = false; // Set to false to use the backend instead of mock data

const MOCK_TEAMS = [
  {
    id: '123e4567-e89b-12d3-a456-426614174000',
    name: 'Engineering Team',
    description: 'Frontend and backend development team',
    memberCount: 8,
    createdAt: '2023-01-15T10:00:00.000Z'
  },
  {
    id: '223e4567-e89b-12d3-a456-426614174001',
    name: 'Design Team',
    description: 'UI/UX design team',
    memberCount: 5,
    createdAt: '2023-02-20T09:30:00.000Z'
  },
  {
    id: '323e4567-e89b-12d3-a456-426614174002',
    name: 'Product Team',
    description: 'Product management and strategy',
    memberCount: 4,
    createdAt: '2023-03-10T14:15:00.000Z'
  },
  {
    id: '423e4567-e89b-12d3-a456-426614174003',
    name: 'Test Team 1',
    description: 'A test team created by the user',
    memberCount: 1,
    createdAt: new Date().toISOString()
  }
];

const MOCK_MEMBERS = {
  '123e4567-e89b-12d3-a456-426614174000': [
    { id: '101', userId: 'user1', name: 'John Doe', role: 'admin', joinedAt: '2023-01-15T10:00:00.000Z' },
    { id: '102', userId: 'user2', name: 'Jane Smith', role: 'member', joinedAt: '2023-01-16T11:30:00.000Z' }
  ],
  '223e4567-e89b-12d3-a456-426614174001': [
    { id: '201', userId: 'user3', name: 'Alice Johnson', role: 'admin', joinedAt: '2023-02-20T09:30:00.000Z' }
  ],
  '323e4567-e89b-12d3-a456-426614174002': [
    { id: '301', userId: 'user4', name: 'Bob Wilson', role: 'admin', joinedAt: '2023-03-10T14:15:00.000Z' }
  ],
  '423e4567-e89b-12d3-a456-426614174003': [
    { id: '401', userId: 'currentUser', name: 'Current User', role: 'admin', joinedAt: new Date().toISOString() }
  ]
};

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
    if (MOCK_ENABLED) {
      console.log('Using mock data for getAllTeams');
      return Promise.resolve({ data: MOCK_TEAMS });
    }
    return apiService.get('/teams/my-teams');
  },

  /**
   * Get a single team by ID
   * @param {string} id - Team ID
   * @returns {Promise<{data: Object}>} - Team details
   */
  getTeamById: async (id) => {
    if (MOCK_ENABLED) {
      console.log(`Using mock data for getTeamById: ${id}`);
      const team = MOCK_TEAMS.find(team => team.id === id);
      if (!team) {
        // Check if it's a stored teamId from localStorage that might not match our mock data
        console.warn(`Team with ID ${id} not found in mock data. Using first mock team instead.`);
        return Promise.resolve({ data: MOCK_TEAMS[0] });
      }
      return Promise.resolve({ data: team });
    }
    return apiService.get(`/teams/${id}`);
  },

  /**
   * Create a new team
   * @param {Object} teamData - Team data
   * @returns {Promise<{data: Object}>} - Created team
   */
  createTeam: async (teamData) => {
    if (MOCK_ENABLED) {
      console.log('Using mock data for createTeam', teamData);
      
      // Generate a secure UUID
      const uuid = generateUUID();
      
      const newTeam = {
        id: uuid,
        ...teamData,
        memberCount: 1,
        createdAt: new Date().toISOString()
      };
      
      MOCK_TEAMS.push(newTeam);
      
      // Initialize empty members array
      MOCK_MEMBERS[uuid] = [{
        id: Date.now().toString(),
        userId: 'currentUser',
        name: 'Current User',
        role: 'admin',
        joinedAt: new Date().toISOString()
      }];
      
      return Promise.resolve({ data: newTeam });
    }
    return apiService.post('/teams', teamData);
  },

  /**
   * Update an existing team
   * @param {string} id - Team ID
   * @param {Object} teamData - Updated team data
   * @returns {Promise<{data: Object}>} - Updated team
   */
  updateTeam: async (id, teamData) => {
    if (MOCK_ENABLED) {
      console.log(`Using mock data for updateTeam: ${id}`, teamData);
      const index = MOCK_TEAMS.findIndex(team => team.id === id);
      if (index === -1) {
        return Promise.reject({ message: 'Team not found' });
      }
      const updatedTeam = { ...MOCK_TEAMS[index], ...teamData };
      MOCK_TEAMS[index] = updatedTeam;
      return Promise.resolve({ data: updatedTeam });
    }
    return apiService.put(`/teams/${id}`, teamData);
  },

  /**
   * Delete a team
   * @param {string} id - Team ID
   * @returns {Promise<{data: void}>} - Response
   */
  deleteTeam: async (id) => {
    if (MOCK_ENABLED) {
      console.log(`Using mock data for deleteTeam: ${id}`);
      const index = MOCK_TEAMS.findIndex(team => team.id === id);
      if (index === -1) {
        return Promise.reject({ message: 'Team not found' });
      }
      MOCK_TEAMS.splice(index, 1);
      return Promise.resolve({ data: null });
    }
    return apiService.delete(`/teams/${id}`);
  },

  /**
   * Get all members of a team
   * @param {string} id - Team ID
   * @returns {Promise<{data: Array}>} - List of team members
   */
  getTeamMembers: async (id) => {
    if (MOCK_ENABLED) {
      console.log(`Using mock data for getTeamMembers: ${id}`);
      return Promise.resolve({ data: MOCK_MEMBERS[id] || [] });
    }
    return apiService.get(`/teams/${id}/members`);
  },

  /**
   * Add a member to a team
   * @param {string} id - Team ID
   * @param {Object} memberData - Member data
   * @returns {Promise<{data: Object}>} - Added member
   */
  addTeamMember: async (id, memberData) => {
    if (MOCK_ENABLED) {
      console.log(`Using mock data for addTeamMember: ${id}`, memberData);
      const newMember = {
        id: Date.now().toString(),
        ...memberData,
        joinedAt: new Date().toISOString()
      };
      if (!MOCK_MEMBERS[id]) {
        MOCK_MEMBERS[id] = [];
      }
      MOCK_MEMBERS[id].push(newMember);
      
      // Update member count in team
      const teamIndex = MOCK_TEAMS.findIndex(team => team.id === id);
      if (teamIndex !== -1) {
        MOCK_TEAMS[teamIndex].memberCount += 1;
      }
      
      return Promise.resolve({ data: newMember });
    }
    return apiService.post(`/teams/${id}/members`, memberData);
  },

  /**
   * Remove a member from a team
   * @param {string} id - Team ID
   * @param {string} userId - User ID
   * @returns {Promise<{data: void}>} - Response
   */
  removeTeamMember: async (id, userId) => {
    if (MOCK_ENABLED) {
      console.log(`Using mock data for removeTeamMember: ${id}, userId: ${userId}`);
      if (!MOCK_MEMBERS[id]) {
        return Promise.reject({ message: 'Team not found' });
      }
      
      const index = MOCK_MEMBERS[id].findIndex(member => member.userId === userId);
      if (index === -1) {
        return Promise.reject({ message: 'Member not found' });
      }
      
      MOCK_MEMBERS[id].splice(index, 1);
      
      // Update member count in team
      const teamIndex = MOCK_TEAMS.findIndex(team => team.id === id);
      if (teamIndex !== -1) {
        MOCK_TEAMS[teamIndex].memberCount -= 1;
      }
      
      return Promise.resolve({ data: null });
    }
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
    if (MOCK_ENABLED) {
      console.log(`Using mock data for updateMemberRole: ${id}, userId: ${userId}, role: ${role}`);
      if (!MOCK_MEMBERS[id]) {
        return Promise.reject({ message: 'Team not found' });
      }
      
      const index = MOCK_MEMBERS[id].findIndex(member => member.userId === userId);
      if (index === -1) {
        return Promise.reject({ message: 'Member not found' });
      }
      
      MOCK_MEMBERS[id][index].role = role;
      return Promise.resolve({ data: MOCK_MEMBERS[id][index] });
    }
    return apiService.put(`/teams/${id}/members/${userId}/role`, { role });
  }
};

export default teamService; 