const { sequelize } = require('../config/db');
const Team = require('./Team')(sequelize);
const User = require('./User')(sequelize);
const TeamMember = require('./TeamMember')(sequelize);
const Feature = require('./Feature')(sequelize);
const Comment = require('./Comment')(sequelize);
const Notification = require('./Notification')(sequelize);

// Define relationships
Team.belongsTo(User, { as: 'creator', foreignKey: 'createdBy' });
User.hasMany(Team, { foreignKey: 'createdBy' });

// Many-to-many relationship between Team and User
Team.belongsToMany(User, { 
  through: TeamMember,
  foreignKey: 'teamId',
  otherKey: 'userId',
  as: 'members',
  onDelete: 'CASCADE'
});
User.belongsToMany(Team, { 
  through: TeamMember,
  foreignKey: 'userId',
  otherKey: 'teamId',
  as: 'teams'
});

// Direct associations for TeamMember model
TeamMember.belongsTo(User, { foreignKey: 'userId' });
TeamMember.belongsTo(Team, { foreignKey: 'teamId' });

// Feature relationships
Feature.belongsTo(Team, { foreignKey: 'teamId' });
Team.hasMany(Feature, { 
  foreignKey: 'teamId',
  onDelete: 'CASCADE'
});

Feature.belongsTo(User, { as: 'creator', foreignKey: 'createdBy' });
User.hasMany(Feature, { foreignKey: 'createdBy' });

// Add assignee association
Feature.belongsTo(User, { as: 'assignee', foreignKey: 'assignedTo' });
User.hasMany(Feature, { foreignKey: 'assignedTo', as: 'assignedFeatures' });

// Feature hierarchy relationships (self-referencing)
Feature.belongsTo(Feature, { as: 'parent', foreignKey: 'parentId' });
Feature.hasMany(Feature, { as: 'children', foreignKey: 'parentId' });

// Comment relationships
Comment.belongsTo(Feature, { foreignKey: 'featureId', as: 'feature' });
Feature.hasMany(Comment, { foreignKey: 'featureId', as: 'commentsList' });

Comment.belongsTo(User, { foreignKey: 'userId', as: 'author' });
User.hasMany(Comment, { foreignKey: 'userId', as: 'userComments' });

// Self-referencing for reply threading
Comment.belongsTo(Comment, { foreignKey: 'parentId', as: 'parent' });
Comment.hasMany(Comment, { foreignKey: 'parentId', as: 'replies' });

// Notification relationships
Notification.belongsTo(User, { foreignKey: 'userId', as: 'recipient' });
User.hasMany(Notification, { foreignKey: 'userId', as: 'notifications' });

Notification.belongsTo(User, { foreignKey: 'triggeredBy', as: 'trigger' });
User.hasMany(Notification, { foreignKey: 'triggeredBy', as: 'triggeredNotifications' });

module.exports = {
  sequelize,
  Team,
  User,
  TeamMember,
  Feature,
  Comment,
  Notification
}; 