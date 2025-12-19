import type { Knex } from 'knex';

export const up = async (knex: Knex): Promise<void> => {
  await knex.schema.createTable('blob', (table: Knex.TableBuilder) => {
    table.uuid('uuid').primary();
    table.binary('data').notNullable();
    table.integer('size').notNullable();
    table.string('content_type', 255);
    table.dateTime('created').notNullable().defaultTo(knex.fn.now());
  });

  await knex.raw('CREATE INDEX IF NOT EXISTS idx_blob_created ON blob(created)');
};

export const down = async (knex: Knex): Promise<void> => {
  await knex.schema.dropTableIfExists('blob');
};
