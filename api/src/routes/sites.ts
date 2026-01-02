import { Router, Response } from 'express';
import pg from 'pg';
import admin from 'firebase-admin';
import { AuthenticatedRequest, authMiddleware } from '../middleware/auth.js';
import * as sitesService from '../services/sites.js';
import * as renderService from '../services/render.js';
import * as flyService from '../services/fly.js';
import * as databaseService from '../services/database.js';
import * as masterDbService from '../services/masterDb.js';
import * as siteBootstrap from '../services/siteBootstrap.js';
import * as namecheap from '../services/namecheap.js';
import * as stripeService from '../services/stripe.js';
import { config } from '../config/index.js';
import { generateScreenshotUrl } from '../utils/screenshot.js';

const router = Router();

// Multi-tenant mode flag
const MULTI_TENANT = process.env.MULTI_TENANT === 'true';

// Check site availability (public endpoint)
router.post('/check-availability/:siteId', async (req, res) => {
  try {
    const { siteId } = req.params;

    if (!siteId || siteId.length < 3) {
      return res.status(400).json({ error: 'Invalid site ID' });
    }

    const available = await sitesService.checkSiteAvailability(siteId);

    return res.json({
      site_id: siteId,
      available,
      domain: available ? `${siteId}.${config.baseDomain}` : undefined,
    });
  } catch (error) {
    console.error('Check availability error:', error);
    return res.status(500).json({ error: 'Failed to check availability' });
  }
});

// Get user's sites
router.get(
  '/',
  authMiddleware,
  async (req: AuthenticatedRequest, res: Response) => {
    try {
      const userId = req.user!.uid;
      const sites = await sitesService.getSitesByUserId(userId);

      // Transform for frontend
      const transformed = sites.map((site) => {
        let screenshotUrl: string | undefined;
        try {
          screenshotUrl = generateScreenshotUrl(site.siteId);
        } catch {
          // Ignore if screenshot URL generation fails
        }

        return {
          id: site.id,
          siteId: site.siteId,
          userId: site.userId,
          name: site.name,
          domain: site.domain,
          status: site.status,
          renderUrl: site.renderUrl,
          screenshotUrl,
          createdAt: site.createdAt.toDate().toISOString(),
          updatedAt: site.updatedAt.toDate().toISOString(),
        };
      });

      return res.json(transformed);
    } catch (error) {
      console.error('Get sites error:', error);
      return res.status(500).json({ error: 'Failed to get sites' });
    }
  }
);

// Get specific site
router.get(
  '/:siteId',
  authMiddleware,
  async (req: AuthenticatedRequest, res: Response) => {
    try {
      const { siteId } = req.params;
      const userId = req.user!.uid;

      const site = await sitesService.getSiteBySiteId(siteId);

      if (!site) {
        return res.status(404).json({ error: 'Site not found' });
      }

      if (site.userId !== userId) {
        return res.status(403).json({ error: 'Access denied' });
      }

      return res.json({
        id: site.id,
        siteId: site.siteId,
        userId: site.userId,
        name: site.name,
        domain: site.domain,
        status: site.status,
        renderUrl: site.renderUrl,
        createdAt: site.createdAt.toDate().toISOString(),
        updatedAt: site.updatedAt.toDate().toISOString(),
      });
    } catch (error) {
      console.error('Get site error:', error);
      return res.status(500).json({ error: 'Failed to get site' });
    }
  }
);

// Create new site
router.post(
  '/',
  authMiddleware,
  async (req: AuthenticatedRequest, res: Response) => {
    try {
      const userId = req.user!.uid;
      const { site_id, name, template_id } = req.body;

      if (!site_id || !name) {
        return res.status(400).json({ error: 'site_id and name are required' });
      }

      // Check availability
      const available = await sitesService.checkSiteAvailability(site_id);
      if (!available) {
        return res.status(409).json({ error: 'Site ID already taken' });
      }

      const domain = `${site_id}.${config.baseDomain}`;

      // Create site record in Firestore
      const site = await sitesService.createSite({
        siteId: site_id,
        userId,
        name,
        domain,
      });

      // Deploy site (async) - pass Firebase user info for owner creation
      const ownerEmail = req.user!.email;
      const ownerName = req.user!.name || name;
      deploySite(site.id, site_id, name, userId, ownerEmail, ownerName, template_id).catch((error: Error) => {
        console.error('Site deployment failed:', error);
        sitesService.setSiteError(site.id);
      });

      return res.status(201).json({
        success: true,
        message: 'Site creation started',
        site: {
          id: site.id,
          siteId: site.siteId,
          userId: site.userId,
          name: site.name,
          domain: site.domain,
          status: site.status,
          createdAt: site.createdAt.toDate().toISOString(),
          updatedAt: site.updatedAt.toDate().toISOString(),
        },
      });
    } catch (error) {
      console.error('Create site error:', error);
      return res.status(500).json({ error: 'Failed to create site' });
    }
  }
);

