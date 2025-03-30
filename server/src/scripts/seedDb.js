const dotenv = require('dotenv');
const path = require('path');
const bcrypt = require('bcryptjs');
const { sequelize } = require('../config/db');
const { Team, User, Feature, Comment, Attachment } = require('../models');

// Load environment variables with explicit path
dotenv.config({ path: path.resolve(__dirname, '../../.env') });

async function seedDatabase() {
  try {
    // Create teams
    const teams = await Team.bulkCreate([
      {
        name: 'Engineering',
        description: 'Core engineering team',
        createdAt: new Date(),
        updatedAt: new Date()
      },
      {
        name: 'Product',
        description: 'Product management team',
        createdAt: new Date(),
        updatedAt: new Date()
      },
      {
        name: 'Design',
        description: 'UI/UX design team',
        createdAt: new Date(),
        updatedAt: new Date()
      }
    ]);

    // Hash passwords
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash('password123', salt);

    // Create users
    const users = await User.bulkCreate([
      {
        email: 'john.doe@example.com',
        name: 'John Doe',
        password: hashedPassword,
        role: 'admin',
        teamId: teams[0].id,
        createdAt: new Date(),
        updatedAt: new Date()
      },
      {
        email: 'jane.smith@example.com',
        name: 'Jane Smith',
        password: hashedPassword,
        role: 'user',
        teamId: teams[1].id,
        createdAt: new Date(),
        updatedAt: new Date()
      },
      {
        email: 'mike.wilson@example.com',
        name: 'Mike Wilson',
        password: hashedPassword,
        role: 'user',
        teamId: teams[2].id,
        createdAt: new Date(),
        updatedAt: new Date()
      }
    ]);

    // Create features
    const features = await Feature.bulkCreate([
      {
        title: 'User Authentication System',
        description: 'Implement secure user authentication with JWT',
        status: 'in-progress',
        priority: 8,
        impact: 9,
        effort: 7,
        category: 'security',
        requestedById: users[0].id,
        assignedToId: users[0].id,
        teamId: teams[0].id,
        createdAt: new Date(),
        updatedAt: new Date()
      },
      {
        title: 'Dashboard Redesign',
        description: 'Modernize the dashboard UI with new components',
        status: 'planned',
        priority: 6,
        impact: 7,
        effort: 5,
        category: 'ui',
        requestedById: users[1].id,
        assignedToId: users[2].id,
        teamId: teams[2].id,
        createdAt: new Date(),
        updatedAt: new Date()
      },
      {
        title: 'API Rate Limiting',
        description: 'Implement rate limiting for API endpoints',
        status: 'completed',
        priority: 9,
        impact: 8,
        effort: 4,
        category: 'security',
        requestedById: users[0].id,
        assignedToId: users[0].id,
        teamId: teams[0].id,
        createdAt: new Date(),
        updatedAt: new Date()
      }
    ]);

    // Create comments
    await Comment.bulkCreate([
      {
        text: 'Initial implementation looks good, but we need to add refresh tokens',
        featureId: features[0].id,
        userId: users[1].id,
        createdAt: new Date(),
        updatedAt: new Date()
      },
      {
        text: 'Design mockups are ready for review',
        featureId: features[1].id,
        userId: users[2].id,
        createdAt: new Date(),
        updatedAt: new Date()
      },
      {
        text: 'Rate limiting has been implemented and tested',
        featureId: features[2].id,
        userId: users[0].id,
        createdAt: new Date(),
        updatedAt: new Date()
      }
    ]);

    // Create attachments
    await Attachment.bulkCreate([
      {
        name: 'auth-system-design.pdf',
        url: 'https://example.com/files/auth-system-design.pdf',
        type: 'application/pdf',
        featureId: features[0].id,
        uploadedBy: users[0].id,
        createdAt: new Date(),
        updatedAt: new Date()
      },
      {
        name: 'dashboard-mockup.png',
        url: 'https://example.com/files/dashboard-mockup.png',
        type: 'image/png',
        featureId: features[1].id,
        uploadedBy: users[2].id,
        createdAt: new Date(),
        updatedAt: new Date()
      }
    ]);

    console.log('Database seeded successfully!');
  } catch (error) {
    console.error('Error seeding database:', error);
  } finally {
    await sequelize.close();
  }
}

seedDatabase(); 