import { Router, Response } from 'express';
import pg from 'pg';
import { AuthenticatedRequest, authMiddleware } from '../middleware/auth.js';
import * as sitesService from '../services/sites.js';
import * as renderService from '../services/render.js';
import * as cloudflareService from '../services/cloudflare.js';
import * as databaseService from '../services/database.js';
import * as masterDbService from '../services/masterDb.js';
import * as siteBootstrap from '../services/siteBootstrap.js';
import { config } from '../config/index.js';

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
      const transformed = sites.map((site) => ({
        id: site.id,
        siteId: site.siteId,
        userId: site.userId,
        name: site.name,
        domain: site.domain,
        status: site.status,
        renderUrl: site.renderUrl,
        createdAt: site.createdAt.toDate().toISOString(),
        updatedAt: site.updatedAt.toDate().toISOString(),
      }));

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
      const { domain } = req.body;
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

      // Check if site already has a custom domain
      if (site.customDomain) {
        return res.status(400).json({ error: 'Site already has a custom domain. Remove it first.' });
      }

      // Check if domain is already taken by another site
      const domainTaken = await masterDbService.isCustomDomainTaken(domain, siteId);
      if (domainTaken) {
        return res.status(409).json({ error: 'Domain is already in use by another site' });
      }

      // Check if Cloudflare is configured
      if (!cloudflareService.isConfigured()) {
        return res.status(500).json({
          error: 'Cloudflare not configured. Please set CLOUDFLARE_API_TOKEN, CLOUDFLARE_ZONE_ID, and CLOUDFLARE_ORIGIN_SERVER.'
        });
      }

      // Add domain to Cloudflare (Custom Hostname)
      console.log(`[CustomDomain] Adding ${domain} to Cloudflare`);
      let cloudflareHostname;
      let cloudflareHostnameId: string | undefined;

      try {
        cloudflareHostname = await cloudflareService.addCustomHostname(domain);
        cloudflareHostnameId = cloudflareHostname.id;
        console.log(`[CustomDomain] Successfully added ${domain} to Cloudflare, ID: ${cloudflareHostname.id}`);

        // If it's an apex domain, also add the www subdomain
        if (!domain.startsWith('www.')) {
          const wwwDomain = `www.${domain}`;
          console.log(`[CustomDomain] Also adding www subdomain: ${wwwDomain}`);
          try {
            await cloudflareService.addCustomHostname(wwwDomain);
            console.log(`[CustomDomain] Successfully added ${wwwDomain} to Cloudflare`);
          } catch (wwwError) {
            // It's okay if www fails (might already exist or other reason)
            console.log(`[CustomDomain] Note: Failed to add ${wwwDomain} (may already exist):`, wwwError);
          }
        }
      } catch (cloudflareError) {
        console.error(`[CustomDomain] Failed to add domain to Cloudflare:`, cloudflareError);
        return res.status(500).json({
          error: 'Failed to add domain to Cloudflare',
          details: cloudflareError instanceof Error ? cloudflareError.message : 'Unknown error'
        });
      }

      // Save to Firestore (with Cloudflare hostname ID)
      await sitesService.setCustomDomain(site.id, domain, cloudflareHostnameId);

      // Save to master_sites (but not activated yet)
      await masterDbService.setMasterSiteCustomDomain(siteId, domain);

      // Get CNAME target for DNS instructions
      const cnameTarget = cloudflareService.getCnameTarget();

      return res.json({
        success: true,
        domain,
        status: 'pending',
        cloudflareStatus: cloudflareHostname.status,
        sslStatus: cloudflareHostname.ssl.status,
        dnsInstructions: {
          type: 'CNAME',
          host: domain.startsWith('www.') ? 'www' : '@',
          value: cnameTarget,
          note: 'Adaugă un CNAME record care pointează către ' + cnameTarget + '. Propagarea DNS poate dura până la 48 ore.',
        },
      });
    } catch (error) {
      console.error('Add custom domain error:', error);
      return res.status(500).json({ error: 'Failed to add custom domain' });
    }
  }
);

