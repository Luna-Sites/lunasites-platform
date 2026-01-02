/**
 * Master Database Service - Multi-tenant site routing
 *
 * Manages the master sites table in PostgreSQL for multi-tenant LunaCMS routing.
 * This is separate from Firestore which stores user-facing metadata.
 */

import pg from 'pg';
import crypto from 'crypto';
import { config } from '../config/index.js';

const { Pool } = pg;

// Master database pool
let masterPool: pg.Pool | null = null;

function getMasterPool(): pg.Pool {
  if (!masterPool) {
    masterPool = new Pool({
      connectionString: config.sharedDatabaseUrl,
      ssl: config.sharedDatabaseUrl.includes('render.com')
        ? { rejectUnauthorized: false }
        : false,
    });
  }
  return masterPool;
}

export interface MasterSiteRecord {
  id: string;
  site_id: string;
  domain: string;
  site_name: string;
  db_host: string;
  db_port: number;
  db_name: string;
  db_user: string;
  db_password: string;
  user_id: string;
  jwt_secret: string;
  active: boolean;
  bootstrapped: boolean;
  created_at: Date;
  updated_at: Date;
  // Custom domain fields
  custom_domain?: string;
  custom_domain_active: boolean;
  custom_domain_verified_at?: Date;
  custom_domain_activated_at?: Date;
}

/**
 * Initialize the master sites table
 */
export async function initMasterSitesTable(): Promise<void> {
  const pool = getMasterPool();

  await pool.query(`
    CREATE TABLE IF NOT EXISTS master_sites (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      site_id VARCHAR(100) UNIQUE NOT NULL,
      domain VARCHAR(255) UNIQUE NOT NULL,
      site_name VARCHAR(255) NOT NULL,
      db_host VARCHAR(255) NOT NULL,
      db_port INTEGER DEFAULT 5432,
      db_name VARCHAR(100) NOT NULL,
      db_user VARCHAR(100) NOT NULL,
      db_password VARCHAR(255) NOT NULL,
      user_id VARCHAR(100) NOT NULL,
      jwt_secret VARCHAR(255) NOT NULL,
      active BOOLEAN DEFAULT true,
      bootstrapped BOOLEAN DEFAULT false,
      created_at TIMESTAMP DEFAULT NOW(),
      updated_at TIMESTAMP DEFAULT NOW()
    );

    CREATE INDEX IF NOT EXISTS idx_master_sites_domain ON master_sites(domain);
    CREATE INDEX IF NOT EXISTS idx_master_sites_site_id ON master_sites(site_id);
    CREATE INDEX IF NOT EXISTS idx_master_sites_user_id ON master_sites(user_id);
  `);

  // Add custom domain columns if they don't exist
  await pool.query(`
    DO $$
    BEGIN
      IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='master_sites' AND column_name='custom_domain') THEN
        ALTER TABLE master_sites ADD COLUMN custom_domain VARCHAR(255);
      END IF;
      IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='master_sites' AND column_name='custom_domain_active') THEN
        ALTER TABLE master_sites ADD COLUMN custom_domain_active BOOLEAN DEFAULT false;
      END IF;
      IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='master_sites' AND column_name='custom_domain_verified_at') THEN
        ALTER TABLE master_sites ADD COLUMN custom_domain_verified_at TIMESTAMP;
      END IF;
      IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='master_sites' AND column_name='custom_domain_activated_at') THEN
        ALTER TABLE master_sites ADD COLUMN custom_domain_activated_at TIMESTAMP;
      END IF;
    END $$;

    CREATE UNIQUE INDEX IF NOT EXISTS idx_master_sites_custom_domain
      ON master_sites(custom_domain)
      WHERE custom_domain IS NOT NULL;
  `);

  console.log('[MasterDB] Sites table initialized');
}

/**
 * Register a new site in master database
 */
export async function registerMasterSite(params: {
  siteId: string;
  siteName: string;
  domain: string;
  userId: string;
  dbHost: string;
  dbPort?: number;
  dbName: string;
  dbUser: string;
  dbPassword: string;
}): Promise<{ jwtSecret: string }> {
  const pool = getMasterPool();
  const jwtSecret = crypto.randomUUID() + crypto.randomUUID();

  await pool.query(
    `INSERT INTO master_sites (site_id, domain, site_name, db_host, db_port, db_name, db_user, db_password, user_id, jwt_secret)
     VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
     ON CONFLICT (site_id) DO UPDATE SET
       domain = EXCLUDED.domain,
       site_name = EXCLUDED.site_name,
       db_host = EXCLUDED.db_host,
       db_port = EXCLUDED.db_port,
       db_name = EXCLUDED.db_name,
       db_user = EXCLUDED.db_user,
       db_password = EXCLUDED.db_password,
       updated_at = NOW()`,
    [
      params.siteId,
      params.domain,
      params.siteName,
      params.dbHost,
      params.dbPort || 5432,
      params.dbName,
      params.dbUser,
      params.dbPassword,
      params.userId,
      jwtSecret,
    ]
  );

  return { jwtSecret };
}

