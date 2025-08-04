
import { db } from '../db';
import { mTableTable } from '../db/schema';
import { eq } from 'drizzle-orm';
import { type MTable } from '../schema';

export const deleteTableDefinition = async (id: number): Promise<MTable | null> => {
  try {
    // First, find the record to return it after deletion
    const existingRecord = await db.select()
      .from(mTableTable)
      .where(eq(mTableTable.id, id))
      .execute();

    if (existingRecord.length === 0) {
      return null;
    }

    // Delete the record
    await db.delete(mTableTable)
      .where(eq(mTableTable.id, id))
      .execute();

    // Return the deleted record
    return existingRecord[0];
  } catch (error) {
    console.error('Table definition deletion failed:', error);
    throw error;
  }
};