// Delete site
router.delete(
  '/:siteId',
  authMiddleware,
  async (req: AuthenticatedRequest, res: Response) => {
    try {
      const { siteId } = req.params;
      const userId = req.user!.uid;

      const site = await sitesService.getSiteBySiteId(siteId);

      if (!site) {
        return res.status(404).json({ error: 'Site not found' });
      }

      if (site.userId !== userId) {
        return res.status(403).json({ error: 'Access denied' });
      }

      // Delete Render service
      if (site.renderServiceId) {
        await renderService.deleteService(site.renderServiceId).catch(console.error);
      }

      // Drop database for this site
      await databaseService.dropDatabase(siteId).catch((err) => {
        console.error(`Failed to drop database for site ${siteId}:`, err);
      });

      // Delete from Firestore
      await sitesService.deleteSite(site.id);

      return res.json({ success: true, message: 'Site deleted' });
    } catch (error) {
      console.error('Delete site error:', error);
      return res.status(500).json({ error: 'Failed to delete site' });
    }
  }
);

// Helper function to deploy site
async function deploySite(
  docId: string,
  siteId: string,
  siteName: string,
  userId: string,
  ownerEmail?: string,
  ownerName?: string,
  templateId?: string
) {
  console.log(`Starting deployment for site: ${siteId} (multi-tenant: ${MULTI_TENANT}, template: ${templateId || 'none'})`);

  let databaseUrl: string;
  let dbInfo: { host: string; port: string; database: string; user: string; password: string };

  // Check if we should clone from a template
  if (templateId) {
    const template = await masterDbService.getTemplateById(templateId);
    if (template && template.source_site_id) {
      // Clone database from source site
      console.log(`Cloning database from ${template.source_site_id} for site: ${siteId}`);
      databaseUrl = await databaseService.cloneDatabase(template.source_site_id, siteId);
      dbInfo = databaseService.parseDatabaseUrl(databaseUrl);
      console.log(`Database cloned for site: ${siteId}`);

      // Update owner to new user
      console.log(`Updating owner for site: ${siteId}`);
      await databaseService.updateDatabaseOwner(siteId, userId, ownerEmail, ownerName);
      console.log(`Owner updated for site: ${siteId}`);
    } else {
      // Template not found or no source site, fall back to normal creation
      console.log(`Template ${templateId} not found, creating empty database`);
      databaseUrl = await databaseService.createDatabase(siteId);
      dbInfo = databaseService.parseDatabaseUrl(databaseUrl);

      await siteBootstrap.bootstrapSite(
        {
          host: dbInfo.host,
          port: parseInt(dbInfo.port),
          database: dbInfo.database,
          user: dbInfo.user,
          password: dbInfo.password,
        },
        { siteId, firebaseUid: userId, ownerEmail, ownerName }
      );
    }
  } else {
    // No template - create new database and bootstrap
    console.log(`Creating database for site: ${siteId}`);
    databaseUrl = await databaseService.createDatabase(siteId);
    dbInfo = databaseService.parseDatabaseUrl(databaseUrl);
    console.log(`Database created for site: ${siteId}`);

    console.log(`Running bootstrap for site: ${siteId}`);
    await siteBootstrap.bootstrapSite(
      {
        host: dbInfo.host,
        port: parseInt(dbInfo.port),
        database: dbInfo.database,
        user: dbInfo.user,
        password: dbInfo.password,
      },
      { siteId, firebaseUid: userId, ownerEmail, ownerName }
    );
    console.log(`Bootstrap completed for site: ${siteId}`);
  }

  if (MULTI_TENANT) {
    // Multi-tenant mode: register in master DB, no Render service needed
    const domain = `${siteId}.${config.baseDomain}`;

    await masterDbService.registerMasterSite({
      siteId,
      siteName,
      domain,
      userId,
      dbHost: dbInfo.host,
      dbPort: parseInt(dbInfo.port),
      dbName: dbInfo.database,
      dbUser: dbInfo.user,
      dbPassword: dbInfo.password,
    });

    const workerUrl = process.env.MULTI_TENANT_WORKER_URL || `https://${config.baseDomain}`;
    await sitesService.updateSiteRenderInfo(docId, 'multi-tenant', workerUrl);
    await sitesService.setSiteActive(docId);

    console.log(`Site ${siteId} registered in multi-tenant mode at ${domain}`);
  } else {
    // Single-tenant mode: create separate Render service
    const service = await renderService.createSiteService({
      siteId,
      siteName,
      userId,
      databaseUrl,
    });

    const renderUrl = `https://${service.slug}.onrender.com`;

    await sitesService.updateSiteRenderInfo(docId, service.id, renderUrl);

    console.log(`Render service created: ${service.id} - ${renderUrl}`);

    // Poll for deployment status
    pollDeploymentStatus(docId, service.id);
  }
}

