/**
 * Site Bootstrap Service
 *
 * Runs database migrations and seeds for a new site.
 * Uses Nick template (vanilla Luna Sites) for initial setup.
 */

import knex, { Knex } from 'knex';
import { readFileSync, existsSync, mkdirSync, readdirSync, statSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';
import _ from 'lodash';
import bcrypt from 'bcrypt';

const { isArray, isObject, mapKeys, mapValues, map, concat, findIndex } = _;

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Paths to local migrations and profiles (copied from Nick)
const MIGRATIONS_DIR = join(__dirname, '../migrations');
const PROFILES_DIR = join(__dirname, '../profiles');

// Schema types (from Nick)
interface Fieldset {
  id: string;
  title: string;
  fields: string[];
  behavior?: string;
}

interface Property {
  title?: string;
  description?: string;
  type?: string;
  widget?: string;
  default?: any;
  behavior?: string;
  factory?: string;
  [key: string]: any;
}

interface Schema {
  fieldsets?: Fieldset[];
  properties?: { [key: string]: Property };
  required?: string[];
  behaviors?: string[];
  layouts?: string[];
}

interface BehaviorData {
  id: string;
  title: string;
  description: string;
  schema: Schema;
}

/**
 * Strip i18n suffixes from JSON keys (copied from Nick's i18n helper)
 * Converts 'title:i18n' -> 'title', recursively
 */
function stripI18n(node: any): any {
  if (isArray(node)) {
    return map(node, (child) => stripI18n(child));
  } else if (isObject(node)) {
    return mapValues(
      mapKeys(node, (value, key) => key.replace(/:i18n$/, '')),
      (value) => stripI18n(value),
    );
  } else {
    return node;
  }
}

/**
 * Merge multiple schemas together (same logic as Nick's mergeSchemas)
 */
function mergeSchemas(...schemas: { name: string; data: Schema }[]): Schema {
  const fieldsets: Fieldset[] = [];
  let properties: { [key: string]: Property } = {};
  let required: string[] = [];
  let behaviors: string[] = [];
  let layouts: string[] = [];

  for (const schema of schemas) {
    if (!schema.data) continue;

    // Merge fieldsets
    if (schema.data.fieldsets) {
      for (const fieldset of schema.data.fieldsets) {
        const index = findIndex(fieldsets, (entry: Fieldset) => entry.id === fieldset.id);
        if (index !== -1) {
          // Append fields to existing fieldset
          fieldsets[index].fields = [
            ...fieldsets[index].fields,
            ...fieldset.fields,
          ];
        } else {
          // Add new fieldset with behavior tag
          fieldsets.push({
            behavior: schema.name,
            ...fieldset,
          });
        }
      }
    }

    // Merge properties with behavior tag
    if (schema.data.properties) {
      properties = {
        ...properties,
        ...mapValues(schema.data.properties, (property: Property) => ({
          behavior: schema.name,
          ...property,
        })),
      };
    }

    // Merge required
    if (schema.data.required) {
      required = concat(required, schema.data.required);
    }

    // Merge behaviors
    if (schema.data.behaviors) {
      behaviors = concat(behaviors, schema.data.behaviors);
    }

    // Merge layouts
    if (schema.data.layouts) {
      layouts = concat(layouts, schema.data.layouts);
    }
  }

  return {
    fieldsets,
    properties,
    required,
    behaviors,
    layouts,
  };
}

// Global cache for behaviors (populated during seeding)
let behaviorCache: Map<string, BehaviorData> = new Map();

/**
 * Recursively fetch schema for a behavior (same as Nick's Behavior.fetchSchema)
 */
function fetchBehaviorSchema(behaviorId: string): Schema {
  const behavior = behaviorCache.get(behaviorId);
  if (!behavior) {
    console.warn(`[Bootstrap] Behavior not found: ${behaviorId}`);
    return { fieldsets: [], properties: {}, required: [], behaviors: [], layouts: [] };
  }

  const schema = behavior.schema;

  // If this behavior has sub-behaviors, recursively merge them
  if (schema.behaviors && schema.behaviors.length > 0) {
    const subSchemas = schema.behaviors.map(subId => ({
      name: subId,
      data: fetchBehaviorSchema(subId),
    }));

    return mergeSchemas(
      ...subSchemas,
      { name: behaviorId, data: schema }
    );
  }

  return schema;
}

/**
 * Compute _schema for a type (same as Nick's Type.cacheSchema)
 */
function computeTypeSchema(typeSchema: Schema): Schema {
  if (typeSchema.behaviors && typeSchema.behaviors.length > 0) {
    // Fetch schemas for all behaviors
    const behaviorSchemas = typeSchema.behaviors.map(behaviorId => ({
      name: behaviorId,
      data: fetchBehaviorSchema(behaviorId),
    }));

    // Merge: default + behaviors + type's own schema
    return mergeSchemas(
      {
        name: 'default',
        data: {
          fieldsets: [
            {
              fields: [],
              id: 'default',
              title: 'Default',
            },
          ],
          properties: {},
          required: [],
          behaviors: [],
          layouts: [],
        },
      },
      ...behaviorSchemas,
      { name: 'generated', data: typeSchema }
    );
  }

  // No behaviors - just return the schema as-is
  return typeSchema;
}

interface DatabaseConfig {
  host: string;
  port: number;
  database: string;
  user: string;
  password: string;
}

// Base blobs directory (same as Render config)
const BASE_BLOBS_DIR = process.env.BLOBS_DIR || '/tmp/blobs';

interface BootstrapOptions {
  siteId: string;
}

/**
 * Create a Knex instance for the given database config
 */
function createKnexInstance(dbConfig: DatabaseConfig): Knex {
  return knex({
    client: 'pg',
    connection: {
      host: dbConfig.host,
      port: dbConfig.port,
      database: dbConfig.database,
      user: dbConfig.user,
      password: dbConfig.password,
      ssl: dbConfig.host.includes('render.com') ? { rejectUnauthorized: false } : false,
    },
    pool: {
      min: 1,
      max: 5,
    },
  });
}

/**
 * Run database migrations for a site
 */
export async function runMigrations(
  dbConfig: DatabaseConfig,
  options: BootstrapOptions
): Promise<void> {
  const db = createKnexInstance(dbConfig);
  // Each site gets its own blobs directory
  const siteBlobsDir = join(BASE_BLOBS_DIR, options.siteId);

  try {
    console.log(`[Bootstrap] Running migrations for database: ${dbConfig.database}`);
    console.log(`[Bootstrap] Blobs directory: ${siteBlobsDir}`);

    // Create site-specific blobs directory
    if (!existsSync(siteBlobsDir)) {
      mkdirSync(siteBlobsDir, { recursive: true });
    }

    // Set blobsDir in environment for migrations that use process.cwd()/config
    process.env.SITE_BLOBS_DIR = siteBlobsDir;

    // Run migrations using Knex's migrate API
    await db.migrate.latest({
      directory: MIGRATIONS_DIR,
      tableName: 'knex_migrations',
    });

    console.log(`[Bootstrap] Migrations completed for: ${dbConfig.database}`);
  } finally {
    await db.destroy();
  }
}

/**
 * Load JSON profile data with i18n stripping (like Nick does)
 */
function loadProfileJson(profilePath: string, filename: string): any {
  const filePath = join(profilePath, `${filename}.json`);
  if (existsSync(filePath)) {
    const content = readFileSync(filePath, 'utf-8');
    return stripI18n(JSON.parse(content));
  }
  return null;
}

/**
 * Seed the database with initial data from profiles
 */
export async function runSeed(dbConfig: DatabaseConfig): Promise<void> {
  const db = createKnexInstance(dbConfig);

  // Clear behavior cache for fresh seeding
  behaviorCache = new Map();

  try {
    console.log(`[Bootstrap] Seeding database: ${dbConfig.database}`);

    // Start transaction
    await db.transaction(async (trx) => {
      // Seed core profile (behaviors + everything except types)
      await seedProfile(trx, join(PROFILES_DIR, 'core'), { skipTypes: true });

      // Seed default profile (behaviors only first)
      await seedProfile(trx, join(PROFILES_DIR, 'default'), { skipTypes: true });

      // Now seed types from both profiles (all behaviors are in cache now)
      await seedTypes(trx, join(PROFILES_DIR, 'core'));
      await seedTypes(trx, join(PROFILES_DIR, 'default'));

      // Seed remaining parts of core and default profiles
      await seedProfile(trx, join(PROFILES_DIR, 'core'), { onlyRemaining: true });
      await seedProfile(trx, join(PROFILES_DIR, 'default'), { onlyRemaining: true });
    });

    console.log(`[Bootstrap] Seeding completed for: ${dbConfig.database}`);
  } finally {
    await db.destroy();
  }
}

interface SeedOptions {
  skipTypes?: boolean;
  onlyRemaining?: boolean;
}

/**
 * Seed types from a profile (separate function to ensure all behaviors are cached first)
 */
async function seedTypes(trx: Knex.Transaction, profilePath: string): Promise<void> {
  const typesDir = join(profilePath, 'types');
  if (existsSync(typesDir)) {
    const typeFiles = readdirSync(typesDir).filter(f => f.endsWith('.json'));

    for (const typeFile of typeFiles) {
      const typeData = stripI18n(JSON.parse(readFileSync(join(typesDir, typeFile), 'utf-8')));
      const schema = typeData.schema || {};

      // Compute _schema by merging behavior schemas (same as Type.cacheSchema)
      const cachedSchema = computeTypeSchema(schema);

      await trx('type').insert({
        id: typeData.id,
        title: typeData.title || typeData.id,
        description: typeData.description || '',
        global_allow: typeData.global_allow ?? true,
        filter_content_types: typeData.filter_content_types ?? false,
        allowed_content_types: typeData.allowed_content_types || [],
        schema: JSON.stringify(schema),
        _schema: JSON.stringify(cachedSchema),
        workflow: typeData.workflow || 'simple_publication_workflow',
      }).onConflict('id').merge();
    }
    console.log(`[Bootstrap] Types imported from ${profilePath}: ${typeFiles.length}`);
  }
}

/**
 * Seed a single profile
 */
async function seedProfile(trx: Knex.Transaction, profilePath: string, options: SeedOptions = {}): Promise<void> {
  const { skipTypes = false, onlyRemaining = false } = options;

  // If onlyRemaining, only do catalog/actions/controlpanels/documents
  if (onlyRemaining) {
    // Catalog indexes
    const catalogData = loadProfileJson(profilePath, 'catalog');
    const indexes = catalogData?.indexes || [];
    if (indexes.length > 0) {
      for (const index of indexes) {
        await trx('index').insert({
          id: `_${index.name}`,
          name: index.name,
          title: index.title || index.name,
          type: index.type,
          attr: index.attr || null,
          metadata: false,
          description: index.description || '',
          group: index.group || null,
          enabled: index.enabled ?? true,
          sortable: index.sortable ?? false,
          operators: JSON.stringify(index.operators || {}),
          vocabulary: index.vocabulary || null,
        }).onConflict('id').merge();

        const field = `_${index.name}`;
        try {
          await trx.schema.alterTable('catalog', (table) => {
            switch (index.type) {
              case 'string': table.string(field).index(); break;
              case 'integer': table.integer(field).index(); break;
              case 'path': table.string(field).index(); break;
              case 'uuid': table.uuid(field).index(); break;
              case 'boolean': table.boolean(field).index(); break;
              case 'date': table.dateTime(field).index(); break;
              case 'string[]': table.specificType(field, 'character varying(255)[]').index(); break;
              case 'uuid[]': table.specificType(field, 'uuid[]').index(); break;
              case 'text': table.specificType(field, 'tsvector'); break;
              default: console.log(`[Bootstrap] Unhandled index type: ${index.type}`);
            }
          });
          // Add GIN index for tsvector columns
          if (index.type === 'text') {
            await trx.raw(`CREATE INDEX IF NOT EXISTS catalog_${field}_gin_idx ON catalog USING GIN ("${field}")`);
          }
        } catch (err: any) {
          if (!err.message?.includes('already exists')) {
            console.warn(`[Bootstrap] Error adding catalog column ${field}:`, err.message);
          }
        }
      }
      console.log(`[Bootstrap] Catalog indexes imported: ${indexes.length}`);
    }

    // Catalog metadata
    const catalogMetadata = catalogData?.metadata || [];
    if (catalogMetadata.length > 0) {
      for (const meta of catalogMetadata) {
        await trx('index').insert({
          id: meta.name,
          name: meta.name,
          type: meta.type,
          attr: meta.attr || null,
          metadata: true,
          title: meta.name,
          description: '',
          group: null,
          enabled: meta.enabled ?? true,
          sortable: false,
          operators: JSON.stringify({}),
          vocabulary: null,
        }).onConflict('id').merge();

        try {
          await trx.schema.alterTable('catalog', (table) => {
            switch (meta.type) {
              case 'uuid': table.uuid(meta.name); break;
              case 'string': table.string(meta.name); break;
              case 'date': table.dateTime(meta.name); break;
              case 'integer': table.integer(meta.name); break;
              case 'boolean': table.boolean(meta.name); break;
              case 'json': table.json(meta.name); break;
              case 'string[]': table.specificType(meta.name, 'character varying(255)[]'); break;
              case 'text': table.text(meta.name); break;
              default: console.log(`[Bootstrap] Unhandled metadata type: ${meta.type}`);
            }
          });
        } catch (err: any) {
          if (!err.message?.includes('already exists')) {
            console.warn(`[Bootstrap] Error adding catalog column ${meta.name}:`, err.message);
          }
        }
      }
      console.log(`[Bootstrap] Catalog metadata imported: ${catalogMetadata.length}`);
    }

    // Actions
    const actionsData = loadProfileJson(profilePath, 'actions');
    const categories = ['object', 'site_actions', 'object_buttons', 'user'];
    let actionCount = 0;
    for (const category of categories) {
      const actions = actionsData?.[category] || [];
      for (let i = 0; i < actions.length; i++) {
        const action = actions[i];
        await trx('action').insert({
          id: action.id,
          title: action.title || action.id,
          category,
          order: action.order ?? i,
          permission: action.permission || 'View',
        }).onConflict('id').merge();
        actionCount++;
      }
    }
    if (actionCount > 0) {
      console.log(`[Bootstrap] Actions imported: ${actionCount}`);
    }

    // Controlpanels
    const controlpanelsDir = join(profilePath, 'controlpanels');
    if (existsSync(controlpanelsDir)) {
      const cpFiles = readdirSync(controlpanelsDir).filter(f => f.endsWith('.json'));
      for (const cpFile of cpFiles) {
        const cpData = stripI18n(JSON.parse(readFileSync(join(controlpanelsDir, cpFile), 'utf-8')));
        await trx('controlpanel').insert({
          id: cpData.id,
          title: cpData.title || cpData.id,
          group: cpData.group || 'General',
          schema: JSON.stringify(cpData.schema || {}),
          data: JSON.stringify(cpData.data || {}),
        }).onConflict('id').merge();
      }
      console.log(`[Bootstrap] Controlpanels imported: ${cpFiles.length}`);
    }

    // Documents
    const documentsDir = join(profilePath, 'documents');
    if (existsSync(documentsDir)) {
      await seedDocuments(trx, documentsDir);
    }

    return;
  }
  // Profile metadata
  const metadata = loadProfileJson(profilePath, 'metadata');
  if (metadata) {
    await trx('profile').insert({
      id: metadata.id,
      title: metadata.title,
      description: metadata.description,
      version: metadata.version,
    }).onConflict('id').merge();
    console.log(`[Bootstrap] Profile imported: ${metadata.id}`);
  }

  // Permissions
  const permissionsData = loadProfileJson(profilePath, 'permissions');
  const permissions = permissionsData?.permissions || [];
  if (permissions.length > 0) {
    for (const permission of permissions) {
      await trx('permission').insert({
        id: permission.id,
        title: permission['title:i18n'] || permission.title || permission.id,
      }).onConflict('id').merge();
    }
    console.log(`[Bootstrap] Permissions imported: ${permissions.length}`);
  }

  // Roles
  const rolesData = loadProfileJson(profilePath, 'roles');
  const roles = rolesData?.roles || [];
  if (roles.length > 0) {
    for (const role of roles) {
      await trx('role').insert({
        id: role.id,
        title: role['title:i18n'] || role.title || role.id,
      }).onConflict('id').merge();

      // Role permissions
      if (role.permissions) {
        for (const permId of role.permissions) {
          await trx('role_permission').insert({
            role: role.id,
            permission: permId,
          }).onConflict(['role', 'permission']).ignore();
        }
      }
    }
    console.log(`[Bootstrap] Roles imported: ${roles.length}`);
  }

  // Groups
  const groupsData = loadProfileJson(profilePath, 'groups');
  const groups = groupsData?.groups || (Array.isArray(groupsData) ? groupsData : []);
  if (groups.length > 0) {
    for (const group of groups) {
      await trx('group').insert({
        id: group.id,
        title: group['title:i18n'] || group.title || group.id,
        description: group.description || '',
        email: group.email || '',
      }).onConflict('id').merge();

      // Group roles
      if (group.roles) {
        for (const roleId of group.roles) {
          await trx('group_role').insert({
            group: group.id,
            role: roleId,
          }).onConflict(['group', 'role']).ignore();
        }
      }
    }
    console.log(`[Bootstrap] Groups imported: ${groups.length}`);
  }

  // Users
  const usersData = loadProfileJson(profilePath, 'users');
  const users = usersData?.users || (Array.isArray(usersData) ? usersData : []);
  if (users.length > 0) {
    for (const user of users) {
      // Hash password with bcrypt (same as Nick does)
      const hashedPassword = user.password
        ? await bcrypt.hash(user.password, 10)
        : '';

      await trx('user').insert({
        id: user.id,
        fullname: user.fullname || user.id,
        email: user.email || `${user.id}@localhost`,
        password: hashedPassword,
      }).onConflict('id').merge();

      // User roles
      if (user.roles) {
        for (const roleId of user.roles) {
          await trx('user_role').insert({
            user: user.id,
            role: roleId,
          }).onConflict(['user', 'role']).ignore();
        }
      }

      // User groups
      if (user.groups) {
        for (const groupId of user.groups) {
          await trx('user_group').insert({
            user: user.id,
            group: groupId,
          }).onConflict(['user', 'group']).ignore();
        }
      }
    }
    console.log(`[Bootstrap] Users imported: ${users.length}`);
  }

  // Workflows
  const workflowsData = loadProfileJson(profilePath, 'workflows');
  const workflows = workflowsData?.workflows || [];
  if (workflows.length > 0) {
    for (const workflow of workflows) {
      await trx('workflow').insert({
        id: workflow.id,
        title: workflow.title || workflow.id,
        description: workflow.description || '',
        json: JSON.stringify(workflow.json || workflow),
      }).onConflict('id').merge();
    }
    console.log(`[Bootstrap] Workflows imported: ${workflows.length}`);
  }

  // Behaviors (must be before Types) - also populate cache for _schema computation
  const behaviorsDir = join(profilePath, 'behaviors');
  if (existsSync(behaviorsDir)) {
    const behaviorFiles = readdirSync(behaviorsDir).filter(f => f.endsWith('.json'));

    for (const behaviorFile of behaviorFiles) {
      const behaviorData = stripI18n(JSON.parse(readFileSync(join(behaviorsDir, behaviorFile), 'utf-8')));

      // Store in cache for type schema computation
      behaviorCache.set(behaviorData.id, {
        id: behaviorData.id,
        title: behaviorData.title || behaviorData.id,
        description: behaviorData.description || '',
        schema: behaviorData.schema || {},
      });

      await trx('behavior').insert({
        id: behaviorData.id,
        title: behaviorData.title || behaviorData.id,
        description: behaviorData.description || '',
        schema: JSON.stringify(behaviorData.schema || {}),
      }).onConflict('id').merge();
    }
    console.log(`[Bootstrap] Behaviors imported: ${behaviorFiles.length}`);
  }

  // When skipTypes is true, we stop here (types are seeded separately after all behaviors are cached)
  // The remaining parts (catalog, actions, controlpanels, documents) are handled by onlyRemaining
}

/**
 * Seed documents from Nick's flat file format
 * Files are named like: _root.json, events.json, events.event-1.json
 * - _root.json -> path /, parent null
 * - events.json -> path /events, parent is root
 * - events.event-1.json -> path /events/event-1, parent is events
 */
async function seedDocuments(
  trx: Knex.Transaction,
  docsDir: string
): Promise<void> {
  const entries = readdirSync(docsDir);

  // Filter to only .json files (not directories like images/)
  const jsonFiles = entries
    .filter(f => f.endsWith('.json'))
    .map(f => f.replace('.json', ''))
    .sort(); // Sort so parents come before children

  const children: Record<string, number> = {};
  const insertedUuids: string[] = [];

  for (const file of jsonFiles) {
    const jsonPath = join(docsDir, `${file}.json`);
    const docData = stripI18n(JSON.parse(readFileSync(jsonPath, 'utf-8')));

    // Parse path from filename
    const slugs = file.split('.');
    const isRoot = slugs[slugs.length - 1] === '_root';
    const id = isRoot ? 'root' : slugs[slugs.length - 1];
    const path = isRoot ? '/' : `/${slugs.join('/')}`;

    // Find parent UUID
    let parentUuid: string | null = null;
    if (!isRoot) {
      const parentPath = slugs.length > 1
        ? `/${slugs.slice(0, -1).join('/')}`
        : '/';
      const parent = await trx('document').where('path', parentPath).first();
      if (parent) {
        parentUuid = parent.uuid;
      } else {
        console.warn(`[Bootstrap] Parent not found for ${path}, skipping`);
        continue;
      }
    }

    // Track position in parent
    const positionKey = parentUuid || 'root';
    const position = children[positionKey] || 0;
    children[positionKey] = position + 1;

    const uuid = docData.uuid || crypto.randomUUID();

    // Separate document fields from JSON blob
    const documentFields = ['uuid', 'parent', 'id', 'path', 'created', 'modified',
      'type', 'position_in_parent', 'version', 'versions', 'owner', 'lock',
      'translation_group', 'language', 'workflow_state', 'workflow_history', 'sharing'];

    const jsonBlob: Record<string, any> = {};
    for (const key of Object.keys(docData)) {
      if (!documentFields.includes(key)) {
        jsonBlob[key] = docData[key];
      }
    }

    await trx('document').insert({
      uuid,
      parent: parentUuid,
      id,
      path,
      created: docData.created || new Date().toISOString(),
      modified: docData.modified || new Date().toISOString(),
      type: docData.type || 'Page',
      position_in_parent: docData.position_in_parent ?? position,
      version: docData.version ?? 0,
      owner: docData.owner || 'admin',
      json: JSON.stringify(jsonBlob),
      lock: JSON.stringify(docData.lock || { locked: false, stealable: true }),
      translation_group: docData.translation_group || uuid,
      language: docData.language || 'en',
      workflow_state: docData.workflow_state || 'published',
      workflow_history: JSON.stringify(docData.workflow_history || []),
    }).onConflict('uuid').merge();

    insertedUuids.push(uuid);
    console.log(`[Bootstrap] Document imported: ${path}`);
  }

  console.log(`[Bootstrap] Documents imported: ${insertedUuids.length}`);
}

/**
 * Full bootstrap: run migrations + seed
 */
export async function bootstrapSite(
  dbConfig: DatabaseConfig,
  options: BootstrapOptions
): Promise<void> {
  console.log(`[Bootstrap] Starting bootstrap for: ${dbConfig.database}`);
  console.log(`[Bootstrap] Site ID: ${options.siteId}`);

  // Run migrations first
  await runMigrations(dbConfig, options);

  // Then seed the database
  await runSeed(dbConfig);

  console.log(`[Bootstrap] Bootstrap completed for: ${dbConfig.database}`);
}

export default {
  runMigrations,
  runSeed,
  bootstrapSite,
};
