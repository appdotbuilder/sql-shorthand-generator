
import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { mTableTable } from '../db/schema';
import { type UpdateTableDefinitionInput } from '../schema';
import { updateTableDefinition } from '../handlers/update_table_definition';
import { eq } from 'drizzle-orm';

describe('updateTableDefinition', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  let testRecordId: number;

  beforeEach(async () => {
    // Create a test record to update
    const result = await db.insert(mTableTable)
      .values({
        name: 'original_table',
        shorthand_definition: 'id:int, name:string',
        generated_sql: 'CREATE TABLE original_table (id INT, name VARCHAR(255));'
      })
      .returning()
      .execute();
    
    testRecordId = result[0].id;
  });

  it('should update table name only', async () => {
    const input: UpdateTableDefinitionInput = {
      id: testRecordId,
      name: 'updated_table'
    };

    const result = await updateTableDefinition(input);

    expect(result).not.toBeNull();
    expect(result!.id).toEqual(testRecordId);
    expect(result!.name).toEqual('updated_table');
    expect(result!.shorthand_definition).toEqual('id:int, name:string'); // Should remain unchanged
    expect(result!.generated_sql).toEqual('CREATE TABLE original_table (id INT, name VARCHAR(255));'); // Should remain unchanged
    expect(result!.created_at).toBeInstanceOf(Date);
  });

  it('should update shorthand definition and regenerate SQL', async () => {
    const input: UpdateTableDefinitionInput = {
      id: testRecordId,
      shorthand_definition: 'id:int, email:string, created_at:timestamp'
    };

    const result = await updateTableDefinition(input);

    expect(result).not.toBeNull();
    expect(result!.id).toEqual(testRecordId);
    expect(result!.name).toEqual('original_table'); // Should remain unchanged
    expect(result!.shorthand_definition).toEqual('id:int, email:string, created_at:timestamp');
    expect(result!.generated_sql).toContain('-- Generated SQL for original_table');
    expect(result!.generated_sql).toContain('id:int, email:string, created_at:timestamp');
  });

  it('should update both name and shorthand definition', async () => {
    const input: UpdateTableDefinitionInput = {
      id: testRecordId,
      name: 'users_table',
      shorthand_definition: 'id:int, username:string, email:string'
    };

    const result = await updateTableDefinition(input);

    expect(result).not.toBeNull();
    expect(result!.id).toEqual(testRecordId);
    expect(result!.name).toEqual('users_table');
    expect(result!.shorthand_definition).toEqual('id:int, username:string, email:string');
    expect(result!.generated_sql).toContain('-- Generated SQL for users_table');
    expect(result!.generated_sql).toContain('id:int, username:string, email:string');
  });

  it('should save updates to database', async () => {
    const input: UpdateTableDefinitionInput = {
      id: testRecordId,
      name: 'products_table',
      shorthand_definition: 'id:int, name:string, price:decimal'
    };

    await updateTableDefinition(input);

    // Verify the record was actually updated in the database
    const updated = await db.select()
      .from(mTableTable)
      .where(eq(mTableTable.id, testRecordId))
      .execute();

    expect(updated).toHaveLength(1);
    expect(updated[0].name).toEqual('products_table');
    expect(updated[0].shorthand_definition).toEqual('id:int, name:string, price:decimal');
    expect(updated[0].generated_sql).toContain('-- Generated SQL for products_table');
  });

  it('should return null for non-existent record', async () => {
    const input: UpdateTableDefinitionInput = {
      id: 99999, // Non-existent ID
      name: 'non_existent_table'
    };

    const result = await updateTableDefinition(input);

    expect(result).toBeNull();
  });

  it('should return existing record when no updates provided', async () => {
    const input: UpdateTableDefinitionInput = {
      id: testRecordId
      // No name or shorthand_definition provided
    };

    const result = await updateTableDefinition(input);

    expect(result).not.toBeNull();
    expect(result!.id).toEqual(testRecordId);
    expect(result!.name).toEqual('original_table'); // Should remain unchanged
    expect(result!.shorthand_definition).toEqual('id:int, name:string'); // Should remain unchanged
    expect(result!.generated_sql).toEqual('CREATE TABLE original_table (id INT, name VARCHAR(255));'); // Should remain unchanged
  });

  it('should handle partial updates correctly', async () => {
    const input: UpdateTableDefinitionInput = {
      id: testRecordId,
      name: 'partially_updated_table'
      // Only updating name, not shorthand_definition
    };

    const result = await updateTableDefinition(input);

    expect(result).not.toBeNull();
    expect(result!.name).toEqual('partially_updated_table');
    expect(result!.shorthand_definition).toEqual('id:int, name:string'); // Should remain unchanged
    expect(result!.generated_sql).toEqual('CREATE TABLE original_table (id INT, name VARCHAR(255));'); // Should remain unchanged
  });
});
