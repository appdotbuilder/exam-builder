import { db } from '../db';
import { questionsTable } from '../db/schema';
import { eq } from 'drizzle-orm';

export async function deleteQuestion(id: number): Promise<boolean> {
  try {
    // Delete the question - cascade deletes will handle related data
    const result = await db.delete(questionsTable)
      .where(eq(questionsTable.id, id))
      .execute();

    // Return true if at least one row was deleted, false if no question was found
    return (result.rowCount ?? 0) > 0;
  } catch (error) {
    console.error('Question deletion failed:', error);
    throw error;
  }
}