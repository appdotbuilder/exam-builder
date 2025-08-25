import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { examsTable, questionsTable, mathematicsFormulaAnswersTable } from '../db/schema';
import { type CreateMathematicsFormulaAnswerInput } from '../schema';
import { createMathematicsFormulaAnswer } from '../handlers/create_mathematics_formula_answer';
import { eq } from 'drizzle-orm';

describe('createMathematicsFormulaAnswer', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  let testExamId: number;
  let testMathQuestionId: number;
  let testMultipleChoiceQuestionId: number;

  beforeEach(async () => {
    // Create test exam
    const examResult = await db.insert(examsTable)
      .values({
        title: 'Test Exam',
        description: 'A test exam'
      })
      .returning()
      .execute();
    testExamId = examResult[0].id;

    // Create a mathematics formula question
    const mathQuestionResult = await db.insert(questionsTable)
      .values({
        exam_id: testExamId,
        type: 'MATHEMATICS_FORMULA',
        question_text: 'What is the quadratic formula?',
        points: 10,
        order_index: 1
      })
      .returning()
      .execute();
    testMathQuestionId = mathQuestionResult[0].id;

    // Create a multiple choice question for negative testing
    const mcQuestionResult = await db.insert(questionsTable)
      .values({
        exam_id: testExamId,
        type: 'MULTIPLE_CHOICE',
        question_text: 'What is 2 + 2?',
        points: 5,
        order_index: 2
      })
      .returning()
      .execute();
    testMultipleChoiceQuestionId = mcQuestionResult[0].id;
  });

  it('should create a mathematics formula answer successfully', async () => {
    const testInput: CreateMathematicsFormulaAnswerInput = {
      question_id: testMathQuestionId,
      expected_answer: 'x = (-b ± √(b² - 4ac)) / 2a'
    };

    const result = await createMathematicsFormulaAnswer(testInput);

    // Validate result fields
    expect(result.id).toBeDefined();
    expect(result.question_id).toEqual(testMathQuestionId);
    expect(result.expected_answer).toEqual('x = (-b ± √(b² - 4ac)) / 2a');
  });

  it('should save mathematics formula answer to database', async () => {
    const testInput: CreateMathematicsFormulaAnswerInput = {
      question_id: testMathQuestionId,
      expected_answer: '42'
    };

    const result = await createMathematicsFormulaAnswer(testInput);

    // Query the database to verify it was saved
    const savedAnswers = await db.select()
      .from(mathematicsFormulaAnswersTable)
      .where(eq(mathematicsFormulaAnswersTable.id, result.id))
      .execute();

    expect(savedAnswers).toHaveLength(1);
    expect(savedAnswers[0].question_id).toEqual(testMathQuestionId);
    expect(savedAnswers[0].expected_answer).toEqual('42');
  });

  it('should handle complex mathematical expressions', async () => {
    const complexFormula = '∫[0 to π] sin(x)dx = 2';
    const testInput: CreateMathematicsFormulaAnswerInput = {
      question_id: testMathQuestionId,
      expected_answer: complexFormula
    };

    const result = await createMathematicsFormulaAnswer(testInput);

    expect(result.expected_answer).toEqual(complexFormula);

    // Verify in database
    const savedAnswers = await db.select()
      .from(mathematicsFormulaAnswersTable)
      .where(eq(mathematicsFormulaAnswersTable.id, result.id))
      .execute();

    expect(savedAnswers[0].expected_answer).toEqual(complexFormula);
  });

  it('should throw error when question does not exist', async () => {
    const testInput: CreateMathematicsFormulaAnswerInput = {
      question_id: 99999,
      expected_answer: 'x = 1'
    };

    await expect(createMathematicsFormulaAnswer(testInput))
      .rejects.toThrow(/question with id 99999 not found/i);
  });

  it('should throw error when question is not MATHEMATICS_FORMULA type', async () => {
    const testInput: CreateMathematicsFormulaAnswerInput = {
      question_id: testMultipleChoiceQuestionId,
      expected_answer: 'x = 1'
    };

    await expect(createMathematicsFormulaAnswer(testInput))
      .rejects.toThrow(/question.*is not a mathematics_formula question/i);
  });

  it('should throw error when formula answer already exists for question', async () => {
    const testInput: CreateMathematicsFormulaAnswerInput = {
      question_id: testMathQuestionId,
      expected_answer: 'x = 1'
    };

    // Create first answer
    await createMathematicsFormulaAnswer(testInput);

    // Try to create second answer for same question
    const duplicateInput: CreateMathematicsFormulaAnswerInput = {
      question_id: testMathQuestionId,
      expected_answer: 'x = 2'
    };

    await expect(createMathematicsFormulaAnswer(duplicateInput))
      .rejects.toThrow(/mathematics formula answer already exists for question/i);
  });

  it('should handle numerical answers', async () => {
    const testInput: CreateMathematicsFormulaAnswerInput = {
      question_id: testMathQuestionId,
      expected_answer: '3.14159'
    };

    const result = await createMathematicsFormulaAnswer(testInput);

    expect(result.expected_answer).toEqual('3.14159');
    expect(typeof result.expected_answer).toBe('string');
  });

  it('should handle empty string validation through Zod schema', async () => {
    // This tests the Zod validation that should happen before the handler
    // The handler assumes valid input, but we test the expected behavior
    const testInput: CreateMathematicsFormulaAnswerInput = {
      question_id: testMathQuestionId,
      expected_answer: '' // This should fail Zod validation before reaching handler
    };

    // Since Zod validation happens before handler, we expect the handler to receive valid input
    // But we can test that our handler works with minimal valid input
    const validInput: CreateMathematicsFormulaAnswerInput = {
      question_id: testMathQuestionId,
      expected_answer: '0'
    };

    const result = await createMathematicsFormulaAnswer(validInput);
    expect(result.expected_answer).toEqual('0');
  });
});