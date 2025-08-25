import { db } from '../db';
import { examsTable } from '../db/schema';
import { eq } from 'drizzle-orm';

export async function deleteExam(id: number): Promise<boolean> {
  try {
    // Delete the exam - cascade deletes will automatically remove:
    // - questions (via foreign key constraint)
    // - multiple choice options (via foreign key constraint)
    // - mathematics formula answers (via foreign key constraint)
    const result = await db.delete(examsTable)
      .where(eq(examsTable.id, id))
      .returning()
      .execute();

    // Return true if an exam was deleted, false if no exam was found
    return result.length > 0;
  } catch (error) {
    console.error('Exam deletion failed:', error);
    throw error;
  }
}