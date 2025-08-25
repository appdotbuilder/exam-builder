import { db } from '../db';
import { examsTable } from '../db/schema';
import { type Exam } from '../schema';

export const getExams = async (): Promise<Exam[]> => {
  try {
    // Fetch all exams from the database without questions for lightweight response
    const results = await db.select()
      .from(examsTable)
      .execute();

    // Return the results as-is since all fields are already correct types
    return results;
  } catch (error) {
    console.error('Failed to fetch exams:', error);
    throw error;
  }
};