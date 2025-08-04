
import { db } from '../db';
import { mTableTable } from '../db/schema';
import { type MTable } from '../schema';

export const getTableDefinitions = async (): Promise<MTable[]> => {
  try {
    const results = await db.select()
      .from(mTableTable)
      .execute();

    return results;
  } catch (error) {
    console.error('Failed to fetch table definitions:', error);
    throw error;
  }
};
