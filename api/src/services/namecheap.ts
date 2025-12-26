/**
 * Namecheap API Service
 * Domain registration, availability check, pricing, and suggestions
 *
 * API Docs: https://www.namecheap.com/support/api/intro/
 */

import { config } from '../config/index.js';

const SANDBOX_URL = 'https://api.sandbox.namecheap.com/xml.response';
const PRODUCTION_URL = 'https://api.namecheap.com/xml.response';

// Get API URL based on environment
function getApiUrl(): string {
  return config.namecheap.sandbox ? SANDBOX_URL : PRODUCTION_URL;
}

// Build base query params for all API calls
function getBaseParams(): URLSearchParams {
  const params = new URLSearchParams();
  params.set('ApiUser', config.namecheap.apiUser);
  params.set('ApiKey', config.namecheap.apiKey);
  params.set('UserName', config.namecheap.username);
  params.set('ClientIp', config.namecheap.clientIp);
  return params;
}

// Simple XML parser for Namecheap responses
function parseXmlValue(xml: string, tag: string): string | null {
  const regex = new RegExp(`<${tag}[^>]*>([^<]*)</${tag}>`, 'i');
  const match = xml.match(regex);
  return match ? match[1] : null;
}

function parseXmlAttribute(xml: string, tag: string, attr: string): string | null {
  const regex = new RegExp(`<${tag}[^>]*${attr}="([^"]*)"`, 'i');
  const match = xml.match(regex);
  return match ? match[1] : null;
}

function parseXmlElements(xml: string, tag: string): string[] {
  const regex = new RegExp(`<${tag}[^>]*>([\\s\\S]*?)</${tag}>`, 'gi');
  const matches = [];
  let match;
  while ((match = regex.exec(xml)) !== null) {
    matches.push(match[0]);
  }
  return matches;
}

// Check if API response has errors
function checkApiErrors(xml: string): void {
  const status = parseXmlAttribute(xml, 'ApiResponse', 'Status');
  if (status === 'ERROR') {
    const errorMsg = parseXmlValue(xml, 'Message') || 'Unknown Namecheap API error';
    throw new Error(errorMsg);
  }
}

// ============================================================================
// Domain Availability Check
// ============================================================================

export interface DomainAvailability {
  domain: string;
  available: boolean;
  premium: boolean;
  premiumPrice?: number;
}

/**
 * Check if domains are available for registration
 * @param domains - Array of domain names to check (e.g., ['example.com', 'test.net'])
 */
export async function checkDomainAvailability(domains: string[]): Promise<DomainAvailability[]> {
  const params = getBaseParams();
  params.set('Command', 'namecheap.domains.check');
  params.set('DomainList', domains.join(','));

  console.log(`[Namecheap] Checking availability for: ${domains.join(', ')}`);

  const response = await fetch(`${getApiUrl()}?${params.toString()}`);
  const xml = await response.text();

  checkApiErrors(xml);

  const results: DomainAvailability[] = [];
  const domainElements = parseXmlElements(xml, 'DomainCheckResult');

  for (const element of domainElements) {
    const domain = parseXmlAttribute(element, 'DomainCheckResult', 'Domain');
    const available = parseXmlAttribute(element, 'DomainCheckResult', 'Available') === 'true';
    const premium = parseXmlAttribute(element, 'DomainCheckResult', 'IsPremiumName') === 'true';
    const premiumPrice = parseXmlAttribute(element, 'DomainCheckResult', 'PremiumRegistrationPrice');

    if (domain) {
      results.push({
        domain,
        available,
        premium,
        premiumPrice: premiumPrice ? parseFloat(premiumPrice) : undefined,
      });
    }
  }

  return results;
}

// ============================================================================
// Domain Suggestions
// ============================================================================

export interface DomainSuggestion {
  domain: string;
  available: boolean;
}

/**
 * Get domain name suggestions based on a keyword
 * @param keyword - The keyword to base suggestions on
 */
