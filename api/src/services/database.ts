import pg from 'pg';
import { config } from '../config/index.js';

const { Client } = pg;

interface DatabaseConnectionInfo {
  host: string;
  port: number;
  user: string;
  password: string;
  database: string;
}

function parseConnectionString(url: string): DatabaseConnectionInfo {
  const regex = /^postgresql:\/\/([^:]+):([^@]+)@([^:\/]+)(?::(\d+))?\/(.+)$/;
  const match = url.match(regex);

  if (!match) {
    throw new Error('Invalid database connection string');
  }

  return {
    user: match[1],
    password: match[2],
    host: match[3],
    port: parseInt(match[4] || '5432'),
    database: match[5],
  };
}

// Public version that returns strings for external use
export function parseDatabaseUrl(url: string): {
  user: string;
  password: string;
  host: string;
  port: string;
  database: string;
} {
  const info = parseConnectionString(url);
  return {
    user: info.user,
    password: info.password,
    host: info.host,
    port: String(info.port),
    database: info.database,
  };
}

function buildConnectionString(info: DatabaseConnectionInfo): string {
  return `postgresql://${info.user}:${info.password}@${info.host}:${info.port}/${info.database}`;
}

// Build internal Render URL (for services running on Render)
function buildInternalConnectionString(info: DatabaseConnectionInfo): string {
  // Convert external hostname to internal
  // External: dpg-xxxxx-a.frankfurt-postgres.render.com
  // Internal: dpg-xxxxx-a
  const internalHost = info.host.split('.')[0];
  return `postgresql://${info.user}:${info.password}@${internalHost}/${info.database}`;
}

export async function createDatabase(siteId: string): Promise<string> {
  const baseInfo = parseConnectionString(config.sharedDatabaseUrl);
  const dbName = `luna_${siteId.toLowerCase().replace(/[^a-z0-9]/g, '_')}`;

  // Connect to the default database to create the new one
  const client = new Client({
    host: baseInfo.host,
    port: baseInfo.port,
    user: baseInfo.user,
    password: baseInfo.password,
    database: baseInfo.database,
    ssl: baseInfo.host.includes('render.com') ? { rejectUnauthorized: false } : false,
  });

  try {
    await client.connect();

    // Check if database exists
    const checkResult = await client.query(
      'SELECT 1 FROM pg_database WHERE datname = $1',
      [dbName]
    );

    if (checkResult.rows.length === 0) {
      // CREATE DATABASE cannot be parameterized, but we sanitize the name
      await client.query(`CREATE DATABASE "${dbName}"`);
      console.log(`Created database: ${dbName}`);
    } else {
      console.log(`Database ${dbName} already exists`);
    }

    // Return EXTERNAL connection string (works from anywhere)
    // Internal URLs are only needed for Render-to-Render communication
    const newDbInfo = { ...baseInfo, database: dbName };
    return buildConnectionString(newDbInfo);
  } finally {
    await client.end();
  }
}

export async function dropDatabase(siteId: string): Promise<void> {
  const baseInfo = parseConnectionString(config.sharedDatabaseUrl);
  const dbName = `luna_${siteId.toLowerCase().replace(/[^a-z0-9]/g, '_')}`;

  const client = new Client({
    host: baseInfo.host,
    port: baseInfo.port,
    user: baseInfo.user,
    password: baseInfo.password,
    database: baseInfo.database,
    ssl: baseInfo.host.includes('render.com') ? { rejectUnauthorized: false } : false,
  });

  try {
    await client.connect();

    // Terminate existing connections to the database
    await client.query(`
      SELECT pg_terminate_backend(pg_stat_activity.pid)
      FROM pg_stat_activity
      WHERE pg_stat_activity.datname = $1
      AND pid <> pg_backend_pid()
    `, [dbName]);

    // Drop the database
    await client.query(`DROP DATABASE IF EXISTS "${dbName}"`);
    console.log(`Dropped database: ${dbName}`);
  } finally {
    await client.end();
  }
}

export async function databaseExists(siteId: string): Promise<boolean> {
  const baseInfo = parseConnectionString(config.sharedDatabaseUrl);
  const dbName = `luna_${siteId.toLowerCase().replace(/[^a-z0-9]/g, '_')}`;

  const client = new Client({
    host: baseInfo.host,
    port: baseInfo.port,
    user: baseInfo.user,
    password: baseInfo.password,
    database: baseInfo.database,
    ssl: baseInfo.host.includes('render.com') ? { rejectUnauthorized: false } : false,
  });

  try {
    await client.connect();
    const result = await client.query(
      'SELECT 1 FROM pg_database WHERE datname = $1',
      [dbName]
    );
    return result.rows.length > 0;
  } finally {
    await client.end();
  }
}

/**
 * Clone an existing database to create a new site database
 */
