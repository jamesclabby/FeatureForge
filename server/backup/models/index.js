// MongoDB models (kept for reference but not recommended for use)
// const MongoFeature = require('./Feature');
// const MongoUser = require('./User');

// Sequelize models
const { Feature, setupAssociations: setupFeatureAssociations } = require('./FeatureSequelize');
const { User, setupAssociations: setupUserAssociations } = require('./UserSequelize');
const { Comment, setupAssociations: setupCommentAssociations } = require('./CommentSequelize');
const { Vote, setupAssociations: setupVoteAssociations } = require('./VoteSequelize');
const { Attachment, setupAssociations: setupAttachmentAssociations } = require('./AttachmentSequelize');
const { Team, setupAssociations: setupTeamAssociations } = require('./TeamSequelize');
const { sequelize } = require('../config/db');

// Initialize Sequelize models and associations
const initializeSequelizeModels = () => {
  const models = {
    Feature,
    User,
    Comment,
    Vote,
    Attachment,
    Team
  };

  // Only setup associations if sequelize is initialized
  if (sequelize) {
    try {
      // Setup associations
      setupFeatureAssociations(models);
      setupUserAssociations(models);
      setupCommentAssociations(models);
      setupVoteAssociations(models);
      setupAttachmentAssociations(models);
      setupTeamAssociations(models);
      console.log('Model associations set up successfully');
    } catch (error) {
      console.warn('Error setting up model associations:', error.message);
    }
  } else {
    console.warn('Sequelize not initialized. Model associations will not be set up.');
  }

  return models;
};

// Initialize models immediately
const models = initializeSequelizeModels();

const TeamMember = require('./TeamMember');

// User-Team associations (many-to-many through TeamMember)
User.belongsToMany(Team, {
  through: TeamMember,
  foreignKey: 'userId',
  otherKey: 'teamId',
  as: 'teams'
});

Team.belongsToMany(User, {
  through: TeamMember,
  foreignKey: 'teamId',
  otherKey: 'userId',
  as: 'members'
});

// TeamMember associations
TeamMember.belongsTo(User, {
  foreignKey: 'userId',
  as: 'user'
});

TeamMember.belongsTo(Team, {
  foreignKey: 'teamId',
  as: 'team'
});

module.exports = {
  // Sequelize models
  Feature,
  User,
  Comment,
  Vote,
  Attachment,
  Team,
  TeamMember,
  
  // All models in a single object
  models,
  
  // Initialization function (for reference)
  initializeSequelizeModels
}; 