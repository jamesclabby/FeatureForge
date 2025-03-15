# FeatureForge

A feature prioritization and management tool for product teams.

## Project Structure

This repository is organized as a monorepo containing both the frontend and backend applications:

- `/featureforge` - React frontend application
- `/server` - Node.js/Express backend API

## Getting Started

### Prerequisites

- Node.js (v18 or higher)
- npm (v8 or higher)
- PostgreSQL (optional - the server can run without a database connection)

### Installation

1. Install dependencies for all applications:

```bash
npm run install:all
```

### Running the Applications

#### Run both frontend and backend simultaneously:

```bash
npm start
```

This will start:
- Backend API on http://localhost:5000
- Frontend on http://localhost:3000

#### Run applications individually:

Start the backend:
```bash
npm run start:server
```

Start the frontend:
```bash
npm run start:frontend
```

### Database Configuration

The backend can run without a database connection, but for full functionality:

1. Create a PostgreSQL database
2. Configure the `.env` file in the `/server` directory
3. To require a database connection, use:
```bash
cd server && npm run dev:db-required
```

## Documentation

- Frontend documentation is available in the `/featureforge/README.md` file
- Backend API documentation is available in the `/server/README.md` file
