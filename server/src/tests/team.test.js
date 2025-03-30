const request = require('supertest');
const app = require('../app');
const { Team, User, TeamMember, Feature, sequelize } = require('../models');
const { generateToken } = require('../utils/auth');
const setupTestDb = require('../scripts/setupTestDb');

describe('Team Management API', () => {
  let adminUser;
  let regularUser;
  let team;
  let adminToken;
  let userToken;

  beforeAll(async () => {
    // Initialize database
    await setupTestDb();

    // Authenticate database connection
    await sequelize.authenticate();
    console.log('Database connection authenticated successfully.');

    try {
      // Create test users using User model
      adminUser = await User.create({
        name: 'Admin User',
        email: 'admin@test.com',
        password: 'testpassword123',
        role: 'admin'
      });

      regularUser = await User.create({
        name: 'Regular User',
        email: 'user@test.com',
        password: 'testpassword123',
        role: 'user'
      });

      // Create test tokens
      adminToken = generateToken(adminUser);
      userToken = generateToken(regularUser);

      // Create test team
      team = await Team.create({
        name: 'Test Team',
        description: 'Test Team Description',
        createdBy: adminUser.id,
        createdByEmail: adminUser.email
      });

      // Add admin user to team
      await TeamMember.create({
        teamId: team.id,
        userId: adminUser.id,
        role: 'admin',
        joinedAt: new Date()
      });

      console.log('Test data created successfully.');
    } catch (error) {
      console.error('Error creating test data:', error);
      throw error;
    }
  });

  afterAll(async () => {
    try {
      // Clean up test data using raw SQL in the correct order
      await sequelize.query('DELETE FROM "features";');
      await sequelize.query('DELETE FROM "teamMembers";');
      await sequelize.query('DELETE FROM teams;');
      await sequelize.query('DELETE FROM users;');
      await sequelize.close();
      console.log('Test data cleaned up successfully.');
    } catch (error) {
      console.error('Error cleaning up test data:', error);
      throw error;
    }
  });

  describe('POST /api/teams', () => {
    it('should create a new team', async () => {
      const response = await request(app)
        .post('/api/teams')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          name: `New Team ${Date.now()}`,
          description: 'New Team Description'
        });

      expect(response.status).toBe(201);
      expect(response.body.success).toBe(true);
      expect(response.body.data).toHaveProperty('id');
      expect(response.body.data.name).toBeTruthy();
    }, 10000);

    it('should not create team without authentication', async () => {
      const response = await request(app)
        .post('/api/teams')
        .send({
          name: 'Unauthorized Team',
          description: 'Unauthorized Team Description'
        });

      expect(response.status).toBe(401);
    }, 10000);
  });

  describe('GET /api/teams/my-teams', () => {
    it('should get user teams', async () => {
      const response = await request(app)
        .get('/api/teams/my-teams')
        .set('Authorization', `Bearer ${adminToken}`);

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(Array.isArray(response.body.data)).toBe(true);
    }, 10000);
  });

  describe('PUT /api/teams/:teamId', () => {
    it('should update team details', async () => {
      const response = await request(app)
        .put(`/api/teams/${team.id}`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          name: 'Updated Team Name',
          description: 'Updated Team Description'
        });

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data.name).toBe('Updated Team Name');
    }, 10000);

    it('should not update team without admin role', async () => {
      const response = await request(app)
        .put(`/api/teams/${team.id}`)
        .set('Authorization', `Bearer ${userToken}`)
        .send({
          name: 'Updated Team Name',
          description: 'Updated description'
        });

      expect(response.status).toBe(403);
      expect(response.body.success).toBe(false);
      expect(response.body.error).toBe('Not authorized to update team');
    }, 15000); // Increase timeout to 15 seconds
  });

  describe('POST /api/teams/:teamId/members', () => {
    it('should add new team member', async () => {
      const newUser = await User.create({
        email: 'newuser@test.com',
        name: 'New User',
        role: 'user',
        password: 'testpassword123'
      });

      const response = await request(app)
        .post(`/api/teams/${team.id}/members`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          email: newUser.email,
          role: 'user'
        });

      expect(response.status).toBe(201);
      expect(response.body.success).toBe(true);
    }, 10000);

    it('should not exceed team size limit', async () => {
      // Create 9 test users (max team size is 10, including admin)
      const users = await Promise.all(
        Array(9).fill().map((_, i) => User.create({
          name: `Test User ${i + 1}`,
          email: `test${i + 1}@test.com`,
          password: 'testpassword123',
          role: 'user'
        }))
      );

      // Add users to team
      await TeamMember.bulkCreate(users.map(user => ({
        teamId: team.id,
        userId: user.id,
        role: 'user'
      })));

      // Create one more user to try to add
      const extraUser = await User.create({
        name: 'Extra User',
        email: 'extra@test.com',
        password: 'testpassword123',
        role: 'user'
      });

      // Try to add one more user
      const response = await request(app)
        .post(`/api/teams/${team.id}/members`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          email: extraUser.email,
          role: 'user'
        });

      expect(response.status).toBe(400);
      expect(response.body.success).toBe(false);
      expect(response.body.error).toBe('Team size limit exceeded');
    }, 15000); // Increase timeout to 15 seconds
  });

  describe('GET /api/teams/:teamId/features', () => {
    it('should get team features', async () => {
      // Create a test feature
      const feature = await Feature.create({
        title: 'Test Feature',
        description: 'Test Feature Description',
        teamId: team.id,
        createdBy: adminUser.id,
        createdByEmail: adminUser.email,
        priority: 'medium',
        status: 'backlog',
        estimatedEffort: 5,
        tags: [],
        attachments: [],
        comments: []
      });

      const response = await request(app)
        .get(`/api/teams/${team.id}/features`)
        .set('Authorization', `Bearer ${adminToken}`);

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(Array.isArray(response.body.data)).toBe(true);
      expect(response.body.data.length).toBe(1);
      expect(response.body.data[0].title).toBe('Test Feature');
    }, 15000); // Increase timeout to 15 seconds

    it('should create new feature', async () => {
      const response = await request(app)
        .post(`/api/teams/${team.id}/features`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          title: 'New Feature',
          description: 'New Feature Description',
          priority: 'high',
          status: 'backlog',
          estimatedEffort: 3,
          tags: [],
          attachments: [],
          comments: []
        });

      console.log('Feature creation response:', response.body);

      expect(response.status).toBe(201);
      expect(response.body.success).toBe(true);
      expect(response.body.data.title).toBe('New Feature');
      expect(response.body.data.createdBy).toBe(adminUser.id);
      expect(response.body.data.teamId).toBe(team.id);
    }, 15000); // Increase timeout to 15 seconds
  });

  describe('DELETE /api/teams/:teamId', () => {
    it('should delete team', async () => {
      // Delete all features associated with the team first
      await Feature.destroy({ where: { teamId: team.id } });

      const response = await request(app)
        .delete(`/api/teams/${team.id}`)
        .set('Authorization', `Bearer ${adminToken}`);

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);

      // Verify team is deleted
      const deletedTeam = await Team.findByPk(team.id);
      expect(deletedTeam).toBeNull();
    }, 15000); // Increase timeout to 15 seconds
  });
}); 