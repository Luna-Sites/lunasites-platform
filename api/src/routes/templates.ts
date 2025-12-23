/**
 * Templates API Routes
 * Only admins can create/manage templates. All users can view public templates.
 */

import { Router, Response } from 'express';
import { AuthenticatedRequest, authMiddleware, adminMiddleware } from '../middleware/auth.js';
import * as masterDbService from '../services/masterDb.js';
import { generateScreenshotUrl } from '../utils/screenshot.js';

const router = Router();

/**
 * Get all public templates (no auth required - for builder)
 */
router.get(
  '/public',
  async (req, res: Response) => {
    try {
      const templates = await masterDbService.getPublicTemplates();

      return res.json(
        templates.map((t) => ({
          id: t.id,
          name: t.name,
          description: t.description,
          thumbnailUrl: t.thumbnail_url,
          sourceSiteId: t.source_site_id,
          isPublic: true,
          createdAt: t.created_at,
        }))
      );
    } catch (error) {
      console.error('Get public templates error:', error);
      return res.status(500).json({ error: 'Failed to get templates' });
    }
  }
);

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
 * Templates now just store reference to source site - database is cloned on site creation
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

      // Verify site exists
      const dbConfig = await masterDbService.getMasterSiteDbConnection(siteId);
      if (!dbConfig) {
        return res.status(404).json({ error: 'Site not found' });
      }

      // Generate screenshot URL (ScreenshotOne handles caching)
      let thumbnailUrl: string | undefined;
      try {
        thumbnailUrl = generateScreenshotUrl(siteId);
      } catch (error) {
        console.error('Failed to generate screenshot URL:', error);
        // Continue without screenshot if it fails
      }

      // Create template (just stores reference to source site)
      const template = await masterDbService.createTemplate({
        name,
        description,
        thumbnailUrl,
        sourceSiteId: siteId,
        userId,
        isPublic: isPublic || false,
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

export default router;
