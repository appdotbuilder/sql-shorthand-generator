
import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { mTableTable } from '../db/schema';
import { type CreateTableDefinitionInput } from '../schema';
import { getTableDefinitionById } from '../handlers/get_table_definition_by_id';

// Test data
const testTableDefinition: CreateTableDefinitionInput = {
  name: 'users',
  shorthand_definition: 'id:serial pk, name:text, email:text unique'
};

describe('getTableDefinitionById', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  it('should return table definition when ID exists', async () => {
    // Create a test table definition
    const insertResult = await db.insert(mTableTable)
      .values({
        name: testTableDefinition.name,
        shorthand_definition: testTableDefinition.shorthand_definition,
        generated_sql: 'CREATE TABLE users (id SERIAL PRIMARY KEY, name TEXT, email TEXT UNIQUE);'
      })
      .returning()
      .execute();

    const createdTable = insertResult[0];

    // Test the handler
    const result = await getTableDefinitionById(createdTable.id);

    expect(result).not.toBeNull();
    expect(result!.id).toEqual(createdTable.id);
    expect(result!.name).toEqual('users');
    expect(result!.shorthand_definition).toEqual('id:serial pk, name:text, email:text unique');
    expect(result!.generated_sql).toEqual('CREATE TABLE users (id SERIAL PRIMARY KEY, name TEXT, email TEXT UNIQUE);');
    expect(result!.created_at).toBeInstanceOf(Date);
  });

  it('should return null when ID does not exist', async () => {
    const result = await getTableDefinitionById(999);

    expect(result).toBeNull();
  });

  it('should return correct table when multiple tables exist', async () => {
    // Create multiple test table definitions
    const insertResults = await db.insert(mTableTable)
      .values([
        {
          name: 'users',
          shorthand_definition: 'id:serial pk, name:text',
          generated_sql: 'CREATE TABLE users (id SERIAL PRIMARY KEY, name TEXT);'
        },
        {
          name: 'products',
          shorthand_definition: 'id:serial pk, title:text, price:numeric',
          generated_sql: 'CREATE TABLE products (id SERIAL PRIMARY KEY, title TEXT, price NUMERIC);'
        }
      ])
      .returning()
      .execute();

    const secondTable = insertResults[1];

    // Test retrieving the second table
    const result = await getTableDefinitionById(secondTable.id);

    expect(result).not.toBeNull();
    expect(result!.id).toEqual(secondTable.id);
    expect(result!.name).toEqual('products');
    expect(result!.shorthand_definition).toEqual('id:serial pk, title:text, price:numeric');
    expect(result!.generated_sql).toEqual('CREATE TABLE products (id SERIAL PRIMARY KEY, title TEXT, price NUMERIC);');
  });
});