/**
 * Get site by domain (for routing)
 */
export async function getMasterSiteByDomain(domain: string): Promise<MasterSiteRecord | null> {
  const pool = getMasterPool();
  const result = await pool.query(
    'SELECT * FROM master_sites WHERE domain = $1 AND active = true',
    [domain]
  );
  return result.rows[0] || null;
}

/**
 * Get site by site_id
 */
export async function getMasterSiteBySiteId(siteId: string): Promise<MasterSiteRecord | null> {
  const pool = getMasterPool();
  const result = await pool.query(
    'SELECT * FROM master_sites WHERE site_id = $1',
    [siteId]
  );
  return result.rows[0] || null;
}

/**
 * Mark site as bootstrapped
 */
export async function markMasterSiteBootstrapped(siteId: string): Promise<void> {
  const pool = getMasterPool();
  await pool.query(
    'UPDATE master_sites SET bootstrapped = true, updated_at = NOW() WHERE site_id = $1',
    [siteId]
  );
}

/**
 * Deactivate a site
 */
export async function deactivateMasterSite(siteId: string): Promise<void> {
  const pool = getMasterPool();
  await pool.query(
    'UPDATE master_sites SET active = false, updated_at = NOW() WHERE site_id = $1',
    [siteId]
  );
}

/**
 * Reactivate a site
 */
export async function reactivateMasterSite(siteId: string): Promise<void> {
  const pool = getMasterPool();
  await pool.query(
    'UPDATE master_sites SET active = true, updated_at = NOW() WHERE site_id = $1',
    [siteId]
  );
}

/**
 * Delete site from master database
 */
export async function deleteMasterSite(siteId: string): Promise<void> {
  const pool = getMasterPool();
  await pool.query('DELETE FROM master_sites WHERE site_id = $1', [siteId]);
}

// ============================================
// CUSTOM DOMAIN MANAGEMENT (Multiple domains per site)
// ============================================

export interface SiteCustomDomain {
  id: string;
  site_id: string;
  domain: string;
  active: boolean;
  verified_at?: Date;
  activated_at?: Date;
  created_at: Date;
}

/**
 * Initialize the site_custom_domains table (call from initMasterSitesTable)
 */
export async function initCustomDomainsTable(): Promise<void> {
  const pool = getMasterPool();
  await pool.query(`
    CREATE TABLE IF NOT EXISTS site_custom_domains (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      site_id VARCHAR(100) NOT NULL REFERENCES master_sites(site_id) ON DELETE CASCADE,
      domain VARCHAR(255) UNIQUE NOT NULL,
      active BOOLEAN DEFAULT false,
      verified_at TIMESTAMP,
      activated_at TIMESTAMP,
      created_at TIMESTAMP DEFAULT NOW()
    );

    CREATE INDEX IF NOT EXISTS idx_site_custom_domains_site_id ON site_custom_domains(site_id);
    CREATE INDEX IF NOT EXISTS idx_site_custom_domains_domain ON site_custom_domains(domain);
    CREATE INDEX IF NOT EXISTS idx_site_custom_domains_active ON site_custom_domains(active);
  `);
  console.log('[MasterDB] Custom domains table initialized');
}

/**
 * Add a custom domain for a site
 */
export async function addMasterSiteCustomDomain(
  siteId: string,
  domain: string
): Promise<void> {
  const pool = getMasterPool();
  await pool.query(
    `INSERT INTO site_custom_domains (site_id, domain, active)
     VALUES ($1, $2, false)
     ON CONFLICT (domain) DO UPDATE SET site_id = $1, active = false, verified = false`,
    [siteId, domain]
  );
}

/**
 * Set custom domain for a site (legacy - adds domain)
 */
export async function setMasterSiteCustomDomain(
  siteId: string,
  customDomain: string
): Promise<void> {
  return addMasterSiteCustomDomain(siteId, customDomain);
}

/**
 * Get all custom domains for a site
 */
export async function getMasterSiteCustomDomains(siteId: string): Promise<SiteCustomDomain[]> {
  const pool = getMasterPool();
  const result = await pool.query(
    'SELECT * FROM site_custom_domains WHERE site_id = $1 ORDER BY created_at',
    [siteId]
  );
  return result.rows;
}

