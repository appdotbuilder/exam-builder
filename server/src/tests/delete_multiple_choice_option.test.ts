import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { examsTable, questionsTable, multipleChoiceOptionsTable } from '../db/schema';
import { deleteMultipleChoiceOption } from '../handlers/delete_multiple_choice_option';
import { eq } from 'drizzle-orm';

describe('deleteMultipleChoiceOption', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  it('should delete an existing multiple choice option', async () => {
    // Create test exam
    const examResult = await db.insert(examsTable)
      .values({
        title: 'Test Exam',
        description: 'Test Description'
      })
      .returning()
      .execute();

    // Create test question
    const questionResult = await db.insert(questionsTable)
      .values({
        exam_id: examResult[0].id,
        type: 'MULTIPLE_CHOICE',
        question_text: 'Test question?',
        points: 10,
        order_index: 0
      })
      .returning()
      .execute();

    // Create test multiple choice option
    const optionResult = await db.insert(multipleChoiceOptionsTable)
      .values({
        question_id: questionResult[0].id,
        option_text: 'Option A',
        is_correct: true,
        order_index: 0
      })
      .returning()
      .execute();

    const optionId = optionResult[0].id;

    // Delete the option
    const result = await deleteMultipleChoiceOption(optionId);

    // Should return true indicating successful deletion
    expect(result).toBe(true);

    // Verify option was deleted from database
    const remainingOptions = await db.select()
      .from(multipleChoiceOptionsTable)
      .where(eq(multipleChoiceOptionsTable.id, optionId))
      .execute();

    expect(remainingOptions).toHaveLength(0);
  });

  it('should return false when deleting non-existent option', async () => {
    const nonExistentId = 99999;

    const result = await deleteMultipleChoiceOption(nonExistentId);

    // Should return false for non-existent option
    expect(result).toBe(false);
  });

  it('should not affect other options when deleting one', async () => {
    // Create test exam
    const examResult = await db.insert(examsTable)
      .values({
        title: 'Test Exam',
        description: 'Test Description'
      })
      .returning()
      .execute();

    // Create test question
    const questionResult = await db.insert(questionsTable)
      .values({
        exam_id: examResult[0].id,
        type: 'MULTIPLE_CHOICE',
        question_text: 'Test question?',
        points: 10,
        order_index: 0
      })
      .returning()
      .execute();

    // Create multiple test options
    const option1Result = await db.insert(multipleChoiceOptionsTable)
      .values({
        question_id: questionResult[0].id,
        option_text: 'Option A',
        is_correct: true,
        order_index: 0
      })
      .returning()
      .execute();

    const option2Result = await db.insert(multipleChoiceOptionsTable)
      .values({
        question_id: questionResult[0].id,
        option_text: 'Option B',
        is_correct: false,
        order_index: 1
      })
      .returning()
      .execute();

    const option1Id = option1Result[0].id;
    const option2Id = option2Result[0].id;

    // Delete the first option
    const result = await deleteMultipleChoiceOption(option1Id);

    expect(result).toBe(true);

    // Verify first option was deleted
    const deletedOptions = await db.select()
      .from(multipleChoiceOptionsTable)
      .where(eq(multipleChoiceOptionsTable.id, option1Id))
      .execute();

    expect(deletedOptions).toHaveLength(0);

    // Verify second option still exists
    const remainingOptions = await db.select()
      .from(multipleChoiceOptionsTable)
      .where(eq(multipleChoiceOptionsTable.id, option2Id))
      .execute();

    expect(remainingOptions).toHaveLength(1);
    expect(remainingOptions[0].option_text).toEqual('Option B');
  });

  it('should handle deletion of option with various data types', async () => {
    // Create test exam
    const examResult = await db.insert(examsTable)
      .values({
        title: 'Test Exam',
        description: 'Test Description'
      })
      .returning()
      .execute();

    // Create test question
    const questionResult = await db.insert(questionsTable)
      .values({
        exam_id: examResult[0].id,
        type: 'MULTIPLE_CHOICE',
        question_text: 'Test question with special characters: @#$%?',
        points: 5,
        order_index: 0
      })
      .returning()
      .execute();

    // Create option with special characters and edge case values
    const optionResult = await db.insert(multipleChoiceOptionsTable)
      .values({
        question_id: questionResult[0].id,
        option_text: 'Complex option with "quotes" and \'apostrophes\'',
        is_correct: false,
        order_index: 100 // High order index
      })
      .returning()
      .execute();

    const optionId = optionResult[0].id;

    // Delete the option
    const result = await deleteMultipleChoiceOption(optionId);

    expect(result).toBe(true);

    // Verify deletion
    const remainingOptions = await db.select()
      .from(multipleChoiceOptionsTable)
      .where(eq(multipleChoiceOptionsTable.id, optionId))
      .execute();

    expect(remainingOptions).toHaveLength(0);
  });
});