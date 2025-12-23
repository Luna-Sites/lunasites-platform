import dotenv from 'dotenv';

dotenv.config();

export const config = {
  port: parseInt(process.env.PORT || '8000'),
  corsOrigins: process.env.CORS_ORIGINS?.split(',') || ['http://localhost:5173'],

  firebase: {
    projectId: process.env.FIREBASE_PROJECT_ID || '',
    clientEmail: process.env.FIREBASE_CLIENT_EMAIL || '',
    privateKey: (process.env.FIREBASE_PRIVATE_KEY || '')
      .replace(/\\n/g, '\n')
      .replace(/^["']|["']$/g, ''),
  },

  render: {
    apiKey: process.env.RENDER_API_KEY || '',
    ownerId: process.env.RENDER_OWNER_ID || '',
    // Multi-tenant worker service ID (for adding custom domains)
    workerServiceId: process.env.RENDER_WORKER_SERVICE_ID || '',
    // Multi-tenant worker service URL (for CNAME target, e.g., "lunacms-worker.onrender.com")
    workerServiceUrl: process.env.RENDER_WORKER_SERVICE_URL || '',
  },

  // Cloudflare for SaaS (Custom Hostnames) - for custom domain SSL
  cloudflare: {
    apiToken: process.env.CLOUDFLARE_API_TOKEN || '',
    zoneId: process.env.CLOUDFLARE_ZONE_ID || '',
    // Origin server for custom hostnames (e.g., lunacms-worker.onrender.com)
    originServer: process.env.CLOUDFLARE_ORIGIN_SERVER || '',
    // CNAME target for users (e.g., custom.luna-sites.com)
    cnameTarget: process.env.CLOUDFLARE_CNAME_TARGET || '',
  },

  // LunaCMS repository for deployments
  lunacms: {
    repoUrl: process.env.LUNACMS_REPO_URL || 'https://github.com/user/lunacms',
    repoBranch: process.env.LUNACMS_REPO_BRANCH || 'main',
  },

  // Shared database connection string
  sharedDatabaseUrl: process.env.SHARED_DATABASE_URL || '',
  sharedDatabaseInternalUrl: process.env.SHARED_DATABASE_INTERNAL_URL || '',

  // Base domain for sites
  baseDomain: process.env.BASE_DOMAIN || 'luna-sites.com',

  // ScreenshotOne API for template thumbnails
  screenshotone: {
    accessKey: process.env.SCREENSHOTONE_ACCESS_KEY || '',
  },
};
