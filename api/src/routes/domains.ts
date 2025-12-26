/**
 * Domain Routes
 * API endpoints for domain registration via Namecheap
 */

import { Router, Response } from 'express';
import { AuthenticatedRequest, authMiddleware } from '../middleware/auth.js';
import * as namecheap from '../services/namecheap.js';

const router = Router();

/**
 * Format phone number to Namecheap's required format: +CountryCode.PhoneNumber
 * Examples:
 *   +40747934436 -> +40.747934436
 *   +1234567890 -> +1.234567890
 *   40747934436 -> +40.747934436
 */
function formatPhoneForNamecheap(phone: string): string {
  // Remove all non-digit characters except +
  let cleaned = phone.replace(/[^\d+]/g, '');

  // Ensure it starts with +
  if (!cleaned.startsWith('+')) {
    cleaned = '+' + cleaned;
  }

  // If already has a dot after country code, return as-is
  if (/^\+\d{1,3}\.\d+$/.test(phone)) {
    return phone;
  }

  // Common country code lengths: 1 (US), 2 (most), 3 (some)
  // We'll detect based on known patterns
  const withoutPlus = cleaned.substring(1);

  // Country code detection
  let countryCodeLength = 2; // default

  // 1-digit: US/Canada (+1)
  if (withoutPlus.startsWith('1') && withoutPlus.length === 11) {
    countryCodeLength = 1;
  }
  // 3-digit codes (e.g., +351 Portugal, +353 Ireland, +372 Estonia)
  else if (/^(35[0-9]|37[0-9]|38[0-9]|42[0-9]|50[0-9]|59[0-9]|67[0-9]|68[0-9]|85[0-9]|88[0-9]|96[0-9]|97[0-9]|99[0-9])/.test(withoutPlus)) {
    countryCodeLength = 3;
  }
  // 2-digit codes (most common: +40 Romania, +44 UK, +49 Germany, etc.)
  else {
    countryCodeLength = 2;
  }

  const countryCode = withoutPlus.substring(0, countryCodeLength);
  const phoneNumber = withoutPlus.substring(countryCodeLength);

  return `+${countryCode}.${phoneNumber}`;
}

/**
 * GET /domains/check?domain=example.com
 * Check if a domain is available for registration
 */
router.get('/check', async (req, res) => {
  try {
    const { domain } = req.query;

    if (!domain || typeof domain !== 'string') {
      return res.status(400).json({ error: 'Domain parameter is required' });
    }

    if (!namecheap.isConfigured()) {
      return res.status(503).json({ error: 'Domain service not configured' });
    }

    const results = await namecheap.checkDomainAvailability([domain]);
    const result = results[0];

    if (!result) {
      return res.status(404).json({ error: 'Could not check domain' });
    }

    return res.json({
      domain: result.domain,
      available: result.available,
      premium: result.premium,
      premiumPrice: result.premiumPrice,
    });
  } catch (error) {
    console.error('Domain check error:', error);
    return res.status(500).json({
      error: 'Failed to check domain availability',
      message: error instanceof Error ? error.message : 'Unknown error',
    });
  }
});

/**
 * GET /domains/check-bulk?domains=example.com,test.net
 * Check multiple domains at once
 */
router.get('/check-bulk', async (req, res) => {
  try {
    const { domains } = req.query;

    if (!domains || typeof domains !== 'string') {
      return res.status(400).json({ error: 'Domains parameter is required (comma-separated)' });
    }

    const domainList = domains.split(',').map((d) => d.trim()).filter(Boolean);

    if (domainList.length === 0) {
      return res.status(400).json({ error: 'At least one domain is required' });
    }

    if (domainList.length > 50) {
      return res.status(400).json({ error: 'Maximum 50 domains per request' });
    }

    if (!namecheap.isConfigured()) {
      return res.status(503).json({ error: 'Domain service not configured' });
    }

    const results = await namecheap.checkDomainAvailability(domainList);

    return res.json({ domains: results });
  } catch (error) {
    console.error('Bulk domain check error:', error);
    return res.status(500).json({
      error: 'Failed to check domains',
      message: error instanceof Error ? error.message : 'Unknown error',
    });
  }
});

/**
 * GET /domains/suggest?keyword=mybusiness
 * Get domain name suggestions based on a keyword
 */
router.get('/suggest', async (req, res) => {
  try {
    const { keyword } = req.query;

    if (!keyword || typeof keyword !== 'string') {
      return res.status(400).json({ error: 'Keyword parameter is required' });
    }

    // Sanitize keyword
    const sanitized = keyword.toLowerCase().replace(/[^a-z0-9]/g, '');

    if (sanitized.length < 2) {
      return res.status(400).json({ error: 'Keyword must be at least 2 characters' });
    }

    if (!namecheap.isConfigured()) {
      return res.status(503).json({ error: 'Domain service not configured' });
    }

    const suggestions = await namecheap.getDomainSuggestions(sanitized);

    // Sort: available first
    suggestions.sort((a, b) => (b.available ? 1 : 0) - (a.available ? 1 : 0));

    return res.json({ suggestions });
  } catch (error) {
    console.error('Domain suggestions error:', error);
    return res.status(500).json({
      error: 'Failed to get domain suggestions',
      message: error instanceof Error ? error.message : 'Unknown error',
    });
  }
});

