
import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { mTableTable } from '../db/schema';
import { getTableDefinitions } from '../handlers/get_table_definitions';

describe('getTableDefinitions', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  it('should return empty array when no table definitions exist', async () => {
    const result = await getTableDefinitions();
    expect(result).toEqual([]);
  });

  it('should return all table definitions', async () => {
    // Create test table definitions
    await db.insert(mTableTable)
      .values([
        {
          name: 'users',
          shorthand_definition: 'id:serial, name:text, email:text',
          generated_sql: 'CREATE TABLE users (id SERIAL PRIMARY KEY, name TEXT, email TEXT);'
        },
        {
          name: 'products',
          shorthand_definition: 'id:serial, title:text, price:numeric',
          generated_sql: 'CREATE TABLE products (id SERIAL PRIMARY KEY, title TEXT, price NUMERIC);'
        }
      ])
      .execute();

    const result = await getTableDefinitions();

    expect(result).toHaveLength(2);
    
    // Verify first table definition
    expect(result[0].name).toEqual('users');
    expect(result[0].shorthand_definition).toEqual('id:serial, name:text, email:text');
    expect(result[0].generated_sql).toEqual('CREATE TABLE users (id SERIAL PRIMARY KEY, name TEXT, email TEXT);');
    expect(result[0].id).toBeDefined();
    expect(result[0].created_at).toBeInstanceOf(Date);

    // Verify second table definition
    expect(result[1].name).toEqual('products');
    expect(result[1].shorthand_definition).toEqual('id:serial, title:text, price:numeric');
    expect(result[1].generated_sql).toEqual('CREATE TABLE products (id SERIAL PRIMARY KEY, title TEXT, price NUMERIC);');
    expect(result[1].id).toBeDefined();
    expect(result[1].created_at).toBeInstanceOf(Date);
  });

  it('should return table definitions in insertion order', async () => {
    // Insert table definitions with slight delay to ensure different timestamps
    await db.insert(mTableTable)
      .values({
        name: 'first_table',
        shorthand_definition: 'id:serial, name:text',
        generated_sql: 'CREATE TABLE first_table (id SERIAL PRIMARY KEY, name TEXT);'
      })
      .execute();

    await db.insert(mTableTable)
      .values({
        name: 'second_table',
        shorthand_definition: 'id:serial, title:text',
        generated_sql: 'CREATE TABLE second_table (id SERIAL PRIMARY KEY, title TEXT);'
      })
      .execute();

    const result = await getTableDefinitions();

    expect(result).toHaveLength(2);
    expect(result[0].name).toEqual('first_table');
    expect(result[1].name).toEqual('second_table');
    expect(result[0].created_at.getTime()).toBeLessThanOrEqual(result[1].created_at.getTime());
  });
});
