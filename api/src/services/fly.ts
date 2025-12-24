import { config } from '../config/index.js';

const FLY_API_URL = 'https://api.fly.io/graphql';

export interface FlyCertificate {
  id: string;
  hostname: string;
  clientStatus: string; // 'Awaiting configuration' | 'Ready'
  issued: {
    nodes: Array<{
      type: string;
      expiresAt: string;
    }>;
  };
  source: string;
  createdAt: string;
  dnsValidationHostname: string;
  dnsValidationTarget: string;
}

interface FlyGraphQLResponse<T> {
  data?: T;
  errors?: Array<{ message: string }>;
}

/**
 * Make a GraphQL request to Fly API
 */
async function flyRequest<T>(query: string, variables: Record<string, unknown> = {}): Promise<T> {
  console.log(`[Fly] GraphQL request`);

  const response = await fetch(FLY_API_URL, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${config.fly.apiToken}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ query, variables }),
  });

  const data = await response.json() as FlyGraphQLResponse<T>;

  if (data.errors && data.errors.length > 0) {
    const errorMsg = data.errors.map(e => e.message).join(', ');
    console.error(`[Fly] Error: ${errorMsg}`);
    throw new Error(`Fly API error: ${errorMsg}`);
  }

  if (!data.data) {
    throw new Error('Fly API returned no data');
  }

  return data.data;
}

/**
 * Add a custom domain certificate to Fly app
 */
export async function addCertificate(hostname: string): Promise<FlyCertificate> {
  console.log(`[Fly] Adding certificate for: ${hostname}`);

  const query = `
    mutation($appId: ID!, $hostname: String!) {
      addCertificate(appId: $appId, hostname: $hostname) {
        certificate {
          id
          hostname
          clientStatus
          source
          createdAt
          dnsValidationHostname
          dnsValidationTarget
          issued {
            nodes {
              type
              expiresAt
            }
          }
        }
      }
    }
  `;

  const result = await flyRequest<{
    addCertificate: { certificate: FlyCertificate };
  }>(query, {
    appId: config.fly.appName,
    hostname,
  });

  console.log(`[Fly] Certificate added for ${hostname}:`, result.addCertificate.certificate.clientStatus);
  return result.addCertificate.certificate;
}

/**
 * Get certificate status for a hostname
 */
export async function getCertificate(hostname: string): Promise<FlyCertificate | null> {
  console.log(`[Fly] Getting certificate for: ${hostname}`);

  const query = `
    query($appName: String!, $hostname: String!) {
      app(name: $appName) {
        certificate(hostname: $hostname) {
          id
          hostname
          clientStatus
          source
          createdAt
          dnsValidationHostname
          dnsValidationTarget
          issued {
            nodes {
              type
              expiresAt
            }
          }
        }
      }
    }
  `;

  try {
    const result = await flyRequest<{
      app: { certificate: FlyCertificate | null };
    }>(query, {
      appName: config.fly.appName,
      hostname,
    });

    return result.app.certificate;
  } catch (error) {
    console.error(`[Fly] Error getting certificate:`, error);
    return null;
  }
}

/**
 * Delete a certificate from Fly app
 */
export async function deleteCertificate(hostname: string): Promise<void> {
  console.log(`[Fly] Deleting certificate for: ${hostname}`);

  const query = `
    mutation($appId: ID!, $hostname: String!) {
      deleteCertificate(appId: $appId, hostname: $hostname) {
        app {
          name
        }
      }
    }
  `;

  await flyRequest(query, {
    appId: config.fly.appName,
    hostname,
  });

  console.log(`[Fly] Certificate deleted for ${hostname}`);
}

/**
 * Check certificate status - returns true if SSL is ready
 */
export async function isCertificateReady(hostname: string): Promise<boolean> {
  const cert = await getCertificate(hostname);
  if (!cert) return false;

  // 'Ready' means SSL is issued and working
  return cert.clientStatus === 'Ready';
}

/**
 * Get the CNAME target for custom domains
 * This is what users should point their CNAME to
 */
export function getCnameTarget(): string {
  return config.fly.appHostname || `${config.fly.appName}.fly.dev`;
}

/**
 * Check if Fly is properly configured
 */
export function isConfigured(): boolean {
  return !!(config.fly.apiToken && config.fly.appName);
}
