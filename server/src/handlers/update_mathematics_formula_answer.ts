import { db } from '../db';
import { mathematicsFormulaAnswersTable } from '../db/schema';
import { eq } from 'drizzle-orm';
import { type UpdateMathematicsFormulaAnswerInput, type MathematicsFormulaAnswer } from '../schema';

export const updateMathematicsFormulaAnswer = async (input: UpdateMathematicsFormulaAnswerInput): Promise<MathematicsFormulaAnswer | null> => {
  try {
    // First, check if the answer exists
    const existing = await db.select()
      .from(mathematicsFormulaAnswersTable)
      .where(eq(mathematicsFormulaAnswersTable.id, input.id))
      .execute();

    if (existing.length === 0) {
      return null;
    }

    // Prepare update values - only include fields that are provided
    const updateValues: Partial<{
      expected_answer: string;
    }> = {};

    if (input.expected_answer !== undefined) {
      updateValues.expected_answer = input.expected_answer;
    }

    // If no fields to update, return the existing record
    if (Object.keys(updateValues).length === 0) {
      return existing[0];
    }

    // Update the mathematics formula answer
    const result = await db.update(mathematicsFormulaAnswersTable)
      .set(updateValues)
      .where(eq(mathematicsFormulaAnswersTable.id, input.id))
      .returning()
      .execute();

    return result[0];
  } catch (error) {
    console.error('Mathematics formula answer update failed:', error);
    throw error;
  }
};