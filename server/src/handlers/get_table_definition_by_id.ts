
import { db } from '../db';
import { mTableTable } from '../db/schema';
import { type MTable } from '../schema';
import { eq } from 'drizzle-orm';

export async function getTableDefinitionById(id: number): Promise<MTable | null> {
  try {
    const results = await db.select()
      .from(mTableTable)
      .where(eq(mTableTable.id, id))
      .execute();

    if (results.length === 0) {
      return null;
    }

    return results[0];
  } catch (error) {
    console.error('Get table definition by ID failed:', error);
    throw error;
  }
}
