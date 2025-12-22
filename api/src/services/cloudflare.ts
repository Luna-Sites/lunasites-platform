import { config } from '../config/index.js';

const CLOUDFLARE_API_URL = 'https://api.cloudflare.com/client/v4';

export interface CloudflareCustomHostname {
  id: string;
  hostname: string;
  status: 'pending' | 'active' | 'moved' | 'deleted';
  ssl: {
    status: 'initializing' | 'pending_validation' | 'pending_issuance' | 'pending_deployment' | 'active';
    method: 'http' | 'txt';
    type: 'dv';
    validation_records?: Array<{
      status: string;
      txt_name?: string;
      txt_value?: string;
      http_url?: string;
      http_body?: string;
    }>;
  };
  ownership_verification?: {
    type: 'txt';
    name: string;
    value: string;
  };
  created_at: string;
}

interface CloudflareResponse<T> {
  success: boolean;
  errors: Array<{ code: number; message: string }>;
  messages: Array<string>;
  result: T;
}

/**
 * Make a request to Cloudflare API
 */
async function cloudflareRequest<T>(
  endpoint: string,
  options: RequestInit = {}
): Promise<T> {
  const url = `${CLOUDFLARE_API_URL}${endpoint}`;
  console.log(`[Cloudflare] ${options.method || 'GET'} ${url}`);

  // Support both API Token (Bearer) and Global API Key
  const authHeaders: Record<string, string> = {};

  if (config.cloudflare.apiEmail && config.cloudflare.apiKey) {
    // Global API Key authentication
    authHeaders['X-Auth-Email'] = config.cloudflare.apiEmail;
    authHeaders['X-Auth-Key'] = config.cloudflare.apiKey;
    console.log(`[Cloudflare] Using Global API Key auth for ${config.cloudflare.apiEmail}`);
  } else if (config.cloudflare.apiToken) {
    // API Token (Bearer) authentication
    authHeaders['Authorization'] = `Bearer ${config.cloudflare.apiToken}`;
    console.log(`[Cloudflare] Using Bearer token auth`);
  }

  const response = await fetch(url, {
    ...options,
    headers: {
      ...authHeaders,
      'Content-Type': 'application/json',
      ...options.headers,
    },
  });

  const data = await response.json() as CloudflareResponse<T>;

  console.log(`[Cloudflare] Response status: ${response.status}`);

  if (!data.success) {
    const errorMsg = data.errors.map(e => e.message).join(', ');
    console.error(`[Cloudflare] Error: ${errorMsg}`);
    throw new Error(`Cloudflare API error: ${errorMsg}`);
  }

  return data.result;
}

/**
 * Add a custom hostname (custom domain) to Cloudflare for SaaS
 */
export async function addCustomHostname(hostname: string): Promise<CloudflareCustomHostname> {
  console.log(`[Cloudflare] Adding custom hostname: ${hostname}`);

  const result = await cloudflareRequest<CloudflareCustomHostname>(
    `/zones/${config.cloudflare.zoneId}/custom_hostnames`,
    {
      method: 'POST',
      body: JSON.stringify({
        hostname,
        ssl: {
          method: 'http',  // HTTP validation (automatic)
          type: 'dv',      // Domain Validation
          settings: {
            min_tls_version: '1.2',
          },
        },
        custom_origin_server: config.cloudflare.originServer, // e.g., lunacms-worker.onrender.com
      }),
    }
  );

  console.log(`[Cloudflare] Custom hostname added:`, result);
  return result;
}

/**
 * Get a custom hostname by ID
 */
export async function getCustomHostname(hostnameId: string): Promise<CloudflareCustomHostname | null> {
  try {
    const result = await cloudflareRequest<CloudflareCustomHostname>(
      `/zones/${config.cloudflare.zoneId}/custom_hostnames/${hostnameId}`
    );
    return result;
  } catch (error) {
    console.error(`[Cloudflare] Error getting hostname:`, error);
    return null;
  }
}

/**
 * Get a custom hostname by domain name
 */
export async function getCustomHostnameByName(hostname: string): Promise<CloudflareCustomHostname | null> {
  try {
    const result = await cloudflareRequest<CloudflareCustomHostname[]>(
      `/zones/${config.cloudflare.zoneId}/custom_hostnames?hostname=${encodeURIComponent(hostname)}`
    );
    return result.length > 0 ? result[0] : null;
  } catch (error) {
    console.error(`[Cloudflare] Error getting hostname by name:`, error);
    return null;
  }
}

/**
 * Delete a custom hostname
 */
export async function deleteCustomHostname(hostnameId: string): Promise<void> {
  console.log(`[Cloudflare] Deleting custom hostname: ${hostnameId}`);

  await cloudflareRequest<{ id: string }>(
    `/zones/${config.cloudflare.zoneId}/custom_hostnames/${hostnameId}`,
    { method: 'DELETE' }
  );

  console.log(`[Cloudflare] Custom hostname deleted`);
}

/**
 * Refresh SSL validation for a custom hostname
 * Call this to re-trigger SSL certificate issuance
 */
export async function refreshCustomHostnameSSL(hostnameId: string): Promise<CloudflareCustomHostname> {
  console.log(`[Cloudflare] Refreshing SSL for hostname: ${hostnameId}`);

  const result = await cloudflareRequest<CloudflareCustomHostname>(
    `/zones/${config.cloudflare.zoneId}/custom_hostnames/${hostnameId}`,
    {
      method: 'PATCH',
      body: JSON.stringify({
        ssl: {
          method: 'http',
          type: 'dv',
        },
      }),
    }
  );

  return result;
}

/**
 * Get the CNAME target for custom domains
 * This is the hostname users should point their CNAME to
 */
export function getCnameTarget(): string {
  // For Cloudflare for SaaS, users CNAME to your fallback origin
  // or a specific hostname like "custom.luna-sites.com"
  return config.cloudflare.cnameTarget || `custom.${config.baseDomain}`;
}

/**
 * Check if Cloudflare is properly configured
 */
export function isConfigured(): boolean {
  return !!(
    config.cloudflare.apiToken &&
    config.cloudflare.zoneId &&
    config.cloudflare.originServer
  );
}
