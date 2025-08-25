import { db } from '../db';
import { questionsTable, mathematicsFormulaAnswersTable } from '../db/schema';
import { type CreateMathematicsFormulaAnswerInput, type MathematicsFormulaAnswer } from '../schema';
import { eq } from 'drizzle-orm';

export const createMathematicsFormulaAnswer = async (input: CreateMathematicsFormulaAnswerInput): Promise<MathematicsFormulaAnswer> => {
  try {
    // Verify that the question exists and is of type MATHEMATICS_FORMULA
    const question = await db.select()
      .from(questionsTable)
      .where(eq(questionsTable.id, input.question_id))
      .execute();

    if (question.length === 0) {
      throw new Error(`Question with id ${input.question_id} not found`);
    }

    if (question[0].type !== 'MATHEMATICS_FORMULA') {
      throw new Error(`Question with id ${input.question_id} is not a MATHEMATICS_FORMULA question`);
    }

    // Check if a formula answer already exists for this question
    const existingAnswer = await db.select()
      .from(mathematicsFormulaAnswersTable)
      .where(eq(mathematicsFormulaAnswersTable.question_id, input.question_id))
      .execute();

    if (existingAnswer.length > 0) {
      throw new Error(`Mathematics formula answer already exists for question ${input.question_id}`);
    }

    // Insert the mathematics formula answer
    const result = await db.insert(mathematicsFormulaAnswersTable)
      .values({
        question_id: input.question_id,
        expected_answer: input.expected_answer
      })
      .returning()
      .execute();

    return result[0];
  } catch (error) {
    console.error('Mathematics formula answer creation failed:', error);
    throw error;
  }
};