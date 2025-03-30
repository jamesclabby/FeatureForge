const { Team, TeamMember } = require('../models');
const ApiError = require('./ApiError');

const MAX_TEAM_SIZE = 10;
const MAX_TEAMS_PER_USER = 5;

const validateTeamSize = async (teamId) => {
  const memberCount = await TeamMember.count({
    where: { teamId }
  });

  if (memberCount >= MAX_TEAM_SIZE) {
    throw new ApiError('Team size limit exceeded', 400);
  }
};

const validateUserTeamCount = async (userId) => {
  const teamCount = await TeamMember.count({
    where: { userId }
  });

  if (teamCount >= MAX_TEAMS_PER_USER) {
    throw new ApiError(`User cannot be a member of more than ${MAX_TEAMS_PER_USER} teams`, 400);
  }
};

module.exports = {
  validateTeamSize,
  validateUserTeamCount,
  MAX_TEAM_SIZE,
  MAX_TEAMS_PER_USER
}; 