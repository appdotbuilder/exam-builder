import { db } from '../db';
import { examsTable } from '../db/schema';
import { type UpdateExamInput, type Exam } from '../schema';
import { eq } from 'drizzle-orm';

export const updateExam = async (input: UpdateExamInput): Promise<Exam | null> => {
  try {
    // Build the update object with only the fields that are provided
    const updateData: any = {
      updated_at: new Date() // Always update the timestamp
    };

    // Only include fields that are provided in the input
    if (input.title !== undefined) {
      updateData.title = input.title;
    }

    if (input.description !== undefined) {
      updateData.description = input.description;
    }

    // Update the exam record
    const result = await db.update(examsTable)
      .set(updateData)
      .where(eq(examsTable.id, input.id))
      .returning()
      .execute();

    // Return the updated exam or null if not found
    return result.length > 0 ? result[0] : null;
  } catch (error) {
    console.error('Exam update failed:', error);
    throw error;
  }
};