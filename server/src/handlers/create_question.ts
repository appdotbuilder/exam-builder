import { db } from '../db';
import { questionsTable, examsTable } from '../db/schema';
import { type CreateQuestionInput, type Question } from '../schema';
import { eq } from 'drizzle-orm';

export async function createQuestion(input: CreateQuestionInput): Promise<Question> {
  try {
    // Validate that the exam exists
    const exam = await db.select()
      .from(examsTable)
      .where(eq(examsTable.id, input.exam_id))
      .execute();

    if (exam.length === 0) {
      throw new Error(`Exam with id ${input.exam_id} does not exist`);
    }

    // Insert the question
    const result = await db.insert(questionsTable)
      .values({
        exam_id: input.exam_id,
        type: input.type,
        question_text: input.question_text,
        points: input.points,
        order_index: input.order_index
      })
      .returning()
      .execute();

    return result[0];
  } catch (error) {
    console.error('Question creation failed:', error);
    throw error;
  }
}