// Poll deployment status
function pollDeploymentStatus(siteDocId: string, serviceId: string) {
  const maxAttempts = 60;
  let attempts = 0;

  const poll = async () => {
    attempts++;

    try {
      const service = await renderService.getServiceStatus(serviceId);

      if (service.suspended === 'not_suspended') {
        await sitesService.setSiteActive(siteDocId);
        console.log(`Site ${siteDocId} is now active`);
        return;
      }

      if (attempts < maxAttempts) {
        setTimeout(poll, 10000);
      } else {
        console.log(`Deployment polling timed out for site ${siteDocId}`);
      }
    } catch (error) {
      console.error(`Error polling status for ${siteDocId}:`, error);
      if (attempts < maxAttempts) {
        setTimeout(poll, 10000);
      }
    }
  };

  setTimeout(poll, 30000);
}

// Re-bootstrap a site (admin endpoint - re-runs migrations and seed)
router.post(
  '/:siteId/bootstrap',
  authMiddleware,
  async (req: AuthenticatedRequest, res: Response) => {
    try {
      const { siteId } = req.params;
      const userId = req.user!.uid;

      const site = await sitesService.getSiteBySiteId(siteId);

      if (!site) {
        return res.status(404).json({ error: 'Site not found' });
      }

      if (site.userId !== userId) {
        return res.status(403).json({ error: 'Access denied' });
      }

      // Get database config from master DB
      const dbConfig = await masterDbService.getMasterSiteDbConnection(siteId);
      if (!dbConfig) {
        return res.status(404).json({ error: 'Site database config not found' });
      }

      // Run bootstrap
      await siteBootstrap.bootstrapSite(
        {
          host: dbConfig.host,
          port: dbConfig.port,
          database: dbConfig.database,
          user: dbConfig.user,
          password: dbConfig.password,
        },
        { siteId }
      );

      return res.json({
        success: true,
        message: 'Site re-bootstrapped successfully',
        siteId,
      });
    } catch (error) {
      console.error('Re-bootstrap error:', error);
      return res.status(500).json({
        error: 'Failed to re-bootstrap site',
        message: error instanceof Error ? error.message : 'Unknown error',
      });
    }
  }
);

// ============================================
// CUSTOM DOMAIN ENDPOINTS
// ============================================

