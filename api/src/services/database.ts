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