export async function getDomainSuggestions(keyword: string): Promise<DomainSuggestion[]> {
  // Namecheap doesn't have a direct suggestions API, so we'll generate common variations
  const tlds = ['.com', '.net', '.org', '.io', '.co', '.app', '.dev', '.site', '.online'];
  const variations = [
    keyword,
    `get${keyword}`,
    `my${keyword}`,
    `the${keyword}`,
    `${keyword}app`,
    `${keyword}site`,
    `${keyword}hq`,
  ];

  const domainsToCheck: string[] = [];
  for (const variation of variations) {
    for (const tld of tlds.slice(0, 4)) {
      // Check first 4 TLDs per variation
      domainsToCheck.push(`${variation}${tld}`);
    }
  }

  // Limit to 20 domains per check
  const limitedDomains = domainsToCheck.slice(0, 20);
  const availability = await checkDomainAvailability(limitedDomains);

  return availability.map((d) => ({
    domain: d.domain,
    available: d.available,
  }));
}

// ============================================================================
// Domain Pricing
// ============================================================================

export interface TldPricing {
  tld: string;
  registerPrice: number;
  renewPrice: number;
  transferPrice: number;
  currency: string;
}

/**
 * Get pricing for domain TLDs
 * @param productType - Type: 'DOMAIN' for registration pricing
 */
export async function getTldPricing(): Promise<TldPricing[]> {
  const params = getBaseParams();
  params.set('Command', 'namecheap.users.getPricing');
  params.set('ProductType', 'DOMAIN');
  params.set('ProductCategory', 'REGISTER');

  console.log('[Namecheap] Fetching TLD pricing');

  const response = await fetch(`${getApiUrl()}?${params.toString()}`);
  const xml = await response.text();

  checkApiErrors(xml);

  // Parse pricing from response
  const results: TldPricing[] = [];
  const productElements = parseXmlElements(xml, 'Product');

  for (const element of productElements) {
    const name = parseXmlAttribute(element, 'Product', 'Name');
    if (!name) continue;

    // Extract TLD from product name (e.g., "com" -> ".com")
    const tld = `.${name.toLowerCase()}`;

    // Get price from first Price element
    const priceElement = parseXmlElements(element, 'Price')[0];
    if (!priceElement) continue;

    const price = parseXmlAttribute(priceElement, 'Price', 'Price');
    const currency = parseXmlAttribute(priceElement, 'Price', 'Currency') || 'USD';

    if (price) {
      results.push({
        tld,
        registerPrice: parseFloat(price),
        renewPrice: parseFloat(price), // Will be updated with actual renew price
        transferPrice: parseFloat(price),
        currency,
      });
    }
  }

  // Return popular TLDs first
  const popularTlds = ['.com', '.net', '.org', '.io', '.co', '.app', '.dev', '.site'];
  return results.sort((a, b) => {
    const aIndex = popularTlds.indexOf(a.tld);
    const bIndex = popularTlds.indexOf(b.tld);
    if (aIndex === -1 && bIndex === -1) return 0;
    if (aIndex === -1) return 1;
    if (bIndex === -1) return -1;
    return aIndex - bIndex;
  });
}

// ============================================================================
// Domain Registration
// ============================================================================

export interface RegistrantContact {
  firstName: string;
  lastName: string;
  address1: string;
  city: string;
  stateProvince: string;
  postalCode: string;
  country: string;
  phone: string;
  email: string;
  organization?: string;
}

export interface DomainRegistrationResult {
  domain: string;
  registered: boolean;
  orderId?: string;
  transactionId?: string;
  chargedAmount?: number;
  expirationDate?: string;
  error?: string;
}

/**
 * Register a domain
 * @param domain - Domain name to register (e.g., 'example.com')
 * @param years - Number of years to register (1-10)
 * @param contact - Registrant contact information
 */