/**
 * GET /domains/pricing
 * Get TLD pricing information
 */
router.get('/pricing', async (req, res) => {
  try {
    if (!namecheap.isConfigured()) {
      return res.status(503).json({ error: 'Domain service not configured' });
    }

    const pricing = await namecheap.getTldPricing();

    // Return top 20 TLDs
    return res.json({ tlds: pricing.slice(0, 20) });
  } catch (error) {
    console.error('Pricing error:', error);
    return res.status(500).json({
      error: 'Failed to get pricing',
      message: error instanceof Error ? error.message : 'Unknown error',
    });
  }
});

/**
 * POST /domains/purchase
 * Purchase/register a domain (requires authentication)
 *
 * Body:
 * {
 *   domain: "example.com",
 *   years: 1,
 *   contact: {
 *     firstName: "John",
 *     lastName: "Doe",
 *     address1: "123 Main St",
 *     city: "New York",
 *     stateProvince: "NY",
 *     postalCode: "10001",
 *     country: "US",
 *     phone: "+1.2125551234",
 *     email: "john@example.com"
 *   }
 * }
 */
router.post(
  '/purchase',
  authMiddleware,
  async (req: AuthenticatedRequest, res: Response) => {
    try {
      const { domain, years, contact } = req.body;

      // Validate input
      if (!domain || typeof domain !== 'string') {
        return res.status(400).json({ error: 'Domain is required' });
      }

      if (!years || years < 1 || years > 10) {
        return res.status(400).json({ error: 'Years must be between 1 and 10' });
      }

      if (!contact) {
        return res.status(400).json({ error: 'Contact information is required' });
      }

      const requiredFields = [
        'firstName',
        'lastName',
        'address1',
        'city',
        'stateProvince',
        'postalCode',
        'country',
        'phone',
        'email',
      ];

      for (const field of requiredFields) {
        if (!contact[field]) {
          return res.status(400).json({ error: `Contact ${field} is required` });
        }
      }

      if (!namecheap.isConfigured()) {
        return res.status(503).json({ error: 'Domain service not configured' });
      }

      // Check availability first
      const [availability] = await namecheap.checkDomainAvailability([domain]);

      if (!availability?.available) {
        return res.status(400).json({
          error: 'Domain not available',
          domain,
          available: false,
        });
      }

      // Format phone number for Namecheap
      const formattedContact = {
        ...contact,
        phone: formatPhoneForNamecheap(contact.phone),
      };

      console.log(`[Domains] Formatted phone: ${contact.phone} -> ${formattedContact.phone}`);

      // Register the domain
      const result = await namecheap.registerDomain(domain, years, formattedContact);

      if (!result.registered) {
        return res.status(400).json({
          error: result.error || 'Registration failed',
          domain,
        });
      }

      console.log(`[Domains] User ${req.user!.uid} registered domain: ${domain}`);

      return res.json({
        success: true,
        domain: result.domain,
        orderId: result.orderId,
        transactionId: result.transactionId,
        chargedAmount: result.chargedAmount,
      });
    } catch (error) {
      console.error('Domain purchase error:', error);
      return res.status(500).json({
        error: 'Failed to purchase domain',
        message: error instanceof Error ? error.message : 'Unknown error',
      });
    }
  }
);

/**
 * POST /domains/:domain/dns
 * Configure DNS for a domain (requires authentication)
 *
 * Body:
 * {
 *   records: [
 *     { type: "A", host: "@", value: "1.2.3.4" },
 *     { type: "CNAME", host: "www", value: "example.com" }
 *   ]
 * }
 */
router.post(
  '/:domain/dns',
  authMiddleware,
  async (req: AuthenticatedRequest, res: Response) => {
    try {
      const { domain } = req.params;
      const { records } = req.body;

      if (!records || !Array.isArray(records) || records.length === 0) {
        return res.status(400).json({ error: 'DNS records are required' });
      }

      if (!namecheap.isConfigured()) {
        return res.status(503).json({ error: 'Domain service not configured' });
      }

      const success = await namecheap.setDnsHostRecords(domain, records);

      if (!success) {
        return res.status(400).json({ error: 'Failed to set DNS records' });
      }

      return res.json({ success: true, domain });
    } catch (error) {
      console.error('DNS configuration error:', error);
      return res.status(500).json({
        error: 'Failed to configure DNS',
        message: error instanceof Error ? error.message : 'Unknown error',
      });
    }
  }
);

/**
 * GET /domains/status
 * Check if domain service is configured and get account balance
 */
router.get(
  '/status',
  authMiddleware,
  async (req: AuthenticatedRequest, res: Response) => {
    try {
      const configured = namecheap.isConfigured();

      if (!configured) {
        return res.json({
          configured: false,
          message: 'Namecheap API not configured',
        });
      }

      const balance = await namecheap.getAccountBalance();

      return res.json({
        configured: true,
        balance: balance.balance,
        currency: balance.currency,
      });
    } catch (error) {
      console.error('Status check error:', error);
      return res.status(500).json({
        error: 'Failed to check status',
        message: error instanceof Error ? error.message : 'Unknown error',
      });
    }
  }
);

export default router;
