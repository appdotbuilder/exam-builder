import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { examsTable, questionsTable, mathematicsFormulaAnswersTable } from '../db/schema';
import { type UpdateMathematicsFormulaAnswerInput } from '../schema';
import { updateMathematicsFormulaAnswer } from '../handlers/update_mathematics_formula_answer';
import { eq } from 'drizzle-orm';

describe('updateMathematicsFormulaAnswer', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  // Helper function to create test data
  const createTestData = async () => {
    // Create exam
    const examResult = await db.insert(examsTable)
      .values({
        title: 'Test Exam',
        description: 'A test exam'
      })
      .returning()
      .execute();
    const exam = examResult[0];

    // Create question
    const questionResult = await db.insert(questionsTable)
      .values({
        exam_id: exam.id,
        type: 'MATHEMATICS_FORMULA',
        question_text: 'Solve for x: 2x + 3 = 7',
        points: 10,
        order_index: 0
      })
      .returning()
      .execute();
    const question = questionResult[0];

    // Create mathematics formula answer
    const answerResult = await db.insert(mathematicsFormulaAnswersTable)
      .values({
        question_id: question.id,
        expected_answer: 'x = 2'
      })
      .returning()
      .execute();
    const answer = answerResult[0];

    return { exam, question, answer };
  };

  it('should update mathematics formula answer', async () => {
    const { answer } = await createTestData();

    const updateInput: UpdateMathematicsFormulaAnswerInput = {
      id: answer.id,
      expected_answer: 'x = 2 (alternative: 2)'
    };

    const result = await updateMathematicsFormulaAnswer(updateInput);

    expect(result).not.toBeNull();
    expect(result!.id).toEqual(answer.id);
    expect(result!.expected_answer).toEqual('x = 2 (alternative: 2)');
    expect(result!.question_id).toEqual(answer.question_id);
  });

  it('should save updated answer to database', async () => {
    const { answer } = await createTestData();

    const updateInput: UpdateMathematicsFormulaAnswerInput = {
      id: answer.id,
      expected_answer: 'x = 2.0'
    };

    await updateMathematicsFormulaAnswer(updateInput);

    // Verify the change was persisted
    const updated = await db.select()
      .from(mathematicsFormulaAnswersTable)
      .where(eq(mathematicsFormulaAnswersTable.id, answer.id))
      .execute();

    expect(updated).toHaveLength(1);
    expect(updated[0].expected_answer).toEqual('x = 2.0');
    expect(updated[0].question_id).toEqual(answer.question_id);
  });

  it('should handle partial updates correctly', async () => {
    const { answer } = await createTestData();

    // Update only the expected answer (all other fields should remain unchanged)
    const updateInput: UpdateMathematicsFormulaAnswerInput = {
      id: answer.id,
      expected_answer: '2'
    };

    const result = await updateMathematicsFormulaAnswer(updateInput);

    expect(result).not.toBeNull();
    expect(result!.id).toEqual(answer.id);
    expect(result!.expected_answer).toEqual('2');
    expect(result!.question_id).toEqual(answer.question_id); // Should remain unchanged
  });

  it('should return null when answer does not exist', async () => {
    const updateInput: UpdateMathematicsFormulaAnswerInput = {
      id: 999999, // Non-existent ID
      expected_answer: 'x = 3'
    };

    const result = await updateMathematicsFormulaAnswer(updateInput);

    expect(result).toBeNull();
  });

  it('should return existing record when no updates provided', async () => {
    const { answer } = await createTestData();

    const updateInput: UpdateMathematicsFormulaAnswerInput = {
      id: answer.id
      // No expected_answer provided
    };

    const result = await updateMathematicsFormulaAnswer(updateInput);

    expect(result).not.toBeNull();
    expect(result!.id).toEqual(answer.id);
    expect(result!.expected_answer).toEqual(answer.expected_answer); // Should remain unchanged
    expect(result!.question_id).toEqual(answer.question_id);
  });

  it('should handle complex formula expressions', async () => {
    const { answer } = await createTestData();

    const updateInput: UpdateMathematicsFormulaAnswerInput = {
      id: answer.id,
      expected_answer: '(x^2 + 3x - 4) / (x + 4) = x - 1'
    };

    const result = await updateMathematicsFormulaAnswer(updateInput);

    expect(result).not.toBeNull();
    expect(result!.expected_answer).toEqual('(x^2 + 3x - 4) / (x + 4) = x - 1');
  });

  it('should handle numerical values as expected answers', async () => {
    const { answer } = await createTestData();

    const updateInput: UpdateMathematicsFormulaAnswerInput = {
      id: answer.id,
      expected_answer: '42.567'
    };

    const result = await updateMathematicsFormulaAnswer(updateInput);

    expect(result).not.toBeNull();
    expect(result!.expected_answer).toEqual('42.567');
  });

  it('should handle empty string updates', async () => {
    const { answer } = await createTestData();

    // The handler doesn't validate input - that's done at the Zod level
    // If an empty string gets through validation, the handler will process it
    const updateInput = {
      id: answer.id,
      expected_answer: ''
    };

    const result = await updateMathematicsFormulaAnswer(updateInput as UpdateMathematicsFormulaAnswerInput);

    expect(result).not.toBeNull();
    expect(result!.id).toEqual(answer.id);
    expect(result!.expected_answer).toEqual('');
    expect(result!.question_id).toEqual(answer.question_id);

    // Verify it was saved to database
    const updated = await db.select()
      .from(mathematicsFormulaAnswersTable)
      .where(eq(mathematicsFormulaAnswersTable.id, answer.id))
      .execute();

    expect(updated[0].expected_answer).toEqual('');
  });
});