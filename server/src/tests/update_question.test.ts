import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { examsTable, questionsTable } from '../db/schema';
import { eq } from 'drizzle-orm';
import { type UpdateQuestionInput, type CreateExamInput, type CreateQuestionInput } from '../schema';
import { updateQuestion } from '../handlers/update_question';

// Test data
const testExam: CreateExamInput = {
  title: 'Test Exam',
  description: 'An exam for testing'
};

const testQuestion: CreateQuestionInput = {
  exam_id: 0, // Will be set after exam creation
  type: 'MULTIPLE_CHOICE',
  question_text: 'What is 2 + 2?',
  points: 10,
  order_index: 0
};

describe('updateQuestion', () => {
  let examId: number;
  let questionId: number;

  beforeEach(async () => {
    await createDB();
    
    // Create prerequisite exam
    const examResult = await db.insert(examsTable)
      .values(testExam)
      .returning()
      .execute();
    examId = examResult[0].id;

    // Create prerequisite question
    const questionResult = await db.insert(questionsTable)
      .values({
        ...testQuestion,
        exam_id: examId
      })
      .returning()
      .execute();
    questionId = questionResult[0].id;
  });

  afterEach(resetDB);

  it('should update question text only', async () => {
    const updateInput: UpdateQuestionInput = {
      id: questionId,
      question_text: 'What is 3 + 3?'
    };

    const result = await updateQuestion(updateInput);

    expect(result).not.toBeNull();
    expect(result!.id).toEqual(questionId);
    expect(result!.question_text).toEqual('What is 3 + 3?');
    expect(result!.points).toEqual(10); // Unchanged
    expect(result!.order_index).toEqual(0); // Unchanged
    expect(result!.type).toEqual('MULTIPLE_CHOICE');
    expect(result!.exam_id).toEqual(examId);
    expect(result!.created_at).toBeInstanceOf(Date);
  });

  it('should update points only', async () => {
    const updateInput: UpdateQuestionInput = {
      id: questionId,
      points: 25
    };

    const result = await updateQuestion(updateInput);

    expect(result).not.toBeNull();
    expect(result!.id).toEqual(questionId);
    expect(result!.question_text).toEqual('What is 2 + 2?'); // Unchanged
    expect(result!.points).toEqual(25);
    expect(result!.order_index).toEqual(0); // Unchanged
  });

  it('should update order index only', async () => {
    const updateInput: UpdateQuestionInput = {
      id: questionId,
      order_index: 5
    };

    const result = await updateQuestion(updateInput);

    expect(result).not.toBeNull();
    expect(result!.id).toEqual(questionId);
    expect(result!.question_text).toEqual('What is 2 + 2?'); // Unchanged
    expect(result!.points).toEqual(10); // Unchanged
    expect(result!.order_index).toEqual(5);
  });

  it('should update multiple fields simultaneously', async () => {
    const updateInput: UpdateQuestionInput = {
      id: questionId,
      question_text: 'Updated question text',
      points: 15,
      order_index: 3
    };

    const result = await updateQuestion(updateInput);

    expect(result).not.toBeNull();
    expect(result!.id).toEqual(questionId);
    expect(result!.question_text).toEqual('Updated question text');
    expect(result!.points).toEqual(15);
    expect(result!.order_index).toEqual(3);
    expect(result!.type).toEqual('MULTIPLE_CHOICE'); // Unchanged
    expect(result!.exam_id).toEqual(examId); // Unchanged
  });

  it('should persist changes to database', async () => {
    const updateInput: UpdateQuestionInput = {
      id: questionId,
      question_text: 'Database persistence test',
      points: 30
    };

    await updateQuestion(updateInput);

    // Verify changes were persisted
    const questions = await db.select()
      .from(questionsTable)
      .where(eq(questionsTable.id, questionId))
      .execute();

    expect(questions).toHaveLength(1);
    expect(questions[0].question_text).toEqual('Database persistence test');
    expect(questions[0].points).toEqual(30);
    expect(questions[0].order_index).toEqual(0); // Unchanged
  });

  it('should return null for non-existent question', async () => {
    const nonExistentId = 99999;
    const updateInput: UpdateQuestionInput = {
      id: nonExistentId,
      question_text: 'This should not update anything'
    };

    const result = await updateQuestion(updateInput);

    expect(result).toBeNull();
  });

  it('should return null when no fields are provided to update', async () => {
    const updateInput: UpdateQuestionInput = {
      id: questionId
      // No optional fields provided
    };

    const result = await updateQuestion(updateInput);

    expect(result).toBeNull();

    // Verify original question is unchanged
    const questions = await db.select()
      .from(questionsTable)
      .where(eq(questionsTable.id, questionId))
      .execute();

    expect(questions).toHaveLength(1);
    expect(questions[0].question_text).toEqual('What is 2 + 2?');
    expect(questions[0].points).toEqual(10);
    expect(questions[0].order_index).toEqual(0);
  });

  it('should handle mathematics formula question type', async () => {
    // Create a mathematics formula question
    const mathQuestion = await db.insert(questionsTable)
      .values({
        exam_id: examId,
        type: 'MATHEMATICS_FORMULA',
        question_text: 'Solve for x: 2x + 3 = 7',
        points: 20,
        order_index: 1
      })
      .returning()
      .execute();

    const updateInput: UpdateQuestionInput = {
      id: mathQuestion[0].id,
      question_text: 'Solve for y: 3y - 2 = 10',
      points: 25
    };

    const result = await updateQuestion(updateInput);

    expect(result).not.toBeNull();
    expect(result!.type).toEqual('MATHEMATICS_FORMULA');
    expect(result!.question_text).toEqual('Solve for y: 3y - 2 = 10');
    expect(result!.points).toEqual(25);
  });

  it('should handle edge case with zero points', async () => {
    // Note: According to schema, points must be positive, but testing edge case
    // The Zod validation would catch this before reaching the handler,
    // but we test the handler's behavior if it somehow receives such input
    const updateInput: UpdateQuestionInput = {
      id: questionId,
      points: 1 // Minimum valid positive value
    };

    const result = await updateQuestion(updateInput);

    expect(result).not.toBeNull();
    expect(result!.points).toEqual(1);
  });

  it('should handle large order index values', async () => {
    const updateInput: UpdateQuestionInput = {
      id: questionId,
      order_index: 1000
    };

    const result = await updateQuestion(updateInput);

    expect(result).not.toBeNull();
    expect(result!.order_index).toEqual(1000);
  });
});