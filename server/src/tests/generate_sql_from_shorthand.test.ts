
import { describe, expect, it } from 'bun:test';
import { generateSqlFromShorthand } from '../handlers/generate_sql_from_shorthand';
import { type GenerateSqlInput } from '../schema';

describe('generateSqlFromShorthand', () => {
  it('should generate SQL for basic id column', async () => {
    const input: GenerateSqlInput = {
      table_name: 'users',
      shorthand_definition: 'id:id'
    };

    const result = await generateSqlFromShorthand(input);

    expect(result.table_name).toBe('users');
    expect(result.shorthand_definition).toBe('id:id');
    expect(result.generated_sql).toBe(
      'CREATE TABLE users (\n  id SERIAL PRIMARY KEY\n);'
    );
  });

  it('should generate SQL for text columns', async () => {
    const input: GenerateSqlInput = {
      table_name: 'posts',
      shorthand_definition: 'title:t\ndescription:tn'
    };

    const result = await generateSqlFromShorthand(input);

    expect(result.generated_sql).toBe(
      'CREATE TABLE posts (\n  title TEXT NOT NULL DEFAULT \'\',\n  description TEXT\n);'
    );
  });

  it('should generate SQL for integer columns', async () => {
    const input: GenerateSqlInput = {
      table_name: 'products',
      shorthand_definition: 'quantity:i\noptional_count:in'
    };

    const result = await generateSqlFromShorthand(input);

    expect(result.generated_sql).toBe(
      'CREATE TABLE products (\n  quantity INTEGER NOT NULL DEFAULT 0,\n  optional_count INTEGER\n);'
    );
  });

  it('should generate SQL for timestamp columns', async () => {
    const input: GenerateSqlInput = {
      table_name: 'events',
      shorthand_definition: 'created_at:tzn\nupdated_at:tz'
    };

    const result = await generateSqlFromShorthand(input);

    expect(result.generated_sql).toBe(
      'CREATE TABLE events (\n  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),\n  updated_at TIMESTAMPTZ\n);'
    );
  });

  it('should handle custom default values', async () => {
    const input: GenerateSqlInput = {
      table_name: 'settings',
      shorthand_definition: 'status:t d \'active\'\nconfig:t d \'{}\''
    };

    const result = await generateSqlFromShorthand(input);

    expect(result.generated_sql).toBe(
      'CREATE TABLE settings (\n  status TEXT NOT NULL DEFAULT \'active\',\n  config TEXT NOT NULL DEFAULT \'{}\'\n);'
    );
  });

  it('should generate complex table with mixed column types', async () => {
    const input: GenerateSqlInput = {
      table_name: 'users',
      shorthand_definition: 'id:id\nname:t\nemail:t\nage:in\ncreated_at:tzn\nupdated_at:tz'
    };

    const result = await generateSqlFromShorthand(input);

    const expectedSql = 'CREATE TABLE users (\n  id SERIAL PRIMARY KEY,\n  name TEXT NOT NULL DEFAULT \'\',\n  email TEXT NOT NULL DEFAULT \'\',\n  age INTEGER,\n  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),\n  updated_at TIMESTAMPTZ\n);';

    expect(result.generated_sql).toBe(expectedSql);
  });

  it('should throw error for unknown column type', async () => {
    const input: GenerateSqlInput = {
      table_name: 'test',
      shorthand_definition: 'field:unknown_type'
    };

    await expect(generateSqlFromShorthand(input)).rejects.toThrow(/Unknown type: unknown_type/i);
  });

  it('should throw error for empty shorthand definition', async () => {
    const input: GenerateSqlInput = {
      table_name: 'test',
      shorthand_definition: ''
    };

    await expect(generateSqlFromShorthand(input)).rejects.toThrow(/No valid column definitions found/i);
  });

  it('should ignore empty lines and whitespace', async () => {
    const input: GenerateSqlInput = {
      table_name: 'test',
      shorthand_definition: '\n        id:id\n        \n        name:t\n        \n      '
    };

    const result = await generateSqlFromShorthand(input);

    expect(result.generated_sql).toBe(
      'CREATE TABLE test (\n  id SERIAL PRIMARY KEY,\n  name TEXT NOT NULL DEFAULT \'\'\n);'
    );
  });

  it('should handle column names with underscores', async () => {
    const input: GenerateSqlInput = {
      table_name: 'user_profiles',
      shorthand_definition: 'user_id:i\nfirst_name:t\nlast_name:tn'
    };

    const result = await generateSqlFromShorthand(input);

    expect(result.generated_sql).toBe(
      'CREATE TABLE user_profiles (\n  user_id INTEGER NOT NULL DEFAULT 0,\n  first_name TEXT NOT NULL DEFAULT \'\',\n  last_name TEXT\n);'
    );
  });
});