// Get custom domain status
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

      if (!site.customDomain) {
        return res.json({ customDomain: null });
      }

      // Get CNAME target from Cloudflare config
      const cnameTarget = cloudflareService.getCnameTarget();

      // Get status from Cloudflare
      let cloudflareStatus: 'pending' | 'active' | 'moved' | 'deleted' = 'pending';
      let sslStatus: string = 'pending';

      if (site.customDomain.cloudflareHostnameId) {
        try {
          const cfHostname = await cloudflareService.getCustomHostname(site.customDomain.cloudflareHostnameId);
          if (cfHostname) {
            cloudflareStatus = cfHostname.status;
            sslStatus = cfHostname.ssl.status;
          }
        } catch (err) {
          console.error('Error fetching Cloudflare domain status:', err);
        }
      }

      // Map Cloudflare status to our verification status
      const verificationStatus = cloudflareStatus === 'active' ? 'verified' : 'unverified';
      const certificateStatus = sslStatus === 'active' ? 'issued' : 'pending';

      return res.json({
        customDomain: {
          domain: site.customDomain.domain,
          status: site.customDomain.status,
          verificationStatus,
          certificateStatus,
          cloudflareStatus,
          sslStatus,
          addedAt: site.customDomain.addedAt.toDate().toISOString(),
          verifiedAt: site.customDomain.verifiedAt?.toDate().toISOString(),
          activatedAt: site.customDomain.activatedAt?.toDate().toISOString(),
          errorMessage: site.customDomain.errorMessage,
        },
        dnsInstructions: {
          type: 'CNAME',
          host: site.customDomain.domain.startsWith('www.') ? 'www' : '@',
          value: cnameTarget,
        },
      });
    } catch (error) {
      console.error('Get custom domain error:', error);
      return res.status(500).json({ error: 'Failed to get custom domain status' });
    }
  }
);

