/**
 * Templates API Routes
 * Only admins can create/manage templates. All users can view public templates.
 */

import { Router, Response } from 'express';
import { AuthenticatedRequest, authMiddleware, adminMiddleware } from '../middleware/auth.js';
import * as masterDbService from '../services/masterDb.js';
import * as sitesService from '../services/sites.js';
import knex from 'knex';

const router = Router();

/**
 * Get all available templates (public + user's own)
 */
router.get(
  '/',
  authMiddleware,
  async (req: AuthenticatedRequest, res: Response) => {
    try {
      const userId = req.user!.uid;
      const templates = await masterDbService.getTemplates(userId);

      return res.json(
        templates.map((t) => ({
          id: t.id,
          name: t.name,
          description: t.description,
          thumbnailUrl: t.thumbnail_url,
          sourceSiteId: t.source_site_id,
          userId: t.user_id,
          isPublic: t.is_public,
          isOwner: t.user_id === userId,
          createdAt: t.created_at,
          updatedAt: t.updated_at,
        }))
      );
    } catch (error) {
      console.error('Get templates error:', error);
      return res.status(500).json({ error: 'Failed to get templates' });
    }
  }
);

/**
 * Get single template
 */
router.get(
  '/:templateId',
  authMiddleware,
  async (req: AuthenticatedRequest, res: Response) => {
    try {
      const { templateId } = req.params;
      const userId = req.user!.uid;

      const template = await masterDbService.getTemplateById(templateId);

      if (!template) {
        return res.status(404).json({ error: 'Template not found' });
      }

      // Check access: must be public or owned by user
      if (!template.is_public && template.user_id !== userId) {
        return res.status(403).json({ error: 'Access denied' });
      }

      return res.json({
        id: template.id,
        name: template.name,
        description: template.description,
        thumbnailUrl: template.thumbnail_url,
        sourceSiteId: template.source_site_id,
        userId: template.user_id,
        isPublic: template.is_public,
        isOwner: template.user_id === userId,
        createdAt: template.created_at,
        updatedAt: template.updated_at,
      });
    } catch (error) {
      console.error('Get template error:', error);
      return res.status(500).json({ error: 'Failed to get template' });
    }
  }
);

/**
 * Create template from existing site (ADMIN ONLY)
 */
router.post(
  '/',
  authMiddleware,
  adminMiddleware,
  async (req: AuthenticatedRequest, res: Response) => {
    try {
      const userId = req.user!.uid;
      const { siteId, name, description, isPublic } = req.body;

      if (!siteId || !name) {
        return res.status(400).json({ error: 'siteId and name are required' });
      }

      // Get site database connection
      const dbConfig = await masterDbService.getMasterSiteDbConnection(siteId);
      if (!dbConfig) {
        return res.status(404).json({ error: 'Site database not found' });
      }

      // Export documents from site
      const documents = await exportSiteDocuments(dbConfig);

      // Create template
      const template = await masterDbService.createTemplate({
        name,
        description,
        sourceSiteId: siteId,
        userId,
        isPublic: isPublic || false,
        documents,
      });

      return res.status(201).json({
        success: true,
        message: 'Template created successfully',
        template: {
          id: template.id,
          name: template.name,
          description: template.description,
          sourceSiteId: template.source_site_id,
          isPublic: template.is_public,
          createdAt: template.created_at,
        },
      });
    } catch (error) {
      console.error('Create template error:', error);
      return res.status(500).json({ error: 'Failed to create template' });
    }
  }
);

/**
 * Update template (ADMIN ONLY)
 */
router.patch(
  '/:templateId',
  authMiddleware,
  adminMiddleware,
  async (req: AuthenticatedRequest, res: Response) => {
    try {
      const { templateId } = req.params;
      const userId = req.user!.uid;
      const { name, description, isPublic } = req.body;

      await masterDbService.updateTemplate(templateId, userId, {
        name,
        description,
        isPublic,
      });

      return res.json({ success: true, message: 'Template updated' });
    } catch (error) {
      console.error('Update template error:', error);
      return res.status(500).json({ error: 'Failed to update template' });
    }
  }
);

/**
 * Delete template (ADMIN ONLY)
 */
router.delete(
  '/:templateId',
  authMiddleware,
  adminMiddleware,
  async (req: AuthenticatedRequest, res: Response) => {
    try {
      const { templateId } = req.params;
      const userId = req.user!.uid;

      const deleted = await masterDbService.deleteTemplate(templateId, userId);

      if (!deleted) {
        return res.status(404).json({ error: 'Template not found or access denied' });
      }

      return res.json({ success: true, message: 'Template deleted' });
    } catch (error) {
      console.error('Delete template error:', error);
      return res.status(500).json({ error: 'Failed to delete template' });
    }
  }
);

/**
 * Export all documents from a site's database
 */
async function exportSiteDocuments(dbConfig: {
  host: string;
  port: number;
  database: string;
  user: string;
  password: string;
}): Promise<object[]> {
  const db = knex({
    client: 'pg',
    connection: {
      host: dbConfig.host,
      port: dbConfig.port,
      database: dbConfig.database,
      user: dbConfig.user,
      password: dbConfig.password,
      ssl: dbConfig.host.includes('render.com') ? { rejectUnauthorized: false } : false,
    },
  });

  try {
    const documents = await db('document')
      .select('*')
      .orderBy('path', 'asc');

    return documents.map((doc: any) => ({
      uuid: doc.uuid,
      parent: doc.parent,
      id: doc.id,
      path: doc.path,
      type: doc.type,
      position_in_parent: doc.position_in_parent,
      version: doc.version,
      json: doc.json,
      language: doc.language,
      workflow_state: doc.workflow_state,
      owner: null,
      created: null,
      modified: null,
    }));
  } finally {
    await db.destroy();
  }
}

/**
 * Import documents from template to a site's database
 */
export async function importTemplateDocuments(
  dbConfig: {
    host: string;
    port: number;
    database: string;
    user: string;
    password: string;
  },
  documents: any[],
  ownerId: string
): Promise<void> {
  const db = knex({
    client: 'pg',
    connection: {
      host: dbConfig.host,
      port: dbConfig.port,
      database: dbConfig.database,
      user: dbConfig.user,
      password: dbConfig.password,
      ssl: dbConfig.host.includes('render.com') ? { rejectUnauthorized: false } : false,
    },
  });

  try {
    const uuidMap = new Map<string, string>();
    const crypto = await import('crypto');

    for (const doc of documents) {
      const newUuid = crypto.randomUUID();
      uuidMap.set(doc.uuid, newUuid);
    }

    const now = new Date().toISOString();

    for (const doc of documents) {
      const newUuid = uuidMap.get(doc.uuid)!;
      const newParent = doc.parent ? uuidMap.get(doc.parent) : null;

      await db('document').insert({
        uuid: newUuid,
        parent: newParent,
        id: doc.id,
        path: doc.path,
        type: doc.type,
        position_in_parent: doc.position_in_parent,
        version: doc.version || 0,
        json: typeof doc.json === 'string' ? doc.json : JSON.stringify(doc.json || {}),
        owner: ownerId,
        created: now,
        modified: now,
        language: doc.language || 'en',
        workflow_state: doc.workflow_state || 'published',
        workflow_history: JSON.stringify([]),
        lock: JSON.stringify({ locked: false, stealable: true }),
        translation_group: newUuid,
      }).onConflict('path').merge();
    }

    console.log(`[Templates] Imported ${documents.length} documents`);
  } finally {
    await db.destroy();
  }
}

export default router;
