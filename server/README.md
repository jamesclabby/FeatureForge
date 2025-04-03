# FeatureForge Server

Backend API for FeatureForge - A Feature Prioritization Tool

## Setup

1. Install dependencies:
   ```
   npm install
   ```

2. Create a `.env` file based on `.env.example`:
   ```
   cp .env.example .env
   ```
   Then update the values in the `.env` file.

3. Check the database connection:
   ```
   npm run check-db
   ```
   This will verify that your PostgreSQL connection is properly configured.

4. Initialize the database with sample data (optional):
   ```
   npm run init-db
   ```
   This will create sample users, features, votes, and comments.

5. Start the development server:
   ```
   npm run dev
   ```
   Or for production:
   ```
   npm start
   ```

## Database Configuration

The server uses PostgreSQL with Sequelize ORM. Configure your database connection in the `.env` file:

```
DB_HOST=localhost
DB_PORT=5432
DB_NAME=featureforge
DB_USER=postgres
DB_PASSWORD=postgres
```

**Note:** The database connection is now optional. The server will start even if the database connection fails, but some API functionality will be limited.

To require a database connection (and exit if it fails), use:
```
npm run dev -- --require-db
```

MongoDB configuration is still available in the codebase for reference, but it's not actively used.

## Authentication Options

The server supports multiple authentication methods:

- **JWT Authentication**: Traditional email/password authentication
- **Firebase Authentication**: Integration with Firebase Auth

**Note:** Firebase initialization is now optional. The server will start even if Firebase initialization fails, but authentication functionality will be limited.

### Authentication Middleware

Three authentication middleware options are available:

- `protect`: Verifies JWT tokens only
- `protectWithFirebase`: Verifies Firebase ID tokens only (requires Firebase to be initialized)
- `protectWithAny`: Tries both JWT and Firebase authentication methods

## API Endpoints

### Authentication

- `POST /api/auth/register` - Register a new user
- `POST /api/auth/login` - Login with email/password
- `POST /api/auth/firebase` - Login with Firebase ID token
- `GET /api/auth/logout` - Logout user
- `GET /api/auth/me` - Get current user profile (JWT auth)
- `GET /api/auth/me/firebase` - Get current user profile (Firebase auth)
- `GET /api/auth/me/any` - Get current user profile (any auth method)
- `PUT /api/auth/updatedetails` - Update user details
- `PUT /api/auth/updatepassword` - Update user password

### Features

- `GET /api/features` - Get all features
- `GET /api/features/:id` - Get a specific feature
- `POST /api/features` - Create a new feature
- `PUT /api/features/:id` - Update a feature
- `DELETE /api/features/:id` - Delete a feature
- `PUT /api/features/:id/vote` - Vote for a feature
- `POST /api/features/:id/comments` - Add a comment to a feature

### Teams

- `GET /api/teams` - Get all teams
- `GET /api/teams/:id` - Get a specific team
- `POST /api/teams` - Create a new team
- `PUT /api/teams/:id` - Update a team
- `DELETE /api/teams/:id` - Delete a team
- `POST /api/teams/:id/members` - Add a member to a team
- `DELETE /api/teams/:id/members/:userId` - Remove a member from a team
- `GET /api/teams/:id/members` - Get all members of a team
- `PUT /api/teams/:id/members/:userId/role` - Update a member's role in a team

## Project Structure

```
src/
├── config/       # Configuration files
├── controllers/  # Route controllers
├── middleware/   # Custom middleware
├── models/       # Database models
├── routes/       # API routes
├── scripts/      # Utility scripts
├── services/     # Business logic
├── utils/        # Utility functions
└── index.js      # Entry point
```

## Technologies

- Node.js
- Express
- PostgreSQL with Sequelize
- JWT Authentication
- Firebase Admin SDK 