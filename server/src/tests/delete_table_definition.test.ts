
import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { mTableTable } from '../db/schema';
import { deleteTableDefinition } from '../handlers/delete_table_definition';
import { eq } from 'drizzle-orm';

describe('deleteTableDefinition', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  it('should delete an existing table definition', async () => {
    // Create a test record first
    const testRecord = await db.insert(mTableTable)
      .values({
        name: 'test_table',
        shorthand_definition: 'id:pk, name:str, email:str',
        generated_sql: 'CREATE TABLE test_table (id SERIAL PRIMARY KEY, name TEXT, email TEXT);'
      })
      .returning()
      .execute();

    const recordId = testRecord[0].id;

    // Delete the record
    const result = await deleteTableDefinition(recordId);

    // Verify the returned data matches the deleted record
    expect(result).not.toBeNull();
    expect(result!.id).toEqual(recordId);
    expect(result!.name).toEqual('test_table');
    expect(result!.shorthand_definition).toEqual('id:pk, name:str, email:str');
    expect(result!.generated_sql).toEqual('CREATE TABLE test_table (id SERIAL PRIMARY KEY, name TEXT, email TEXT);');
    expect(result!.created_at).toBeInstanceOf(Date);
  });

  it('should remove record from database', async () => {
    // Create a test record first
    const testRecord = await db.insert(mTableTable)
      .values({
        name: 'test_table',
        shorthand_definition: 'id:pk, name:str',
        generated_sql: 'CREATE TABLE test_table (id SERIAL PRIMARY KEY, name TEXT);'
      })
      .returning()
      .execute();

    const recordId = testRecord[0].id;

    // Delete the record
    await deleteTableDefinition(recordId);

    // Verify record is actually deleted from database
    const remainingRecords = await db.select()
      .from(mTableTable)
      .where(eq(mTableTable.id, recordId))
      .execute();

    expect(remainingRecords).toHaveLength(0);
  });

  it('should return null for non-existent record', async () => {
    const nonExistentId = 99999;

    const result = await deleteTableDefinition(nonExistentId);

    expect(result).toBeNull();
  });

  it('should not affect other records when deleting', async () => {
    // Create two test records
    const testRecord1 = await db.insert(mTableTable)
      .values({
        name: 'table_one',
        shorthand_definition: 'id:pk, name:str',
        generated_sql: 'CREATE TABLE table_one (id SERIAL PRIMARY KEY, name TEXT);'
      })
      .returning()
      .execute();

    const testRecord2 = await db.insert(mTableTable)
      .values({
        name: 'table_two',
        shorthand_definition: 'id:pk, email:str',
        generated_sql: 'CREATE TABLE table_two (id SERIAL PRIMARY KEY, email TEXT);'
      })
      .returning()
      .execute();

    // Delete only the first record
    await deleteTableDefinition(testRecord1[0].id);

    // Verify the second record still exists
    const remainingRecords = await db.select()
      .from(mTableTable)
      .where(eq(mTableTable.id, testRecord2[0].id))
      .execute();

    expect(remainingRecords).toHaveLength(1);
    expect(remainingRecords[0].name).toEqual('table_two');
  });
});
