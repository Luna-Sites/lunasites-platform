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

// Update site theme
router.patch(
  '/:siteId/theme',
  authMiddleware,
  async (req: AuthenticatedRequest, res: Response) => {
    try {
      const { siteId } = req.params;
      const userId = req.user!.uid;
      const { presetId, overrides, darkMode } = req.body;

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

        // Update theme in data
        const updatedData = {
          ...currentData,
          theme: {
            presetId: presetId || 'default',
            overrides: overrides || {},
            darkMode: darkMode || false,
          },
        };

        // Update the controlpanel record
        await sitePool.query(
          "UPDATE controlpanel SET data = $1 WHERE id = 'site'",
          [JSON.stringify(updatedData)]
        );

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
