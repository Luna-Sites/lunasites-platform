import dotenv from 'dotenv';

dotenv.config();

export const config = {
  port: parseInt(process.env.PORT || '8000'),
  corsOrigins: process.env.CORS_ORIGINS?.split(',') || ['http://localhost:5173'],

  firebase: {
    projectId: process.env.FIREBASE_PROJECT_ID || '',
    clientEmail: process.env.FIREBASE_CLIENT_EMAIL || '',
    privateKey: process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, '\n') || '',
  },

  render: {
    apiKey: process.env.RENDER_API_KEY || '',
    ownerId: process.env.RENDER_OWNER_ID || '',
  },

  // LunaCMS repository for deployments
  lunacms: {
    repoUrl: process.env.LUNACMS_REPO_URL || 'https://github.com/user/lunacms',
    repoBranch: process.env.LUNACMS_REPO_BRANCH || 'main',
  },

  // Shared database connection string
  sharedDatabaseUrl: process.env.SHARED_DATABASE_URL || '',

  // Base domain for sites
  baseDomain: process.env.BASE_DOMAIN || 'luna-sites.com',
};