/**
 * Mark custom domain as verified (specific domain)
 */
export async function markCustomDomainVerified(siteId: string, domain?: string): Promise<void> {
  const pool = getMasterPool();
  if (domain) {
    await pool.query(
      `UPDATE site_custom_domains SET verified_at = NOW() WHERE site_id = $1 AND domain = $2`,
      [siteId, domain]
    );
  } else {
    // Legacy: mark all domains for site as verified
    await pool.query(
      `UPDATE site_custom_domains SET verified_at = NOW() WHERE site_id = $1`,
      [siteId]
    );
  }
}

/**
 * Activate custom domain for routing (specific domain)
 */
export async function activateMasterSiteCustomDomain(siteId: string, domain?: string): Promise<void> {
  const pool = getMasterPool();
  if (domain) {
    await pool.query(
      `UPDATE site_custom_domains SET active = true, activated_at = NOW() WHERE site_id = $1 AND domain = $2`,
      [siteId, domain]
    );
  } else {
    // Legacy: activate all domains for site
    await pool.query(
      `UPDATE site_custom_domains SET active = true, activated_at = NOW() WHERE site_id = $1`,
      [siteId]
    );
  }
}

/**
 * Remove a specific custom domain from a site
 */
export async function removeMasterSiteCustomDomain(siteId: string, domain?: string): Promise<void> {
  const pool = getMasterPool();
  if (domain) {
    await pool.query(
      'DELETE FROM site_custom_domains WHERE site_id = $1 AND domain = $2',
      [siteId, domain]
    );
  } else {
    // Legacy: remove all domains for site
    await pool.query(
      'DELETE FROM site_custom_domains WHERE site_id = $1',
      [siteId]
    );
  }
}

/**
 * Get site by custom domain (for routing) - checks new table first, then legacy
 */
export async function getMasterSiteByCustomDomain(customDomain: string): Promise<MasterSiteRecord | null> {
  const pool = getMasterPool();

  // First check new table
  const newResult = await pool.query(
    `SELECT ms.* FROM master_sites ms
     JOIN site_custom_domains scd ON ms.site_id = scd.site_id
     WHERE scd.domain = $1 AND scd.active = true AND ms.active = true`,
    [customDomain]
  );
  if (newResult.rows.length > 0) {
    return newResult.rows[0];
  }

  // Fallback to legacy column
  const legacyResult = await pool.query(
    'SELECT * FROM master_sites WHERE custom_domain = $1 AND custom_domain_active = true AND active = true',
    [customDomain]
  );
  return legacyResult.rows[0] || null;
}

/**
 * Check if a custom domain is already in use
 */
export async function isCustomDomainTaken(customDomain: string, excludeSiteId?: string): Promise<boolean> {
  const pool = getMasterPool();

  // Check new table
  let query = 'SELECT 1 FROM site_custom_domains WHERE domain = $1';
  const params: string[] = [customDomain];
  if (excludeSiteId) {
    query += ' AND site_id != $2';
    params.push(excludeSiteId);
  }
  const newResult = await pool.query(query, params);
  if (newResult.rows.length > 0) return true;

  // Check legacy column
  let legacyQuery = 'SELECT 1 FROM master_sites WHERE custom_domain = $1';
  const legacyParams: string[] = [customDomain];
  if (excludeSiteId) {
    legacyQuery += ' AND site_id != $2';
    legacyParams.push(excludeSiteId);
  }
  const legacyResult = await pool.query(legacyQuery, legacyParams);
  return legacyResult.rows.length > 0;
}

/**
 * Get database connection info for running migrations/bootstrap
 */
export async function getMasterSiteDbConnection(siteId: string): Promise<{
  host: string;
  port: number;
  database: string;
  user: string;
  password: string;
  connectionString: string;
} | null> {
  const pool = getMasterPool();
  const result = await pool.query(
    'SELECT db_host, db_port, db_name, db_user, db_password FROM master_sites WHERE site_id = $1',
    [siteId]
  );

  if (result.rows.length === 0) return null;

  const row = result.rows[0];
  return {
    host: row.db_host,
    port: row.db_port,
    database: row.db_name,
    user: row.db_user,
    password: row.db_password,
    connectionString: `postgresql://${row.db_user}:${row.db_password}@${row.db_host}:${row.db_port}/${row.db_name}`,
  };
}

// ============================================
// TEMPLATES
// ============================================

