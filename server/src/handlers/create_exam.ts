import { db } from '../db';
import { examsTable } from '../db/schema';
import { type CreateExamInput, type Exam } from '../schema';

export const createExam = async (input: CreateExamInput): Promise<Exam> => {
  try {
    // Insert exam record
    const result = await db.insert(examsTable)
      .values({
        title: input.title,
        description: input.description
      })
      .returning()
      .execute();

    // Return the created exam
    const exam = result[0];
    return {
      id: exam.id,
      title: exam.title,
      description: exam.description,
      created_at: exam.created_at,
      updated_at: exam.updated_at
    };
  } catch (error) {
    console.error('Exam creation failed:', error);
    throw error;
  }
};