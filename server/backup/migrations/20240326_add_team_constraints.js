'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    // Create functions to check team size and user team count
    await queryInterface.sequelize.query(`
      CREATE OR REPLACE FUNCTION check_team_size()
      RETURNS TRIGGER AS $$
      BEGIN
        IF (
          SELECT COUNT(*)
          FROM team_members
          WHERE team_id = NEW.team_id
        ) >= 30 THEN
          RAISE EXCEPTION 'Team size cannot exceed 30 members';
        END IF;
        RETURN NEW;
      END;
      $$ LANGUAGE plpgsql;
    `);

    await queryInterface.sequelize.query(`
      CREATE OR REPLACE FUNCTION check_user_team_count()
      RETURNS TRIGGER AS $$
      BEGIN
        IF (
          SELECT COUNT(*)
          FROM team_members
          WHERE user_id = NEW.user_id
        ) >= 5 THEN
          RAISE EXCEPTION 'User cannot be a member of more than 5 teams';
        END IF;
        RETURN NEW;
      END;
      $$ LANGUAGE plpgsql;
    `);

    // Create triggers
    await queryInterface.sequelize.query(`
      CREATE TRIGGER enforce_team_size
      BEFORE INSERT ON team_members
      FOR EACH ROW
      EXECUTE FUNCTION check_team_size();
    `);

    await queryInterface.sequelize.query(`
      CREATE TRIGGER enforce_user_team_count
      BEFORE INSERT ON team_members
      FOR EACH ROW
      EXECUTE FUNCTION check_user_team_count();
    `);
  },

  down: async (queryInterface, Sequelize) => {
    // Drop triggers
    await queryInterface.sequelize.query(`
      DROP TRIGGER IF EXISTS enforce_team_size ON team_members;
    `);

    await queryInterface.sequelize.query(`
      DROP TRIGGER IF EXISTS enforce_user_team_count ON team_members;
    `);

    // Drop functions
    await queryInterface.sequelize.query(`
      DROP FUNCTION IF EXISTS check_team_size;
    `);

    await queryInterface.sequelize.query(`
      DROP FUNCTION IF EXISTS check_user_team_count;
    `);
  }
}; 