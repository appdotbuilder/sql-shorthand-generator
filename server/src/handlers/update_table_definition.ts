
import { db } from '../db';
import { mTableTable } from '../db/schema';
import { type UpdateTableDefinitionInput, type MTable } from '../schema';
import { eq } from 'drizzle-orm';

export async function updateTableDefinition(input: UpdateTableDefinitionInput): Promise<MTable | null> {
  try {
    // First, check if the record exists
    const existing = await db.select()
      .from(mTableTable)
      .where(eq(mTableTable.id, input.id))
      .execute();

    if (existing.length === 0) {
      return null;
    }

    // Build update values - only include fields that are provided
    const updateValues: Partial<typeof mTableTable.$inferInsert> = {};
    
    if (input.name !== undefined) {
      updateValues.name = input.name;
    }
    
    if (input.shorthand_definition !== undefined) {
      updateValues.shorthand_definition = input.shorthand_definition;
      // TODO: When shorthand_definition is updated, we should regenerate the SQL
      // For now, we'll use a placeholder SQL generation
      updateValues.generated_sql = `-- Generated SQL for ${input.name || existing[0].name}:\n-- ${input.shorthand_definition}`;
    }

    // Only proceed with update if there are fields to update
    if (Object.keys(updateValues).length === 0) {
      // No updates needed, return existing record
      return existing[0];
    }

    // Update the record
    const result = await db.update(mTableTable)
      .set(updateValues)
      .where(eq(mTableTable.id, input.id))
      .returning()
      .execute();

    return result[0] || null;
  } catch (error) {
    console.error('Table definition update failed:', error);
    throw error;
  }
}
