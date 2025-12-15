import { Router, Response } from 'express';
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
      const { site_id, name } = req.body;

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

      // Deploy site (async)
      deploySite(site.id, site_id, name, userId).catch((error: Error) => {
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
  userId: string
) {
  console.log(`Starting deployment for site: ${siteId} (multi-tenant: ${MULTI_TENANT})`);

  // Create database for this site
  console.log(`Creating database for site: ${siteId}`);
  const databaseUrl = await databaseService.createDatabase(siteId);
  const dbInfo = databaseService.parseDatabaseUrl(databaseUrl);
  console.log(`Database created for site: ${siteId}`);

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

    // Run migrations and seed for the site's database
    console.log(`Running bootstrap for site: ${siteId}`);
    await siteBootstrap.bootstrapSite(
      {
        host: dbInfo.host,
        port: parseInt(dbInfo.port),
        database: dbInfo.database,
        user: dbInfo.user,
        password: dbInfo.password,
      },
      { siteId }
    );
    console.log(`Bootstrap completed for site: ${siteId}`);

    // Custom domain registration disabled - using wildcard domain on Render
    // const workerServiceId = process.env.RENDER_WORKER_SERVICE_ID;
    // if (workerServiceId) {
    //   try {
    //     await renderService.addCustomDomain(workerServiceId, domain);
    //     console.log(`Custom domain ${domain} added to Render`);
    //   } catch (error) {
    //     console.error(`Failed to add custom domain: ${error}`);
    //   }
    // }

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

export default router;