// Verify/refresh custom domain status from Cloudflare
router.post(
  '/:siteId/domains/verify',
  authMiddleware,
  async (req: AuthenticatedRequest, res: Response) => {
    console.log('=== VERIFY DOMAIN ENDPOINT CALLED ===');
    try {
      const { siteId } = req.params;
      const userId = req.user!.uid;
      console.log(`Verifying domain for site: ${siteId}, user: ${userId}`);

      // Verify site ownership
      const site = await sitesService.getSiteBySiteId(siteId);
      if (!site) {
        return res.status(404).json({ error: 'Site not found' });
      }
      if (site.userId !== userId) {
        return res.status(403).json({ error: 'Access denied' });
      }

      if (!site.customDomain) {
        return res.status(400).json({ error: 'No custom domain configured' });
      }

      const domainToVerify = site.customDomain.domain;

      // ============================================
      // STEP 1: Check if domain is assigned in master_sites
      // ============================================
      const masterSite = await masterDbService.getMasterSiteBySiteId(siteId);
      const step1Passed = masterSite?.custom_domain === domainToVerify;

      console.log(`Step 1 - Domain assigned in master_sites: ${step1Passed}`);
      console.log(`  Expected: ${domainToVerify}, Found: ${masterSite?.custom_domain}`);

      if (!step1Passed) {
        return res.json({
          verified: false,
          steps: {
            domainAssigned: false,
            dnsConfigured: false,
          },
          message: 'Domain is not properly assigned to your site. Please try removing and re-adding the domain.',
        });
      }

      // ============================================
      // STEP 2: Check Cloudflare status
      // ============================================
      let step2Passed = false;
      let cloudflareStatus = 'pending';
      let sslStatus = 'pending';

      if (!site.customDomain.cloudflareHostnameId) {
        console.log('No Cloudflare hostname ID found, domain may not have been added to Cloudflare');
        return res.json({
          verified: false,
          steps: {
            domainAssigned: step1Passed,
            dnsConfigured: false,
          },
          message: 'Domain not found in Cloudflare. Please remove and re-add the domain.',
        });
      }

      try {
        const cfHostname = await cloudflareService.getCustomHostname(site.customDomain.cloudflareHostnameId);
        if (cfHostname) {
          cloudflareStatus = cfHostname.status;
          sslStatus = cfHostname.ssl.status;
          console.log(`Cloudflare status: ${cloudflareStatus}, SSL status: ${sslStatus}`);

          // Domain is verified if Cloudflare status is 'active'
          step2Passed = cloudflareStatus === 'active';
        }
      } catch (err) {
        console.error('Error checking Cloudflare status:', err);
      }

      // If both steps pass, update status
      if (step1Passed && step2Passed) {
        console.log('Both steps passed! Updating status to verified...');
        await sitesService.updateCustomDomainStatus(site.id, 'verified');
        await masterDbService.markCustomDomainVerified(siteId);
      }

      return res.json({
        verified: step1Passed && step2Passed,
        steps: {
          domainAssigned: step1Passed,
          dnsConfigured: step2Passed,
        },
        cloudflareStatus,
        sslStatus,
        message: step2Passed
          ? 'Domain verified successfully. SSL certificate is active.'
          : 'DNS not yet configured. Please add the CNAME record at your domain registrar.',
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
      const userId = req.user!.uid;

      // Verify site ownership
      const site = await sitesService.getSiteBySiteId(siteId);
      if (!site) {
        return res.status(404).json({ error: 'Site not found' });
      }
      if (site.userId !== userId) {
        return res.status(403).json({ error: 'Access denied' });
      }

      if (!site.customDomain) {
        return res.status(400).json({ error: 'No custom domain configured' });
      }

      // Check Cloudflare status before activating
      if (site.customDomain.cloudflareHostnameId) {
        try {
          const cfHostname = await cloudflareService.getCustomHostname(site.customDomain.cloudflareHostnameId);

          if (!cfHostname || cfHostname.status !== 'active') {
            return res.status(400).json({
              error: 'Domain not active in Cloudflare',
              message: 'Please wait for DNS verification to complete.',
              cloudflareStatus: cfHostname?.status || 'unknown',
            });
          }

          if (cfHostname.ssl.status !== 'active') {
            return res.status(400).json({
              error: 'SSL certificate not ready',
              message: 'SSL certificate is still being issued. Please wait.',
              sslStatus: cfHostname.ssl.status,
            });
          }
        } catch (err) {
          console.error('Error checking Cloudflare status:', err);
          return res.status(500).json({ error: 'Failed to check domain status' });
        }
      }

      // Activate in master_sites for routing
      await masterDbService.activateMasterSiteCustomDomain(siteId);

      // Update Firestore status
      await sitesService.updateCustomDomainStatus(site.id, 'active');

      return res.json({
        success: true,
        message: 'Custom domain activated successfully',
        domain: site.customDomain.domain,
      });
    } catch (error) {
      console.error('Activate custom domain error:', error);
      return res.status(500).json({ error: 'Failed to activate custom domain' });
    }
  }
);

// Remove custom domain
router.delete(
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

      if (!site.customDomain) {
        return res.status(400).json({ error: 'No custom domain configured' });
      }

      const domainToRemove = site.customDomain.domain;

      // Remove from Cloudflare
      if (site.customDomain.cloudflareHostnameId) {
        try {
          await cloudflareService.deleteCustomHostname(site.customDomain.cloudflareHostnameId);
          console.log(`[CustomDomain] Deleted ${domainToRemove} from Cloudflare`);

          // Also try to delete www subdomain if it exists
          if (!domainToRemove.startsWith('www.')) {
            const wwwDomain = `www.${domainToRemove}`;
            const wwwHostname = await cloudflareService.getCustomHostnameByName(wwwDomain);
            if (wwwHostname) {
              await cloudflareService.deleteCustomHostname(wwwHostname.id);
              console.log(`[CustomDomain] Deleted ${wwwDomain} from Cloudflare`);
            }
          }
        } catch (err) {
          console.error('Error deleting from Cloudflare:', err);
          // Continue with removal even if Cloudflare fails
        }
      }

      // Remove from master_sites
      await masterDbService.removeMasterSiteCustomDomain(siteId);

      // Remove from Firestore
      await sitesService.removeCustomDomain(site.id);

      return res.json({
        success: true,
        message: 'Custom domain removed',
      });
    } catch (error) {
      console.error('Remove custom domain error:', error);
      return res.status(500).json({ error: 'Failed to remove custom domain' });
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
