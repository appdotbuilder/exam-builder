import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { examsTable, questionsTable, multipleChoiceOptionsTable } from '../db/schema';
import { type CreateMultipleChoiceOptionInput } from '../schema';
import { createMultipleChoiceOption } from '../handlers/create_multiple_choice_option';
import { eq } from 'drizzle-orm';

describe('createMultipleChoiceOption', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  let testExamId: number;
  let testQuestionId: number;
  let testMathQuestionId: number;

  beforeEach(async () => {
    // Create test exam
    const examResult = await db.insert(examsTable)
      .values({
        title: 'Test Exam',
        description: 'Test exam description'
      })
      .returning()
      .execute();
    testExamId = examResult[0].id;

    // Create test multiple choice question
    const questionResult = await db.insert(questionsTable)
      .values({
        exam_id: testExamId,
        type: 'MULTIPLE_CHOICE',
        question_text: 'What is 2 + 2?',
        points: 10,
        order_index: 0
      })
      .returning()
      .execute();
    testQuestionId = questionResult[0].id;

    // Create test mathematics formula question for negative testing
    const mathQuestionResult = await db.insert(questionsTable)
      .values({
        exam_id: testExamId,
        type: 'MATHEMATICS_FORMULA',
        question_text: 'Solve x + 1 = 5',
        points: 15,
        order_index: 1
      })
      .returning()
      .execute();
    testMathQuestionId = mathQuestionResult[0].id;
  });

  const testInput: CreateMultipleChoiceOptionInput = {
    question_id: 0, // Will be set in tests
    option_text: 'Option A',
    is_correct: true,
    order_index: 0
  };

  it('should create a multiple choice option', async () => {
    const input = { ...testInput, question_id: testQuestionId };
    const result = await createMultipleChoiceOption(input);

    // Basic field validation
    expect(result.question_id).toEqual(testQuestionId);
    expect(result.option_text).toEqual('Option A');
    expect(result.is_correct).toEqual(true);
    expect(result.order_index).toEqual(0);
    expect(result.id).toBeDefined();
    expect(typeof result.id).toBe('number');
  });

  it('should save multiple choice option to database', async () => {
    const input = { ...testInput, question_id: testQuestionId };
    const result = await createMultipleChoiceOption(input);

    // Verify in database
    const options = await db.select()
      .from(multipleChoiceOptionsTable)
      .where(eq(multipleChoiceOptionsTable.id, result.id))
      .execute();

    expect(options).toHaveLength(1);
    expect(options[0].question_id).toEqual(testQuestionId);
    expect(options[0].option_text).toEqual('Option A');
    expect(options[0].is_correct).toEqual(true);
    expect(options[0].order_index).toEqual(0);
  });

  it('should create multiple options with different order indices', async () => {
    const option1Input = { ...testInput, question_id: testQuestionId, option_text: 'Option 1', order_index: 0 };
    const option2Input = { ...testInput, question_id: testQuestionId, option_text: 'Option 2', order_index: 1 };
    const option3Input = { ...testInput, question_id: testQuestionId, option_text: 'Option 3', order_index: 2 };

    const result1 = await createMultipleChoiceOption(option1Input);
    const result2 = await createMultipleChoiceOption(option2Input);
    const result3 = await createMultipleChoiceOption(option3Input);

    // Verify all options were created with correct order
    expect(result1.order_index).toEqual(0);
    expect(result2.order_index).toEqual(1);
    expect(result3.order_index).toEqual(2);

    // Verify in database
    const options = await db.select()
      .from(multipleChoiceOptionsTable)
      .where(eq(multipleChoiceOptionsTable.question_id, testQuestionId))
      .execute();

    expect(options).toHaveLength(3);
    expect(options.map(o => o.option_text).sort()).toEqual(['Option 1', 'Option 2', 'Option 3']);
  });

  it('should create options with correct and incorrect answers', async () => {
    const correctOption = { ...testInput, question_id: testQuestionId, option_text: 'Correct Answer', is_correct: true };
    const incorrectOption = { ...testInput, question_id: testQuestionId, option_text: 'Wrong Answer', is_correct: false };

    const result1 = await createMultipleChoiceOption(correctOption);
    const result2 = await createMultipleChoiceOption(incorrectOption);

    expect(result1.is_correct).toEqual(true);
    expect(result2.is_correct).toEqual(false);
  });

  it('should throw error when question does not exist', async () => {
    const input = { ...testInput, question_id: 99999 };

    await expect(createMultipleChoiceOption(input)).rejects.toThrow(/Question with ID 99999 not found/i);
  });

  it('should throw error when question is not multiple choice type', async () => {
    const input = { ...testInput, question_id: testMathQuestionId };

    await expect(createMultipleChoiceOption(input)).rejects.toThrow(/is not a multiple choice question/i);
  });

  it('should handle foreign key constraint properly', async () => {
    // Verify the question exists first
    const questions = await db.select()
      .from(questionsTable)
      .where(eq(questionsTable.id, testQuestionId))
      .execute();

    expect(questions).toHaveLength(1);
    expect(questions[0].type).toEqual('MULTIPLE_CHOICE');

    // Create option should succeed
    const input = { ...testInput, question_id: testQuestionId };
    const result = await createMultipleChoiceOption(input);
    expect(result.question_id).toEqual(testQuestionId);
  });
});