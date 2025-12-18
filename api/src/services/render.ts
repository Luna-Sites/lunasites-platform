import crypto from 'crypto';
import { config } from '../config/index.js';

const RENDER_API_URL = 'https://api.render.com/v1';

interface RenderService {
  id: string;
  name: string;
  slug: string;
  suspended: string;
  serviceDetails: {
    url?: string;
  };
}

interface CreateServiceResponse {
  service: RenderService;
}

// Parse database URL into components for Nick config
function parseDatabaseUrl(url: string) {
  const regex = /^postgresql:\/\/([^:]+):([^@]+)@([^:/]+)(?::(\d+))?\/(.+)$/;
  const match = url.match(regex);
  if (!match) throw new Error('Invalid database URL');

  // Convert external hostname to internal (remove .region-postgres.render.com)
  const externalHost = match[3];
  const internalHost = externalHost.replace(/\.[^.]+\.render\.com$/, '');

  return {
    user: match[1],
    password: match[2],
    host: internalHost,
    port: match[4] || '5432',
    database: match[5],
  };
}

export async function createSiteService(params: {
  siteId: string;
  siteName: string;
  userId: string;
  databaseUrl: string;
}): Promise<RenderService> {
  const { siteId, siteName, userId, databaseUrl } = params;
  const serviceName = `lunacms-${siteId}`;
  const dbInfo = parseDatabaseUrl(databaseUrl);

  const response = await fetch(`${RENDER_API_URL}/services`, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${config.render.apiKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      type: 'web_service',
      name: serviceName,
      ownerId: config.render.ownerId,
      repo: config.lunacms.repoUrl,
      branch: config.lunacms.repoBranch,
      autoDeploy: 'yes',
      // envVars must be at top level, NOT inside serviceDetails
      envVars: [
        { key: 'NODE_ENV', value: 'production' },
        { key: 'NODE_VERSION', value: '25.0.0' },
        { key: 'NODE_OPTIONS', value: '--max-old-space-size=1536' },
        { key: 'HOST', value: '0.0.0.0' },
        { key: 'PORT', value: '10000' },
        // Nick backend database config
        { key: 'DB_HOST', value: dbInfo.host },
        { key: 'DB_PORT', value: dbInfo.port },
        { key: 'DB_USER', value: dbInfo.user },
        { key: 'DB_PASSWORD', value: dbInfo.password },
        { key: 'DB_NAME', value: dbInfo.database },
        { key: 'DATABASE_URL', value: databaseUrl },
        // Nick backend requires JWT_SECRET
        { key: 'JWT_SECRET', value: crypto.randomUUID() + crypto.randomUUID() },
        { key: 'SITE_ID', value: siteId },
        { key: 'USER_ID', value: userId },
      ],
      serviceDetails: {
        env: 'node',
        plan: 'starter',
        region: 'frankfurt',
        envSpecificDetails: {
          buildCommand: `pnpm install && pnpm apply-overrides && cd backends/nick && pnpm install && pnpm migrate && pnpm bootstrap && cd ../.. && LUNA_API_URL=http://localhost:10000/luna pnpm build`,
          startCommand: 'node --import tsx unified-server.mjs',
        },
      },
    }),
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({}));
    throw new Error(`Render API error: ${response.status} - ${JSON.stringify(error)}`);
  }

  const data: CreateServiceResponse = await response.json();
  return data.service;
}

export async function getServiceStatus(serviceId: string): Promise<RenderService> {
  const response = await fetch(`${RENDER_API_URL}/services/${serviceId}`, {
    headers: {
      'Authorization': `Bearer ${config.render.apiKey}`,
    },
  });

  if (!response.ok) {
    throw new Error(`Failed to get service status: ${response.status}`);
  }

  const data = await response.json();
  return data.service;
}

export async function deleteService(serviceId: string): Promise<void> {
  const response = await fetch(`${RENDER_API_URL}/services/${serviceId}`, {
    method: 'DELETE',
    headers: {
      'Authorization': `Bearer ${config.render.apiKey}`,
    },
  });

  if (!response.ok) {
    throw new Error(`Failed to delete service: ${response.status}`);
  }
}

export async function suspendService(serviceId: string): Promise<void> {
  const response = await fetch(`${RENDER_API_URL}/services/${serviceId}/suspend`, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${config.render.apiKey}`,
    },
  });

  if (!response.ok) {
    throw new Error(`Failed to suspend service: ${response.status}`);
  }
}

export async function resumeService(serviceId: string): Promise<void> {
  const response = await fetch(`${RENDER_API_URL}/services/${serviceId}/resume`, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${config.render.apiKey}`,
    },
  });

  if (!response.ok) {
    throw new Error(`Failed to resume service: ${response.status}`);
  }
}

/**
 * Add a custom domain to a Render service
 */
export async function addCustomDomain(serviceId: string, domain: string): Promise<void> {
  console.log(`[Render] Adding custom domain ${domain} to service ${serviceId}`);

  const response = await fetch(`${RENDER_API_URL}/services/${serviceId}/custom-domains`, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${config.render.apiKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      name: domain,
    }),
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({}));
    // Ignore if domain already exists (409 Conflict)
    if (response.status === 409) {
      console.log(`[Render] Domain ${domain} already exists`);
      return;
    }
    throw new Error(`Failed to add custom domain: ${response.status} - ${JSON.stringify(error)}`);
  }

  console.log(`[Render] Custom domain ${domain} added successfully`);
}

/**
 * Get service by name
 */
export async function getServiceByName(serviceName: string): Promise<RenderService | null> {
  const response = await fetch(`${RENDER_API_URL}/services?name=${encodeURIComponent(serviceName)}&ownerId=${config.render.ownerId}`, {
    headers: {
      'Authorization': `Bearer ${config.render.apiKey}`,
    },
  });

  if (!response.ok) {
    throw new Error(`Failed to get services: ${response.status}`);
  }

  const data = await response.json();
  const services = data as { service: RenderService }[];

  if (services.length > 0) {
    return services[0].service;
  }
  return null;
}
