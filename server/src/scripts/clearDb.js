const dotenv = require('dotenv');
const path = require('path');
const { sequelize } = require('../config/db');
const { Team, User, Feature, Comment, Attachment } = require('../models');

// Load environment variables with explicit path
dotenv.config({ path: path.resolve(__dirname, '../../.env') });

async function clearDatabase() {
  try {
    // Clear all tables in reverse order of dependencies
    await Attachment.destroy({ where: {} });
    await Comment.destroy({ where: {} });
    await Feature.destroy({ where: {} });
    await User.destroy({ where: {} });
    await Team.destroy({ where: {} });

    console.log('Database cleared successfully!');
  } catch (error) {
    console.error('Error clearing database:', error);
  } finally {
    await sequelize.close();
  }
}

clearDatabase(); 