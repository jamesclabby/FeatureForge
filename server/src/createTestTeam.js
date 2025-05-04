const { sequelize, Team, TeamMember, User } = require('./models');
const { v4: uuidv4 } = require('uuid');

async function createTestTeam() {
  try {
    console.log('Creating test team...');
    
    // First make sure we have a test user
    let user = await User.findOne({ where: { email: 'john.doe@example.com' } });
    
    if (!user) {
      console.log('Creating test user...');
      user = await User.create({
        id: uuidv4(),
        name: 'John Doe',
        email: 'john.doe@example.com',
        password: '$2a$10$XX7X5S/reyQUGZXNgIBkL.t/lP8D6Nez.3U6Q.RM2qYjcUFnhvRUS', // password123
        role: 'user'
      });
      console.log('Test user created:', user.id);
    } else {
      console.log('Found existing test user:', user.id);
    }

    // Create a team with a specific UUID
    const targetTeamId = 'd73ad985-a8e3-43fe-914e-ce3e53e812f8';
    
    // Check if the team already exists
    let team = await Team.findByPk(targetTeamId);
    
    if (!team) {
      console.log('Creating new team with ID:', targetTeamId);
      team = await Team.create({
        id: targetTeamId,
        name: 'Engineering Team',
        description: 'Team for engineering and development tasks',
        createdBy: user.id,
        createdByEmail: user.email
      });
      console.log('Test team created successfully!');
    } else {
      console.log('Team already exists:', team.id);
    }
    
    // Check if the user is already a member of the team
    let membership = await TeamMember.findOne({
      where: { teamId: team.id, userId: user.id }
    });
    
    if (!membership) {
      console.log('Adding user to team...');
      membership = await TeamMember.create({
        teamId: team.id,
        userId: user.id,
        role: 'admin'
      });
      console.log('Added user to team with role admin');
    } else {
      console.log('User is already a member of the team with role:', membership.role);
    }
    
    console.log('Done!');
    process.exit(0);
  } catch (error) {
    console.error('Error creating test team:', error);
    process.exit(1);
  }
}

// Connect to the database and run the script
sequelize.authenticate()
  .then(() => {
    console.log('Database connection established');
    createTestTeam();
  })
  .catch(err => {
    console.error('Unable to connect to the database:', err);
    process.exit(1);
  }); 