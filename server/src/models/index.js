const { sequelize } = require('../config/db');
const Team = require('./Team')(sequelize);
const User = require('./User')(sequelize);
const TeamMember = require('./TeamMember')(sequelize);
const Feature = require('./Feature')(sequelize);

// Define relationships
Team.belongsTo(User, { as: 'creator', foreignKey: 'createdBy' });
User.hasMany(Team, { foreignKey: 'createdBy' });

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

Feature.belongsTo(Team, { foreignKey: 'teamId' });
Team.hasMany(Feature, { 
  foreignKey: 'teamId',
  onDelete: 'CASCADE'
});

Feature.belongsTo(User, { as: 'creator', foreignKey: 'createdBy' });
User.hasMany(Feature, { foreignKey: 'createdBy' });

module.exports = {
  sequelize,
  Team,
  User,
  TeamMember,
  Feature
}; 