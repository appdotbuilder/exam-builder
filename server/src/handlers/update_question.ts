import { db } from '../db';
import { questionsTable } from '../db/schema';
import { eq } from 'drizzle-orm';
import { type UpdateQuestionInput, type Question } from '../schema';

export async function updateQuestion(input: UpdateQuestionInput): Promise<Question | null> {
  try {
    // Build update object with only provided fields
    const updateData: Partial<{
      question_text: string;
      points: number;
      order_index: number;
    }> = {};

    if (input.question_text !== undefined) {
      updateData.question_text = input.question_text;
    }

    if (input.points !== undefined) {
      updateData.points = input.points;
    }

    if (input.order_index !== undefined) {
      updateData.order_index = input.order_index;
    }

    // If no fields to update, return null
    if (Object.keys(updateData).length === 0) {
      return null;
    }

    // Update the question and return the updated record
    const result = await db.update(questionsTable)
      .set(updateData)
      .where(eq(questionsTable.id, input.id))
      .returning()
      .execute();

    // Return null if no question was found/updated
    if (result.length === 0) {
      return null;
    }

    return result[0];
  } catch (error) {
    console.error('Question update failed:', error);
    throw error;
  }
}