const mongoose = require('mongoose');
const { sequelize } = require('../config/db');
const User = require('../models/User');
const dotenv = require('dotenv');
const path = require('path');

// Load environment variables
dotenv.config({ path: path.resolve(__dirname, '../../.env') });

const migrateUsers = async () => {
  try {
    // Connect to MongoDB
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('Connected to MongoDB');

    // Get all users from MongoDB
    const mongoUsers = await mongoose.model('User').find({});
    console.log(`Found ${mongoUsers.length} users to migrate`);

    // Connect to PostgreSQL
    await sequelize.authenticate();
    console.log('Connected to PostgreSQL');

    // Migrate each user
    for (const mongoUser of mongoUsers) {
      try {
        // Check if user already exists in PostgreSQL
        const existingUser = await User.findOne({
          where: { email: mongoUser.email }
        });

        if (existingUser) {
          console.log(`User ${mongoUser.email} already exists in PostgreSQL, skipping...`);
          continue;
        }

        // Create new user in PostgreSQL
        await User.create({
          name: mongoUser.name,
          email: mongoUser.email,
          password: mongoUser.password,
          role: mongoUser.role,
          department: mongoUser.department,
          avatar: mongoUser.avatar,
          resetPasswordToken: mongoUser.resetPasswordToken,
          resetPasswordExpire: mongoUser.resetPasswordExpire,
          firebaseUid: mongoUser.firebaseUid
        });

        console.log(`Migrated user: ${mongoUser.email}`);
      } catch (error) {
        console.error(`Error migrating user ${mongoUser.email}:`, error);
      }
    }

    console.log('Migration completed successfully');
  } catch (error) {
    console.error('Migration failed:', error);
  } finally {
    // Close connections
    await mongoose.disconnect();
    await sequelize.close();
  }
};

// Run migration
migrateUsers(); 