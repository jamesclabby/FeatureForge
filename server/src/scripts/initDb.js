const dotenv = require('dotenv');
const { sequelize } = require('../config/db');
const { models, initializeSequelizeModels } = require('../models');
const bcrypt = require('bcryptjs');
const path = require('path');

// Load environment variables with explicit path
dotenv.config({ path: path.resolve(__dirname, '../../.env') });

/**
 * Initialize the database with sample data
 */
const initializeDatabase = async () => {
  try {
    console.log('Initializing database...');
    
    // Sync all models with database
    await sequelize.sync({ force: true });
    console.log('Database synced');
    
    // Create teams
    const engineeringTeam = await models.Team.create({
      name: 'Engineering',
      description: 'Software development team',
      department: 'Engineering'
    });
    
    const productTeam = await models.Team.create({
      name: 'Product',
      description: 'Product management team',
      department: 'Product'
    });
    
    const designTeam = await models.Team.create({
      name: 'Design',
      description: 'UI/UX design team',
      department: 'Design'
    });
    
    console.log('Teams created');
    
    // Create admin user
    const adminUser = await models.User.create({
      name: 'Admin User',
      email: 'admin@example.com',
      password: 'password123',
      role: 'admin',
      team_id: null // Admin doesn't belong to a specific team
    });
    console.log('Admin user created');
    
    // Create product manager
    const pmUser = await models.User.create({
      name: 'Product Manager',
      email: 'pm@example.com',
      password: 'password123',
      role: 'product-manager',
      department: 'Product',
      team_id: productTeam.id
    });
    console.log('Product manager created');
    
    // Create regular user
    const regularUser = await models.User.create({
      name: 'Regular User',
      email: 'user@example.com',
      password: 'password123',
      role: 'user',
      department: 'Engineering',
      team_id: engineeringTeam.id
    });
    console.log('Regular user created');
    
    // Create designer user
    const designerUser = await models.User.create({
      name: 'Designer User',
      email: 'designer@example.com',
      password: 'password123',
      role: 'user',
      department: 'Design',
      team_id: designTeam.id
    });
    console.log('Designer user created');
    
    // Create sample features
    const features = [
      {
        title: 'User Authentication',
        description: 'Implement user authentication with JWT and Firebase',
        status: 'completed',
        priority: 10,
        impact: 9,
        effort: 7,
        category: 'security',
        requestedById: adminUser.id,
        assignedToId: pmUser.id
      },
      {
        title: 'Feature Voting System',
        description: 'Allow users to vote for features they want to see implemented',
        status: 'in-progress',
        priority: 8,
        impact: 7,
        effort: 5,
        category: 'functionality',
        requestedById: pmUser.id,
        assignedToId: regularUser.id
      },
      {
        title: 'Dashboard UI Improvements',
        description: 'Enhance the dashboard UI with better visualizations and filters',
        status: 'planned',
        priority: 6,
        impact: 8,
        effort: 4,
        category: 'ui',
        requestedById: regularUser.id,
        assignedToId: designerUser.id
      },
      {
        title: 'Performance Optimization',
        description: 'Optimize database queries and frontend rendering',
        status: 'requested',
        priority: 5,
        impact: 6,
        effort: 8,
        category: 'performance',
        requestedById: regularUser.id,
        assignedToId: null
      }
    ];
    
    for (const feature of features) {
      await models.Feature.create(feature);
    }
    console.log('Sample features created');
    
    // Add some votes
    await models.Vote.create({
      userId: regularUser.id,
      featureId: (await models.Feature.findOne({ where: { title: 'Dashboard UI Improvements' } })).id
    });
    
    await models.Vote.create({
      userId: pmUser.id,
      featureId: (await models.Feature.findOne({ where: { title: 'Dashboard UI Improvements' } })).id
    });
    
    await models.Vote.create({
      userId: adminUser.id,
      featureId: (await models.Feature.findOne({ where: { title: 'Performance Optimization' } })).id
    });
    
    // Update vote counts
    await models.Feature.update(
      { votes: 2 },
      { where: { title: 'Dashboard UI Improvements' } }
    );
    
    await models.Feature.update(
      { votes: 1 },
      { where: { title: 'Performance Optimization' } }
    );
    
    console.log('Sample votes created');
    
    // Add some comments
    await models.Comment.create({
      text: 'This is a great feature, looking forward to it!',
      userId: regularUser.id,
      featureId: (await models.Feature.findOne({ where: { title: 'Feature Voting System' } })).id
    });
    
    await models.Comment.create({
      text: 'I think we should prioritize this higher.',
      userId: pmUser.id,
      featureId: (await models.Feature.findOne({ where: { title: 'Dashboard UI Improvements' } })).id
    });
    
    await models.Comment.create({
      text: 'This is now complete and deployed to production.',
      userId: adminUser.id,
      featureId: (await models.Feature.findOne({ where: { title: 'User Authentication' } })).id
    });
    
    await models.Comment.create({
      text: 'I can start working on the UI designs next week.',
      userId: designerUser.id,
      featureId: (await models.Feature.findOne({ where: { title: 'Dashboard UI Improvements' } })).id
    });
    
    console.log('Sample comments created');
    
    console.log('Database initialization complete!');
    process.exit(0);
  } catch (error) {
    console.error('Error initializing database:', error);
    process.exit(1);
  }
};

// Run the initialization
initializeDatabase(); 