export async function registerDomain(
  domain: string,
  years: number,
  contact: RegistrantContact
): Promise<DomainRegistrationResult> {
  const params = getBaseParams();
  params.set('Command', 'namecheap.domains.create');
  params.set('DomainName', domain);
  params.set('Years', years.toString());

  // Registrant contact (also used for Admin, Tech, AuxBilling)
  const contactTypes = ['Registrant', 'Admin', 'Tech', 'AuxBilling'];
  for (const type of contactTypes) {
    params.set(`${type}FirstName`, contact.firstName);
    params.set(`${type}LastName`, contact.lastName);
    params.set(`${type}Address1`, contact.address1);
    params.set(`${type}City`, contact.city);
    params.set(`${type}StateProvince`, contact.stateProvince);
    params.set(`${type}PostalCode`, contact.postalCode);
    params.set(`${type}Country`, contact.country);
    params.set(`${type}Phone`, contact.phone);
    params.set(`${type}EmailAddress`, contact.email);
    if (contact.organization) {
      params.set(`${type}OrganizationName`, contact.organization);
    }
  }

  // Enable WhoisGuard (privacy protection) if available
  params.set('AddFreeWhoisguard', 'yes');
  params.set('WGEnabled', 'yes');

  console.log(`[Namecheap] Registering domain: ${domain} for ${years} year(s)`);

  const response = await fetch(`${getApiUrl()}?${params.toString()}`);
  const xml = await response.text();

  try {
    checkApiErrors(xml);

    const registered = parseXmlAttribute(xml, 'DomainCreateResult', 'Registered') === 'true';
    const orderId = parseXmlAttribute(xml, 'DomainCreateResult', 'OrderID');
    const transactionId = parseXmlAttribute(xml, 'DomainCreateResult', 'TransactionID');
    const chargedAmount = parseXmlAttribute(xml, 'DomainCreateResult', 'ChargedAmount');

    return {
      domain,
      registered,
      orderId: orderId || undefined,
      transactionId: transactionId || undefined,
      chargedAmount: chargedAmount ? parseFloat(chargedAmount) : undefined,
    };
  } catch (error) {
    return {
      domain,
      registered: false,
      error: error instanceof Error ? error.message : 'Registration failed',
    };
  }
}

// ============================================================================
// DNS Management
// ============================================================================

/**
 * Set DNS servers for a domain
 * @param domain - Domain name
 * @param nameservers - Array of nameserver hostnames
 */
export async function setDnsServers(domain: string, nameservers: string[]): Promise<boolean> {
  const [sld, tld] = domain.split('.');

  const params = getBaseParams();
  params.set('Command', 'namecheap.domains.dns.setCustom');
  params.set('SLD', sld);
  params.set('TLD', tld);
  params.set('Nameservers', nameservers.join(','));

  console.log(`[Namecheap] Setting DNS for ${domain}: ${nameservers.join(', ')}`);

  const response = await fetch(`${getApiUrl()}?${params.toString()}`);
  const xml = await response.text();

  try {
    checkApiErrors(xml);
    return parseXmlAttribute(xml, 'DomainDNSSetCustomResult', 'Updated') === 'true';
  } catch (error) {
    console.error(`[Namecheap] Failed to set DNS for ${domain}:`, error);
    return false;
  }
}

/**
 * Set DNS host records for a domain
 */
export async function setDnsHostRecords(
  domain: string,
  records: Array<{ type: string; host: string; value: string; ttl?: number }>
): Promise<boolean> {
  const [sld, tld] = domain.split('.');

  const params = getBaseParams();
  params.set('Command', 'namecheap.domains.dns.setHosts');
  params.set('SLD', sld);
  params.set('TLD', tld);

  records.forEach((record, index) => {
    const i = index + 1;
    params.set(`RecordType${i}`, record.type);
    params.set(`HostName${i}`, record.host);
    params.set(`Address${i}`, record.value);
    params.set(`TTL${i}`, (record.ttl || 1800).toString());
  });

  console.log(`[Namecheap] Setting ${records.length} DNS records for ${domain}`);

  const response = await fetch(`${getApiUrl()}?${params.toString()}`);
  const xml = await response.text();

  try {
    checkApiErrors(xml);
    return parseXmlAttribute(xml, 'DomainDNSSetHostsResult', 'IsSuccess') === 'true';
  } catch (error) {
    console.error(`[Namecheap] Failed to set DNS records for ${domain}:`, error);
    return false;
  }
}

// ============================================================================
// Utility
// ============================================================================

/**
 * Check if Namecheap API is configured
 */
export function isConfigured(): boolean {
  return !!(
    config.namecheap.apiUser &&
    config.namecheap.apiKey &&
    config.namecheap.username &&
    config.namecheap.clientIp
  );
}

/**
 * Get account balance
 */
export async function getAccountBalance(): Promise<{ balance: number; currency: string }> {
  const params = getBaseParams();
  params.set('Command', 'namecheap.users.getBalances');

  const response = await fetch(`${getApiUrl()}?${params.toString()}`);
  const xml = await response.text();

  checkApiErrors(xml);

  const balance = parseXmlAttribute(xml, 'UserGetBalancesResult', 'AvailableBalance');
  const currency = parseXmlAttribute(xml, 'UserGetBalancesResult', 'Currency') || 'USD';

  return {
    balance: balance ? parseFloat(balance) : 0,
    currency,
  };
}
