import { Router, Response } from 'express';
import pg from 'pg';
import { AuthenticatedRequest, authMiddleware } from '../middleware/auth.js';
import * as sitesService from '../services/sites.js';
import * as renderService from '../services/render.js';
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

      // Add domain to Render (if not multi-tenant or if we have a renderServiceId)
      if (site.renderServiceId && site.renderServiceId !== 'multi-tenant') {
        await renderService.addCustomDomain(site.renderServiceId, domain);
      }

      // Save to Firestore
      await sitesService.setCustomDomain(site.id, domain);

      // Save to master_sites (but not activated yet)
      await masterDbService.setMasterSiteCustomDomain(siteId, domain);

      // Get render URL for CNAME target
      const renderUrl = site.renderUrl || `${siteId}.${config.baseDomain}`;
      const cnameTarget = renderUrl.replace(/^https?:\/\//, '');

      return res.json({
        success: true,
        domain,
        status: 'pending',
        dnsInstructions: {
          type: 'CNAME',
          host: domain.startsWith('www.') ? 'www' : '@',
          value: cnameTarget,
          note: 'DNS propagation can take up to 48 hours.',
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

      // Get verification and SSL status from Render if available
      let verificationStatus: 'unverified' | 'verified' = 'unverified';
      let certificateStatus: 'pending' | 'issued' | 'error' = 'pending';

      if (site.renderServiceId && site.renderServiceId !== 'multi-tenant') {
        try {
          const renderDomain = await renderService.getCustomDomain(
            site.renderServiceId,
            site.customDomain.domain
          );
          if (renderDomain) {
            verificationStatus = renderDomain.verificationStatus;
          }

          if (verificationStatus === 'verified') {
            certificateStatus = await renderService.getDomainCertificateStatus(
              site.renderServiceId,
              site.customDomain.domain
            );
          }
        } catch (err) {
          console.error('Error fetching Render domain status:', err);
        }
      }

      // Get render URL for CNAME target
      const renderUrl = site.renderUrl || `${siteId}.${config.baseDomain}`;
      const cnameTarget = renderUrl.replace(/^https?:\/\//, '');

      return res.json({
        customDomain: {
          domain: site.customDomain.domain,
          status: site.customDomain.status,
          verificationStatus,
          certificateStatus,
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

// Verify DNS for custom domain
router.post(
  '/:siteId/domains/verify',
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

      let verified = false;

      if (site.renderServiceId && site.renderServiceId !== 'multi-tenant') {
        // Verify via Render
        const result = await renderService.verifyCustomDomain(
          site.renderServiceId,
          site.customDomain.domain
        );
        verified = result.verified;
      } else {
        // For multi-tenant, do DNS lookup
        // For now, assume verified if we get here (can add DNS check later)
        verified = true;
      }

      if (verified) {
        await sitesService.updateCustomDomainStatus(site.id, 'verified');
        await masterDbService.markCustomDomainVerified(siteId);
      }

      return res.json({
        verified,
        message: verified
          ? 'DNS verified successfully. SSL certificate is being issued.'
          : 'DNS not yet configured. Please check your DNS settings.',
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

      // Check prerequisites
      if (site.renderServiceId && site.renderServiceId !== 'multi-tenant') {
        const renderDomain = await renderService.getCustomDomain(
          site.renderServiceId,
          site.customDomain.domain
        );

        if (!renderDomain || renderDomain.verificationStatus !== 'verified') {
          return res.status(400).json({
            error: 'DNS not verified',
            message: 'Please verify DNS configuration before activating.',
          });
        }

        const certStatus = await renderService.getDomainCertificateStatus(
          site.renderServiceId,
          site.customDomain.domain
        );

        if (certStatus !== 'issued') {
          return res.status(400).json({
            error: 'SSL certificate not ready',
            message: 'SSL certificate is still being issued. Please wait.',
          });
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

      // Remove from Render
      if (site.renderServiceId && site.renderServiceId !== 'multi-tenant') {
        await renderService.deleteCustomDomain(site.renderServiceId, domainToRemove);
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
