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
  const url = `${RENDER_API_URL}/services/${serviceId}/custom-domains`;
  console.log(`[Render:addCustomDomain] POST ${url}`);
  console.log(`[Render:addCustomDomain] Body: { name: "${domain}" }`);

  const response = await fetch(url, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${config.render.apiKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      name: domain,
    }),
  });

  console.log(`[Render:addCustomDomain] Response status: ${response.status}`);

  if (!response.ok) {
    const errorText = await response.text();
    console.log(`[Render:addCustomDomain] Error response: ${errorText}`);

    // Ignore if domain already exists (409 Conflict)
    if (response.status === 409) {
      console.log(`[Render:addCustomDomain] Domain ${domain} already exists (409), continuing...`);
      return;
    }

    let error = {};
    try {
      error = JSON.parse(errorText);
    } catch (e) {}
    throw new Error(`Failed to add custom domain: ${response.status} - ${JSON.stringify(error)}`);
  }

  const responseText = await response.text();
  console.log(`[Render:addCustomDomain] Success response: ${responseText}`);
  console.log(`[Render:addCustomDomain] Domain ${domain} added successfully`);
}

// ============================================
// CUSTOM DOMAIN MANAGEMENT
// ============================================

export interface RenderCustomDomain {
  id: string;
  name: string;
  domainType: 'apex' | 'subdomain';
  publicSuffix: string;
  redirectForName?: string;
  verificationStatus: 'unverified' | 'verified';
  createdAt: string;
  server: {
    id: string;
    name: string;
  };
}

export interface RenderCertificate {
  id: string;
  certificatePath: string;
  customDomains: string[];
  expiresAt: string;
  issuedAt: string;
}

/**
 * Get all custom domains for a service
 */
export async function getCustomDomains(serviceId: string): Promise<RenderCustomDomain[]> {
  const response = await fetch(`${RENDER_API_URL}/services/${serviceId}/custom-domains`, {
    headers: {
      'Authorization': `Bearer ${config.render.apiKey}`,
    },
  });

  if (!response.ok) {
    throw new Error(`Failed to get custom domains: ${response.status}`);
  }

  const data = await response.json();
  return (data as { customDomain: RenderCustomDomain }[]).map(item => item.customDomain);
}

/**
 * Get a specific custom domain by name
 */
export async function getCustomDomain(serviceId: string, domainName: string): Promise<RenderCustomDomain | null> {
  const url = `${RENDER_API_URL}/services/${serviceId}/custom-domains/${encodeURIComponent(domainName)}`;
  console.log(`[Render:getCustomDomain] GET ${url}`);

  const response = await fetch(url, {
    headers: {
      'Authorization': `Bearer ${config.render.apiKey}`,
    },
  });

  console.log(`[Render:getCustomDomain] Response status: ${response.status}`);

  if (response.status === 404) {
    console.log(`[Render:getCustomDomain] Domain not found (404)`);
    return null;
  }

  if (!response.ok) {
    const errorText = await response.text();
    console.log(`[Render:getCustomDomain] Error: ${response.status} - ${errorText}`);
    throw new Error(`Failed to get custom domain: ${response.status}`);
  }

  const data = await response.json();
  console.log(`[Render:getCustomDomain] Response:`, JSON.stringify(data, null, 2));
  return data;
}

/**
 * Verify DNS configuration for a custom domain
 * Note: Render's verify endpoint may return empty response, so we fetch the domain status after
 */