export interface TemplateRecord {
  id: string;
  name: string;
  description: string;
  thumbnail_url: string | null;
  source_site_id: string;
  user_id: string;
  is_public: boolean;
  documents: object; // JSON blob with all documents
  created_at: Date;
  updated_at: Date;
}

/**
 * Initialize the templates table
 */
export async function initTemplatesTable(): Promise<void> {
  const pool = getMasterPool();

  await pool.query(`
    CREATE TABLE IF NOT EXISTS templates (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      name VARCHAR(255) NOT NULL,
      description TEXT,
      thumbnail_url TEXT,
      source_site_id VARCHAR(100),
      user_id VARCHAR(100) NOT NULL,
      is_public BOOLEAN DEFAULT false,
      documents JSONB NOT NULL,
      created_at TIMESTAMP DEFAULT NOW(),
      updated_at TIMESTAMP DEFAULT NOW()
    );

    CREATE INDEX IF NOT EXISTS idx_templates_user_id ON templates(user_id);
    CREATE INDEX IF NOT EXISTS idx_templates_is_public ON templates(is_public);
  `);

  console.log('[MasterDB] Templates table initialized');
}

/**
 * Create a template from site content
 * Templates now just store reference to source site - database is cloned on site creation
 */
export async function createTemplate(params: {
  name: string;
  description?: string;
  thumbnailUrl?: string;
  sourceSiteId: string;
  userId: string;
  isPublic?: boolean;
}): Promise<TemplateRecord> {
  const pool = getMasterPool();

  const result = await pool.query(
    `INSERT INTO templates (name, description, thumbnail_url, source_site_id, user_id, is_public, documents)
     VALUES ($1, $2, $3, $4, $5, $6, $7)
     RETURNING *`,
    [
      params.name,
      params.description || '',
      params.thumbnailUrl || null,
      params.sourceSiteId,
      params.userId,
      params.isPublic || false,
      JSON.stringify({}), // No longer storing documents - we clone the database directly
    ]
  );

  return result.rows[0];
}

/**
 * Get all public templates (no auth required)
 */
export async function getPublicTemplates(): Promise<TemplateRecord[]> {
  const pool = getMasterPool();

  const result = await pool.query(
    `SELECT id, name, description, thumbnail_url, source_site_id, user_id, is_public, created_at, updated_at
     FROM templates
     WHERE is_public = true
     ORDER BY created_at DESC`
  );

  return result.rows;
}

/**
 * Get all public templates + user's own templates
 */
export async function getTemplates(userId: string): Promise<TemplateRecord[]> {
  const pool = getMasterPool();

  const result = await pool.query(
    `SELECT id, name, description, thumbnail_url, source_site_id, user_id, is_public, created_at, updated_at
     FROM templates
     WHERE is_public = true OR user_id = $1
     ORDER BY created_at DESC`,
    [userId]
  );

  return result.rows;
}

/**
 * Get template by ID (with documents for cloning)
 */
export async function getTemplateById(templateId: string): Promise<TemplateRecord | null> {
  const pool = getMasterPool();

  const result = await pool.query(
    'SELECT * FROM templates WHERE id = $1',
    [templateId]
  );

  return result.rows[0] || null;
}

/**
 * Update template
 */
export async function updateTemplate(
  templateId: string,
  userId: string,
  params: { name?: string; description?: string; thumbnailUrl?: string; isPublic?: boolean }
): Promise<void> {
  const pool = getMasterPool();

  const updates: string[] = [];
  const values: any[] = [];
  let paramIndex = 1;

  if (params.name !== undefined) {
    updates.push(`name = $${paramIndex++}`);
    values.push(params.name);
  }
  if (params.description !== undefined) {
    updates.push(`description = $${paramIndex++}`);
    values.push(params.description);
  }
  if (params.thumbnailUrl !== undefined) {
    updates.push(`thumbnail_url = $${paramIndex++}`);
    values.push(params.thumbnailUrl);
  }
  if (params.isPublic !== undefined) {
    updates.push(`is_public = $${paramIndex++}`);
    values.push(params.isPublic);
  }

  if (updates.length === 0) return;

  updates.push('updated_at = NOW()');
  values.push(templateId, userId);

  await pool.query(
    `UPDATE templates SET ${updates.join(', ')} WHERE id = $${paramIndex++} AND user_id = $${paramIndex}`,
    values
  );
}

/**
 * Delete template (only owner can delete)
 */
export async function deleteTemplate(templateId: string, userId: string): Promise<boolean> {
  const pool = getMasterPool();

  const result = await pool.query(
    'DELETE FROM templates WHERE id = $1 AND user_id = $2',
    [templateId, userId]
  );

  return (result.rowCount ?? 0) > 0;
}
