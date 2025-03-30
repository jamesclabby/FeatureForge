const { Sequelize } = require('sequelize');
const config = require('../config/database');

const env = process.env.NODE_ENV || 'development';
const dbConfig = config[env];

const sequelize = new Sequelize(
  dbConfig.database,
  dbConfig.username,
  dbConfig.password,
  {
    host: dbConfig.host,
    dialect: dbConfig.dialect,
    logging: dbConfig.logging,
    define: {
      timestamps: true,
      underscored: false
    }
  }
);

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