export async function verifyCustomDomain(serviceId: string, domainName: string): Promise<{
  verified: boolean;
  verificationStatus: 'unverified' | 'verified';
}> {
  const url = `${RENDER_API_URL}/services/${serviceId}/custom-domains/${encodeURIComponent(domainName)}/verify`;
  console.log(`[Render:verifyCustomDomain] POST ${url}`);

  // First, trigger the verification
  const response = await fetch(url, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${config.render.apiKey}`,
    },
  });

  console.log(`[Render:verifyCustomDomain] Response status: ${response.status} ${response.statusText}`);
  console.log(`[Render:verifyCustomDomain] Response headers:`, Object.fromEntries(response.headers.entries()));

  if (!response.ok) {
    const errorText = await response.text();
    console.log(`[Render:verifyCustomDomain] Error response body: "${errorText}"`);
    let errorJson = {};
    try {
      errorJson = JSON.parse(errorText);
    } catch (e) {}
    throw new Error(`Failed to verify custom domain: ${response.status} - ${JSON.stringify(errorJson)}`);
  }

  // Try to parse response, but it might be empty (204 No Content or empty body)
  const text = await response.text();
  console.log(`[Render:verifyCustomDomain] Response body length: ${text.length}`);
  console.log(`[Render:verifyCustomDomain] Response body: "${text.substring(0, 500)}"`);

  let data: any = null;
  if (text) {
    try {
      data = JSON.parse(text);
      console.log(`[Render:verifyCustomDomain] Parsed JSON:`, data);
    } catch (e) {
      console.log(`[Render:verifyCustomDomain] Failed to parse JSON: ${e}`);
    }
  }

  // If we got a response with verificationStatus, use it
  if (data && data.verificationStatus) {
    console.log(`[Render:verifyCustomDomain] Using response verificationStatus: ${data.verificationStatus}`);
    return {
      verified: data.verificationStatus === 'verified',
      verificationStatus: data.verificationStatus,
    };
  }

  // Otherwise, fetch the domain to get its current status
  console.log(`[Render:verifyCustomDomain] Response empty or no verificationStatus, fetching domain status...`);
  const domain = await getCustomDomain(serviceId, domainName);
  console.log(`[Render:verifyCustomDomain] getCustomDomain result:`, domain);

  if (domain) {
    console.log(`[Render:verifyCustomDomain] Domain found, verificationStatus: ${domain.verificationStatus}`);
    return {
      verified: domain.verificationStatus === 'verified',
      verificationStatus: domain.verificationStatus,
    };
  }

  // Domain not found after verification (shouldn't happen)
  console.log(`[Render:verifyCustomDomain] Domain not found! Returning unverified.`);
  return {
    verified: false,
    verificationStatus: 'unverified',
  };
}

/**
 * Delete a custom domain from a service
 */
export async function deleteCustomDomain(serviceId: string, domainName: string): Promise<void> {
  console.log(`[Render] Deleting custom domain ${domainName} from service ${serviceId}`);

  const response = await fetch(
    `${RENDER_API_URL}/services/${serviceId}/custom-domains/${encodeURIComponent(domainName)}`,
    {
      method: 'DELETE',
      headers: {
        'Authorization': `Bearer ${config.render.apiKey}`,
      },
    }
  );

  if (response.status === 404) {
    console.log(`[Render] Domain ${domainName} not found, skipping deletion`);
    return;
  }

  if (!response.ok) {
    throw new Error(`Failed to delete custom domain: ${response.status}`);
  }

  console.log(`[Render] Custom domain ${domainName} deleted successfully`);
}

/**
 * Get certificates for a service (to check SSL status)
 */
export async function getCertificates(serviceId: string): Promise<RenderCertificate[]> {
  const response = await fetch(`${RENDER_API_URL}/services/${serviceId}/certificates`, {
    headers: {
      'Authorization': `Bearer ${config.render.apiKey}`,
    },
  });

  // Certificates endpoint may not exist for all services
  if (response.status === 404) {
    return [];
  }

  if (!response.ok) {
    throw new Error(`Failed to get certificates: ${response.status}`);
  }

  const data = await response.json();
  return (data as { certificate: RenderCertificate }[]).map(item => item.certificate);
}

/**
 * Check if a domain has a valid SSL certificate
 */
export async function getDomainCertificateStatus(serviceId: string, domainName: string): Promise<'pending' | 'issued' | 'error'> {
  try {
    const certificates = await getCertificates(serviceId);
    const hasCert = certificates.some(cert =>
      cert.customDomains.includes(domainName)
    );
    return hasCert ? 'issued' : 'pending';
  } catch {
    return 'pending';
  }
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
