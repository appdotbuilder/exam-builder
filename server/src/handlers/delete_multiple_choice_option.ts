import { db } from '../db';
import { multipleChoiceOptionsTable } from '../db/schema';
import { eq } from 'drizzle-orm';

export async function deleteMultipleChoiceOption(id: number): Promise<boolean> {
  try {
    // Check if the option exists and delete it
    const result = await db.delete(multipleChoiceOptionsTable)
      .where(eq(multipleChoiceOptionsTable.id, id))
      .returning()
      .execute();

    // Return true if a record was deleted, false if no record was found
    return result.length > 0;
  } catch (error) {
    console.error('Multiple choice option deletion failed:', error);
    throw error;
  }
}