export async function cloneDatabase(sourceSiteId: string, targetSiteId: string): Promise<string> {
  const baseInfo = parseConnectionString(config.sharedDatabaseUrl);
  const sourceDbName = `luna_${sourceSiteId.toLowerCase().replace(/[^a-z0-9]/g, '_')}`;
  const targetDbName = `luna_${targetSiteId.toLowerCase().replace(/[^a-z0-9]/g, '_')}`;

  const client = new Client({
    host: baseInfo.host,
    port: baseInfo.port,
    user: baseInfo.user,
    password: baseInfo.password,
    database: baseInfo.database,
    ssl: baseInfo.host.includes('render.com') ? { rejectUnauthorized: false } : false,
  });

  try {
    await client.connect();

    // Check if target already exists
    const checkResult = await client.query(
      'SELECT 1 FROM pg_database WHERE datname = $1',
      [targetDbName]
    );

    if (checkResult.rows.length > 0) {
      // Terminate connections to target before dropping
      await client.query(`
        SELECT pg_terminate_backend(pg_stat_activity.pid)
        FROM pg_stat_activity
        WHERE pg_stat_activity.datname = $1
        AND pid <> pg_backend_pid()
      `, [targetDbName]);
      await client.query(`DROP DATABASE "${targetDbName}"`);
    }

    // Retry loop for cloning (connections might reconnect quickly)
    const maxRetries = 3;
    for (let attempt = 1; attempt <= maxRetries; attempt++) {
      try {
        // Terminate all connections to source database (required for TEMPLATE)
        await client.query(`
          SELECT pg_terminate_backend(pg_stat_activity.pid)
          FROM pg_stat_activity
          WHERE pg_stat_activity.datname = $1
          AND pid <> pg_backend_pid()
        `, [sourceDbName]);

        // Small delay to allow connections to fully close
        await new Promise(resolve => setTimeout(resolve, 500));

        // Clone database using TEMPLATE
        await client.query(`CREATE DATABASE "${targetDbName}" TEMPLATE "${sourceDbName}"`);
        console.log(`Cloned database ${sourceDbName} to ${targetDbName}`);
        break; // Success, exit loop
      } catch (err: any) {
        if (err.code === '55006' && attempt < maxRetries) {
          // Error 55006: source database is being accessed by other users
          console.log(`Clone attempt ${attempt} failed, retrying...`);
          await new Promise(resolve => setTimeout(resolve, 1000 * attempt)); // Increasing delay
          continue;
        }
        throw err; // Rethrow if max retries reached or different error
      }
    }

    // Return connection string for new database
    const newDbInfo = { ...baseInfo, database: targetDbName };
    return buildConnectionString(newDbInfo);
  } finally {
    await client.end();
  }
}

/**
 * Update owner in a cloned database
 */
export async function updateDatabaseOwner(
  siteId: string,
  newOwnerId: string,
  ownerEmail?: string,
  ownerName?: string
): Promise<void> {
  const baseInfo = parseConnectionString(config.sharedDatabaseUrl);
  const dbName = `luna_${siteId.toLowerCase().replace(/[^a-z0-9]/g, '_')}`;

  const client = new Client({
    host: baseInfo.host,
    port: baseInfo.port,
    user: baseInfo.user,
    password: baseInfo.password,
    database: dbName,
    ssl: baseInfo.host.includes('render.com') ? { rejectUnauthorized: false } : false,
  });

  try {
    await client.connect();

    // Get current user id (from template) - skip system users like 'anonymous' and 'admin'
    const oldUserResult = await client.query(`
      SELECT id FROM "user"
      WHERE id NOT IN ('anonymous', 'admin')
      ORDER BY id
      LIMIT 1
    `);
    const oldUserId = oldUserResult.rows[0]?.id;

    // Skip if same user (user is creating site from their own template)
    if (oldUserId === newOwnerId) {
      console.log(`Owner ${newOwnerId} is the same, skipping update in ${dbName}`);
      return;
    }

    if (oldUserId) {
      // Update user table with new owner
      await client.query(`
        UPDATE "user" SET id = $1, email = $2, fullname = $3 WHERE id = $4
      `, [newOwnerId, ownerEmail || '', ownerName || '', oldUserId]);

      // Update document owner references
      await client.query(`
        UPDATE document SET owner = $1 WHERE owner = $2
      `, [newOwnerId, oldUserId]);

      // Update user_role references
      await client.query(`
        UPDATE user_role SET "user" = $1 WHERE "user" = $2
      `, [newOwnerId, oldUserId]);

      // Update user_group references
      await client.query(`
        UPDATE user_group SET "user" = $1 WHERE "user" = $2
      `, [newOwnerId, oldUserId]);

      // Update user_role_document references
      await client.query(`
        UPDATE user_role_document SET "user" = $1 WHERE "user" = $2
      `, [newOwnerId, oldUserId]);

      // Update version actor references
      await client.query(`
        UPDATE version SET actor = $1 WHERE actor = $2
      `, [newOwnerId, oldUserId]);

      // Ensure new owner has Administrator role
      await client.query(`
        INSERT INTO user_role ("user", role) VALUES ($1, 'Administrator')
        ON CONFLICT ("user", role) DO NOTHING
      `, [newOwnerId]);

      // Transfer ALL documents owned by 'admin' to new owner BEFORE deleting
      // (document.owner has CASCADE DELETE - deleting admin would delete all its documents!)
      await client.query(`
        UPDATE document SET owner = $1 WHERE owner = 'admin'
      `, [newOwnerId]);

      // Transfer version actor references from admin
      await client.query(`
        UPDATE version SET actor = $1 WHERE actor = 'admin'
      `, [newOwnerId]);

      // Delete legacy 'admin' user (security - not needed with Firebase auth)
      await client.query(`DELETE FROM user_role WHERE "user" = 'admin'`);
      await client.query(`DELETE FROM "user" WHERE id = 'admin'`);
      console.log(`Updated owner from ${oldUserId} to ${newOwnerId} in ${dbName}`);
    } else {
      // No existing user, create new owner with Administrator role
      await client.query(`
        INSERT INTO "user" (id, email, fullname, password) VALUES ($1, $2, $3, '')
        ON CONFLICT (id) DO UPDATE SET email = $2, fullname = $3
      `, [newOwnerId, ownerEmail || '', ownerName || '']);

      await client.query(`
        INSERT INTO user_role ("user", role) VALUES ($1, 'Administrator')
        ON CONFLICT ("user", role) DO NOTHING
      `, [newOwnerId]);

      console.log(`Created new owner ${newOwnerId} in ${dbName}`);
    }
  } finally {
    await client.end();
  }
}
