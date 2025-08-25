import { db } from '../db';
import { mathematicsFormulaAnswersTable } from '../db/schema';
import { eq } from 'drizzle-orm';

export async function deleteMathematicsFormulaAnswer(id: number): Promise<boolean> {
  try {
    // Delete the mathematics formula answer
    const result = await db.delete(mathematicsFormulaAnswersTable)
      .where(eq(mathematicsFormulaAnswersTable.id, id))
      .returning()
      .execute();

    // Return true if a record was deleted, false if no record was found
    return result.length > 0;
  } catch (error) {
    console.error('Mathematics formula answer deletion failed:', error);
    throw error;
  }
}