// Add custom domain to a site
router.post(
  '/:siteId/domains',
  authMiddleware,
  async (req: AuthenticatedRequest, res: Response) => {
    try {
      const { siteId } = req.params;
      const { domain, autoConfigureDns } = req.body;
      const userId = req.user!.uid;

      if (!domain) {
        return res.status(400).json({ error: 'Domain is required' });
      }

      // Validate domain format
      const domainRegex = /^(?:[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?\.)+[a-zA-Z]{2,}$/;
      if (!domainRegex.test(domain)) {
        return res.status(400).json({ error: 'Invalid domain format' });
      }

      // Verify site ownership
      const site = await sitesService.getSiteBySiteId(siteId);
      if (!site) {
        return res.status(404).json({ error: 'Site not found' });
      }
      if (site.userId !== userId) {
        return res.status(403).json({ error: 'Access denied' });
      }

      // Check if site has a plan that allows custom domains
      const db = admin.firestore();
      const siteBillingDoc = await db
        .collection('siteBilling')
        .where('siteId', '==', siteId)
        .limit(1)
        .get();

      if (!siteBillingDoc.empty) {
        const siteBilling = siteBillingDoc.docs[0].data();
        const plan = siteBilling.plan || 'free';

        if (!stripeService.planAllowsCustomDomain(plan)) {
          return res.status(403).json({
            error: 'Custom domains require a Pro plan',
            currentPlan: plan,
            upgradeRequired: true,
          });
        }
      } else {
        // No billing record = trial or free, custom domain not allowed
        return res.status(403).json({
          error: 'Custom domains require a Pro plan. Please upgrade to add a custom domain.',
          currentPlan: 'trial',
          upgradeRequired: true,
        });
      }

      // Check if this specific domain is already taken by another site
      const domainTaken = await masterDbService.isCustomDomainTaken(domain, siteId);
      if (domainTaken) {
        // If autoConfigureDns is true (Luna Sites purchased domain), allow transfer
        if (autoConfigureDns) {
          console.log(`[CustomDomain] Transferring ${domain} to site ${siteId} (was on another site)`);
          // Remove from old site first
          const oldSite = await masterDbService.getMasterSiteByCustomDomain(domain);
          if (oldSite) {
            await masterDbService.removeMasterSiteCustomDomain(oldSite.site_id, domain);
            console.log(`[CustomDomain] Removed ${domain} from old site ${oldSite.site_id}`);
          }
        } else {
          return res.status(409).json({ error: 'Domain is already in use by another site' });
        }
      }

      // Check if Fly is configured
      if (!flyService.isConfigured()) {
        return res.status(500).json({
          error: 'Fly.io not configured. Please set FLY_API_TOKEN and FLY_APP_NAME.'
        });
      }

      // Add domain to Fly (SSL certificate)
      console.log(`[CustomDomain] Adding ${domain} to Fly`);
      let flyCertificate;

      try {
        flyCertificate = await flyService.addCertificate(domain);
        console.log(`[CustomDomain] Successfully added ${domain} to Fly, status: ${flyCertificate.clientStatus}`);

        // If it's an apex domain, also add the www subdomain
        if (!domain.startsWith('www.')) {
          const wwwDomain = `www.${domain}`;
          console.log(`[CustomDomain] Also adding www subdomain: ${wwwDomain}`);
          try {
            await flyService.addCertificate(wwwDomain);
            console.log(`[CustomDomain] Successfully added ${wwwDomain} to Fly`);
          } catch (wwwError) {
            // It's okay if www fails (might already exist or other reason)
            console.log(`[CustomDomain] Note: Failed to add ${wwwDomain} (may already exist):`, wwwError);
          }
        }
      } catch (flyError) {
        const errorMessage = flyError instanceof Error ? flyError.message : 'Unknown error';

        // If domain already exists in Fly (transfer case), just get the existing certificate
        if (errorMessage.includes('already exists') && autoConfigureDns) {
          console.log(`[CustomDomain] Domain ${domain} already exists in Fly (transfer), getting existing certificate`);
          try {
            flyCertificate = await flyService.getCertificate(domain);
            console.log(`[CustomDomain] Got existing certificate for ${domain}, status: ${flyCertificate?.clientStatus}`);
          } catch (getCertError) {
            console.error(`[CustomDomain] Failed to get existing certificate:`, getCertError);
            // Continue anyway with a default status
            flyCertificate = { clientStatus: 'Ready' };
          }
        } else {
          console.error(`[CustomDomain] Failed to add domain to Fly:`, flyError);
          return res.status(500).json({
            error: 'Failed to add domain to Fly',
            details: errorMessage
          });
        }
      }

      // Save to Firestore
      console.log(`[CustomDomain] Saving to Firestore for site ${site.id}`);
      await sitesService.setCustomDomain(site.id, domain);
      console.log(`[CustomDomain] Saved to Firestore`);

      // Save to master_sites (but not activated yet - unless autoConfigureDns)
      console.log(`[CustomDomain] Saving to master_sites for ${siteId}`);
      await masterDbService.setMasterSiteCustomDomain(siteId, domain);
      console.log(`[CustomDomain] Saved to master_sites`);

      // Get CNAME target for DNS instructions
      const cnameTarget = flyService.getCnameTarget();
      const flyIpv4 = '66.241.125.120'; // Fly.io IPv4 address for apex domains
      const flyIpv6 = '2a09:8280:1::bd:b552:0'; // Fly.io IPv6 address for apex domains

      // If autoConfigureDns is true (domain purchased through Luna Sites), configure DNS automatically
      let autoConfigured = false;
      if (autoConfigureDns && namecheap.isConfigured()) {
        console.log(`[CustomDomain] Auto-configuring DNS for ${domain} via Namecheap`);
        try {
          // Configure DNS records via Namecheap
          const dnsRecords = [
            { type: 'A', host: '@', value: flyIpv4, ttl: 1800 },
            { type: 'AAAA', host: '@', value: flyIpv6, ttl: 1800 },
            { type: 'CNAME', host: 'www', value: cnameTarget, ttl: 1800 },
          ];
          const dnsSuccess = await namecheap.setDnsHostRecords(domain, dnsRecords);

          if (dnsSuccess) {
            console.log(`[CustomDomain] DNS configured successfully for ${domain}`);

            // Mark as verified and activated immediately (same as verify endpoint)
            await sitesService.updateCustomDomainStatus(site.id, domain, 'active');
            await masterDbService.markCustomDomainVerified(siteId, domain);
            await masterDbService.activateMasterSiteCustomDomain(siteId, domain);
            autoConfigured = true;
            console.log(`[CustomDomain] Domain ${domain} marked as verified and activated`);
          } else {
            console.log(`[CustomDomain] Failed to configure DNS for ${domain}, will require manual setup`);
          }
        } catch (dnsError) {
          console.error(`[CustomDomain] Error configuring DNS:`, dnsError);
          // Continue - domain is added but will need manual DNS setup
        }
      }

      console.log(`[CustomDomain] Returning success response for ${domain}`);

      return res.json({
        success: true,
        domain,
        status: 'pending',
        sslStatus: flyCertificate?.clientStatus || 'pending',
        dnsInstructions: {
          records: [
            {
              type: 'A',
              host: '@',
              value: flyIpv4,
              description: 'For the root domain (IPv4)',
            },
            {
              type: 'AAAA',
              host: '@',
              value: flyIpv6,
              description: 'For the root domain (IPv6)',
            },
            {
              type: 'CNAME',
              host: 'www',
              value: cnameTarget,
              description: 'For the www subdomain',
            },
          ],
          cnameTarget,
          flyIpv4,
          flyIpv6,
          note: `Configure DNS records: A record (@ → ${flyIpv4}), AAAA record (@ → ${flyIpv6}), and CNAME (www → ${cnameTarget}). DNS propagation may take up to 48 hours.`,
        },
      });
    } catch (error) {
      console.error('Add custom domain error:', error);
      return res.status(500).json({ error: 'Failed to add custom domain' });
    }
  }
);

// Get custom domains status (returns array)
router.get(
  '/:siteId/domains',
  authMiddleware,
  async (req: AuthenticatedRequest, res: Response) => {
    try {
      const { siteId } = req.params;
      const userId = req.user!.uid;

      // Verify site ownership
      const site = await sitesService.getSiteBySiteId(siteId);
      if (!site) {
        return res.status(404).json({ error: 'Site not found' });
      }
      if (site.userId !== userId) {
        return res.status(403).json({ error: 'Access denied' });
      }

      // Get all custom domains (from new array or legacy single domain)
      const customDomains = site.customDomains || (site.customDomain ? [site.customDomain] : []);

      if (customDomains.length === 0) {
        return res.json({ customDomains: [] });
      }

      // Get CNAME target from Fly config
      const cnameTarget = flyService.getCnameTarget();
      const flyIpv4 = '66.241.125.120';
      const flyIpv6 = '2a09:8280:1::bd:b552:0';

      // Get status from Fly for each domain
      const domainsWithStatus = await Promise.all(
        customDomains.map(async (domainInfo) => {
          let sslStatus = 'pending';
          let verificationStatus = 'unverified';
          let certificateStatus = 'pending';

          try {
            const flyCert = await flyService.getCertificate(domainInfo.domain);
            if (flyCert) {
              sslStatus = flyCert.clientStatus;
              verificationStatus = flyCert.clientStatus === 'Ready' ? 'verified' : 'unverified';
              certificateStatus = flyCert.clientStatus === 'Ready' ? 'issued' : 'pending';
            }
          } catch (err) {
            console.error(`Error fetching Fly certificate for ${domainInfo.domain}:`, err);
          }

          return {
            domain: domainInfo.domain,
            status: domainInfo.status,
            verificationStatus,
            certificateStatus,
            sslStatus,
            addedAt: domainInfo.addedAt.toDate().toISOString(),
            verifiedAt: domainInfo.verifiedAt?.toDate().toISOString(),
            activatedAt: domainInfo.activatedAt?.toDate().toISOString(),
            errorMessage: domainInfo.errorMessage,
          };
        })
      );

      return res.json({
        customDomains: domainsWithStatus,
        dnsInstructions: {
          records: [
            {
              type: 'A',
              host: '@',
              value: flyIpv4,
              description: 'For the root domain (IPv4)',
            },
            {
              type: 'AAAA',
              host: '@',
              value: flyIpv6,
              description: 'For the root domain (IPv6)',
            },
            {
              type: 'CNAME',
              host: 'www',
              value: cnameTarget,
              description: 'For the www subdomain',
            },
          ],
          cnameTarget,
          flyIpv4,
          flyIpv6,
          note: `Configure DNS records: A record (@ → ${flyIpv4}), AAAA record (@ → ${flyIpv6}), and CNAME (www → ${cnameTarget}).`,
        },
      });
    } catch (error) {
      console.error('Get custom domain error:', error);
      return res.status(500).json({ error: 'Failed to get custom domain status' });
    }
  }
);

// Verify/refresh custom domain status
router.post(
  '/:siteId/domains/verify',
  authMiddleware,
  async (req: AuthenticatedRequest, res: Response) => {
    console.log('=== VERIFY DOMAIN ENDPOINT CALLED ===');
    try {
      const { siteId } = req.params;
      const { domain } = req.body; // Accept specific domain from body
      const userId = req.user!.uid;
      console.log(`Verifying domain for site: ${siteId}, domain: ${domain}, user: ${userId}`);

      // Verify site ownership
      const site = await sitesService.getSiteBySiteId(siteId);
      if (!site) {
        return res.status(404).json({ error: 'Site not found' });
      }
      if (site.userId !== userId) {
        return res.status(403).json({ error: 'Access denied' });
      }

      // Get all custom domains
      const customDomains = site.customDomains || (site.customDomain ? [site.customDomain] : []);
      if (customDomains.length === 0) {
        return res.status(400).json({ error: 'No custom domain configured' });
      }

      // Find the specific domain to verify (or use first one for backwards compatibility)
      const domainToVerify = domain || customDomains[0].domain;
      const domainInfo = customDomains.find(d => d.domain === domainToVerify);
      if (!domainInfo) {
        return res.status(404).json({ error: 'Domain not found on this site' });
      }

      // ============================================
      // STEP 1: Check if domain is in site_custom_domains table
      // ============================================
      const masterDomains = await masterDbService.getMasterSiteCustomDomains(siteId);
      const step1Passed = masterDomains.some(d => d.domain === domainToVerify);

      console.log(`Step 1 - Domain in site_custom_domains: ${step1Passed}`);

      if (!step1Passed) {
        return res.json({
          verified: false,
          domain: domainToVerify,
          steps: {
            domainAssigned: false,
            dnsConfigured: false,
          },
          message: 'Domain is not properly assigned to your site. Please try removing and re-adding the domain.',
        });
      }

      // ============================================
      // STEP 2: Check Fly SSL status
      // ============================================
      let step2Passed = false;
      let sslStatus = 'pending';

      try {
        const flyCert = await flyService.getCertificate(domainToVerify);
        if (flyCert) {
          sslStatus = flyCert.clientStatus;
          console.log(`Fly SSL status: ${sslStatus}`);
          step2Passed = flyCert.clientStatus === 'Ready';
        } else {
          console.log('No Fly certificate found, domain may not have been added');
        }
      } catch (err) {
        console.error('Error checking Fly status:', err);
      }

      // If both steps pass, update status and auto-activate
      if (step1Passed && step2Passed) {
        console.log('Both steps passed! Updating status to active...');
        await sitesService.updateCustomDomainStatus(site.id, domainToVerify, 'active');
        await masterDbService.markCustomDomainVerified(siteId, domainToVerify);
        await masterDbService.activateMasterSiteCustomDomain(siteId, domainToVerify);
      }

      return res.json({
        verified: step1Passed && step2Passed,
        domain: domainToVerify,
        steps: {
          domainAssigned: step1Passed,
          dnsConfigured: step2Passed,
        },
        sslStatus,
        message: step2Passed
          ? 'Domain verified and activated successfully. SSL certificate is active.'
          : 'DNS not yet configured. Please add the DNS records at your domain registrar.',
      });
    } catch (error) {
      console.error('Verify custom domain error:', error);
      return res.status(500).json({ error: 'Failed to verify custom domain' });
    }
  }
);

// Activate custom domain (only after verification + SSL)
router.post(
  '/:siteId/domains/activate',
  authMiddleware,
  async (req: AuthenticatedRequest, res: Response) => {
    try {
      const { siteId } = req.params;
      const { domain } = req.body; // Accept specific domain from body
      const userId = req.user!.uid;

      // Verify site ownership
      const site = await sitesService.getSiteBySiteId(siteId);
      if (!site) {
        return res.status(404).json({ error: 'Site not found' });
      }
      if (site.userId !== userId) {
        return res.status(403).json({ error: 'Access denied' });
      }

      // Get all custom domains
      const customDomains = site.customDomains || (site.customDomain ? [site.customDomain] : []);
      if (customDomains.length === 0) {
        return res.status(400).json({ error: 'No custom domain configured' });
      }

      // Find the specific domain to activate (or use first one for backwards compatibility)
      const domainToActivate = domain || customDomains[0].domain;
      const domainInfo = customDomains.find(d => d.domain === domainToActivate);
      if (!domainInfo) {
        return res.status(404).json({ error: 'Domain not found on this site' });
      }

      // Check Fly SSL status before activating
      try {
        const flyCert = await flyService.getCertificate(domainToActivate);

        if (!flyCert || flyCert.clientStatus !== 'Ready') {
          return res.status(400).json({
            error: 'SSL certificate not ready',
            message: 'Please wait for SSL certificate to be issued. Make sure your DNS is configured.',
            sslStatus: flyCert?.clientStatus || 'unknown',
          });
        }
      } catch (err) {
        console.error('Error checking Fly status:', err);
        return res.status(500).json({ error: 'Failed to check domain status' });
      }

      // Activate in site_custom_domains for routing
      await masterDbService.activateMasterSiteCustomDomain(siteId, domainToActivate);

      // Update Firestore status
      await sitesService.updateCustomDomainStatus(site.id, domainToActivate, 'active');

      return res.json({
        success: true,
        message: 'Custom domain activated successfully',
        domain: domainToActivate,
      });
    } catch (error) {
      console.error('Activate custom domain error:', error);
      return res.status(500).json({ error: 'Failed to activate custom domain' });
    }
  }
);

// Remove specific custom domain
router.delete(
  '/:siteId/domains/:domain',
  authMiddleware,
  async (req: AuthenticatedRequest, res: Response) => {
    try {
      const { siteId, domain } = req.params;
      const userId = req.user!.uid;

      // Verify site ownership
      const site = await sitesService.getSiteBySiteId(siteId);
      if (!site) {
        return res.status(404).json({ error: 'Site not found' });
      }
      if (site.userId !== userId) {
        return res.status(403).json({ error: 'Access denied' });
      }

      // Get all custom domains and verify the domain exists
      const customDomains = site.customDomains || (site.customDomain ? [site.customDomain] : []);
      const domainInfo = customDomains.find(d => d.domain === domain);
      if (!domainInfo) {
        return res.status(404).json({ error: 'Domain not found on this site' });
      }

      // Remove from Fly
      try {
        await flyService.deleteCertificate(domain);
        console.log(`[CustomDomain] Deleted ${domain} from Fly`);

        // Also try to delete www subdomain if it exists
        if (!domain.startsWith('www.')) {
          const wwwDomain = `www.${domain}`;
          try {
            await flyService.deleteCertificate(wwwDomain);
            console.log(`[CustomDomain] Deleted ${wwwDomain} from Fly`);
          } catch {
            // Ignore if www doesn't exist
          }
        }
      } catch (err) {
        console.error('Error deleting from Fly:', err);
        // Continue with removal even if Fly fails
      }

      // Remove from site_custom_domains table
      await masterDbService.removeMasterSiteCustomDomain(siteId, domain);

      // Remove from Firestore
      await sitesService.removeCustomDomain(site.id, domain);

      return res.json({
        success: true,
        message: 'Custom domain removed',
        domain,
      });
    } catch (error) {
      console.error('Remove custom domain error:', error);
      return res.status(500).json({ error: 'Failed to remove custom domain' });
    }
  }
);

// Touch site (update updatedAt timestamp)
router.post(
  '/:siteId/touch',
  authMiddleware,
  async (req: AuthenticatedRequest, res: Response) => {
    try {
      const { siteId } = req.params;
      const userId = req.user!.uid;

      // Verify site ownership
      const site = await sitesService.getSiteBySiteId(siteId);
      if (!site) {
        return res.status(404).json({ error: 'Site not found' });
      }
      if (site.userId !== userId) {
        return res.status(403).json({ error: 'Access denied' });
      }

      // Update the updatedAt timestamp
      await sitesService.updateSite(site.id, {});

      return res.json({ success: true });
    } catch (error) {
      console.error('Touch site error:', error);
      return res.status(500).json({ error: 'Failed to touch site' });
    }
  }
);

// Update site theme
router.patch(
  '/:siteId/theme',
  authMiddleware,
  async (req: AuthenticatedRequest, res: Response) => {
    console.log('=== UPDATE THEME ENDPOINT CALLED ===');
    try {
      const { siteId } = req.params;
      const userId = req.user!.uid;
      const { presetId, overrides, darkMode, typography } = req.body;
      console.log(`Updating theme for site: ${siteId}`, { presetId, overrides, darkMode, typography });

      // Verify site ownership
      const site = await sitesService.getSiteBySiteId(siteId);
      if (!site) {
        return res.status(404).json({ error: 'Site not found' });
      }
      if (site.userId !== userId) {
        return res.status(403).json({ error: 'Access denied' });
      }

      // Get database connection for this site
      const dbConfig = await masterDbService.getMasterSiteDbConnection(siteId);
      if (!dbConfig) {
        return res.status(404).json({ error: 'Site database config not found' });
      }

      // Connect to site's database
      const sitePool = new pg.Pool({
        connectionString: dbConfig.connectionString,
        ssl: dbConfig.host.includes('render.com') ? { rejectUnauthorized: false } : false,
      });

      try {
        // Get current controlpanel data
        const result = await sitePool.query(
          "SELECT data FROM controlpanel WHERE id = 'site'"
        );

        let currentData: Record<string, unknown> = {};
        if (result.rows.length > 0 && result.rows[0].data) {
          currentData = result.rows[0].data;
        }

        // Get existing theme to merge typography
        const existingTheme = (currentData.theme as Record<string, unknown>) || {};

        // Update theme in data (merge typography with existing)
        const updatedData = {
          ...currentData,
          theme: {
            presetId: presetId ?? existingTheme.presetId ?? 'default',
            overrides: overrides ?? existingTheme.overrides ?? {},
            darkMode: darkMode ?? existingTheme.darkMode ?? false,
            typography: typography
              ? { ...(existingTheme.typography as Record<string, unknown> || {}), ...typography }
              : existingTheme.typography ?? {
                  fontPresetId: 'modern',
                  fontHeading: 'inter',
                  fontBody: 'inter',
                  baseFontSize: 16,
                  baseFontSizeMobile: 14,
                  headingWeight: 700,
                  bodyWeight: 400,
                },
          },
        };

        // Upsert the controlpanel record
        const upsertResult = await sitePool.query(
          `INSERT INTO controlpanel (id, title, "group", schema, data)
           VALUES ('site', 'Site Settings', 'site', '{}', $1)
           ON CONFLICT (id) DO UPDATE SET data = $1`,
          [updatedData]
        );
        console.log(`Theme upserted for ${siteId}, rows affected:`, upsertResult.rowCount);

        // Verify what was saved
        const verifyResult = await sitePool.query(
          "SELECT data FROM controlpanel WHERE id = 'site'"
        );
        console.log(`Verify controlpanel data for ${siteId}:`, JSON.stringify(verifyResult.rows[0]?.data, null, 2));

        // Update the site's updatedAt timestamp in Firestore
        await sitesService.updateSite(site.id, {});

        return res.json({ success: true, message: 'Theme updated' });
      } finally {
        await sitePool.end();
      }
    } catch (error) {
      console.error('Update theme error:', error);
      return res.status(500).json({ error: 'Failed to update theme' });
    }
  }
);

export default router;
