# Luna Sites Platform

Multi-tenant site management platform with a React Router frontend and Express API backend.

## Project Structure

- `/app` - React Router 7 frontend (React 19, TailwindCSS 4, Firebase Auth)
- `/api` - Express backend (TypeScript, Knex, PostgreSQL, Firebase Admin)
- `/public` - Static assets

## Commands

### Frontend (root directory)
```bash
yarn dev          # Start dev server (port 5173)
yarn build        # Production build
yarn typecheck    # Type check with react-router typegen
yarn start        # Run production server
```

### API (`/api` directory)
```bash
yarn dev          # Start API with hot reload (tsx watch)
yarn build        # Compile TypeScript
yarn start        # Run compiled API
```

## Tech Stack

- **Frontend**: React 19, React Router 7, TailwindCSS 4, Firebase (auth)
- **Backend**: Express, Knex (query builder), PostgreSQL, Firebase Admin
- **Package manager**: Yarn 1.x

## Architecture Notes

- Uses Firebase for authentication (frontend + backend verification)
- Knex handles database migrations and queries
- Site templates stored in `/api/src/templates/` with JSON profiles and migrations
- React contexts for Auth and Billing state management
