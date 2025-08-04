
import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { mTableTable } from '../db/schema';
import { type CreateTableDefinitionInput } from '../schema';
import { createTableDefinition } from '../handlers/create_table_definition';
import { eq } from 'drizzle-orm';

describe('createTableDefinition', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  it('should create a basic table definition', async () => {
    const input: CreateTableDefinitionInput = {
      name: 'users',
      shorthand_definition: 'name t, email t'
    };

    const result = await createTableDefinition(input);

    expect(result.name).toEqual('users');
    expect(result.shorthand_definition).toEqual('name t, email t');
    expect(result.generated_sql).toContain('CREATE TABLE users');
    expect(result.generated_sql).toContain('id SERIAL PRIMARY KEY');
    expect(result.generated_sql).toContain('name TEXT NOT NULL DEFAULT \'\'');
    expect(result.generated_sql).toContain('email TEXT NOT NULL DEFAULT \'\'');
    expect(result.id).toBeDefined();
    expect(result.created_at).toBeInstanceOf(Date);
  });

  it('should save table definition to database', async () => {
    const input: CreateTableDefinitionInput = {
      name: 'products',
      shorthand_definition: 'title t, price i'
    };

    const result = await createTableDefinition(input);

    const saved = await db.select()
      .from(mTableTable)
      .where(eq(mTableTable.id, result.id))
      .execute();

    expect(saved).toHaveLength(1);
    expect(saved[0].name).toEqual('products');
    expect(saved[0].shorthand_definition).toEqual('title t, price i');
    expect(saved[0].generated_sql).toContain('CREATE TABLE products');
    expect(saved[0].created_at).toBeInstanceOf(Date);
  });

  it('should handle different shorthand types', async () => {
    const input: CreateTableDefinitionInput = {
      name: 'test_table',
      shorthand_definition: 'name t, description tn, count i, nullable_count in, created_at tzn, updated_at tz'
    };

    const result = await createTableDefinition(input);

    expect(result.generated_sql).toContain('name TEXT NOT NULL DEFAULT \'\'');
    expect(result.generated_sql).toContain('description TEXT NULL');
    expect(result.generated_sql).toContain('count INT NOT NULL DEFAULT 0');
    expect(result.generated_sql).toContain('nullable_count INT NULL');
    expect(result.generated_sql).toContain('created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()');
    expect(result.generated_sql).toContain('updated_at TIMESTAMPTZ NULL');
  });

  it('should handle custom id column', async () => {
    const input: CreateTableDefinitionInput = {
      name: 'custom_table',
      shorthand_definition: 'user_id id, name t'
    };

    const result = await createTableDefinition(input);

    expect(result.generated_sql).toContain('user_id SERIAL PRIMARY KEY');
    expect(result.generated_sql).toContain('name TEXT NOT NULL DEFAULT \'\'');
    // Should not add default id column when custom id exists
    expect(result.generated_sql).not.toMatch(/^\s*id SERIAL PRIMARY KEY/m);
  });

  it('should handle default values', async () => {
    const input: CreateTableDefinitionInput = {
      name: 'defaults_table',
      shorthand_definition: 'status t d \'active\', priority i d \'1\''
    };

    const result = await createTableDefinition(input);

    expect(result.generated_sql).toContain('status TEXT NOT NULL DEFAULT \'active\'');
    expect(result.generated_sql).toContain('priority INT NOT NULL DEFAULT \'1\'');
  });

  it('should handle empty shorthand definition', async () => {
    const input: CreateTableDefinitionInput = {
      name: 'empty_table',
      shorthand_definition: ''
    };

    const result = await createTableDefinition(input);

    expect(result.generated_sql).toContain('CREATE TABLE empty_table');
    expect(result.generated_sql).toContain('id SERIAL PRIMARY KEY');
    // Should only contain the default id column
    expect(result.generated_sql.split('\n')).toHaveLength(3); // CREATE line, id column, closing brace
  });

  it('should handle mixed column types', async () => {
    const input: CreateTableDefinitionInput = {
      name: 'mixed_table',
      shorthand_definition: 'id id, title t, views i, published_at tzn, notes tn'
    };

    const result = await createTableDefinition(input);

    expect(result.generated_sql).toContain('id SERIAL PRIMARY KEY');
    expect(result.generated_sql).toContain('title TEXT NOT NULL DEFAULT \'\'');
    expect(result.generated_sql).toContain('views INT NOT NULL DEFAULT 0');
    expect(result.generated_sql).toContain('published_at TIMESTAMPTZ NOT NULL DEFAULT NOW()');
    expect(result.generated_sql).toContain('notes TEXT NULL');
  });

  it('should handle whitespace in shorthand definition', async () => {
    const input: CreateTableDefinitionInput = {
      name: 'whitespace_table',
      shorthand_definition: '  name   t  ,   email    t   ,  age   i  '
    };

    const result = await createTableDefinition(input);

    expect(result.generated_sql).toContain('name TEXT NOT NULL DEFAULT \'\'');
    expect(result.generated_sql).toContain('email TEXT NOT NULL DEFAULT \'\'');
    expect(result.generated_sql).toContain('age INT NOT NULL DEFAULT 0');
  });

  it('should handle single column definition', async () => {
    const input: CreateTableDefinitionInput = {
      name: 'single_column',
      shorthand_definition: 'name t'
    };

    const result = await createTableDefinition(input);

    expect(result.generated_sql).toContain('CREATE TABLE single_column');
    expect(result.generated_sql).toContain('id SERIAL PRIMARY KEY');
    expect(result.generated_sql).toContain('name TEXT NOT NULL DEFAULT \'\'');
  });
});
