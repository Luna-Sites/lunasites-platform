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
