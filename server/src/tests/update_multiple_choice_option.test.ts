import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { examsTable, questionsTable, multipleChoiceOptionsTable } from '../db/schema';
import { eq } from 'drizzle-orm';
import { type UpdateMultipleChoiceOptionInput } from '../schema';
import { updateMultipleChoiceOption } from '../handlers/update_multiple_choice_option';

describe('updateMultipleChoiceOption', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  let examId: number;
  let questionId: number;
  let optionId: number;

  beforeEach(async () => {
    // Create exam first
    const examResult = await db.insert(examsTable)
      .values({
        title: 'Test Exam',
        description: 'Test exam description'
      })
      .returning()
      .execute();
    
    examId = examResult[0].id;

    // Create question
    const questionResult = await db.insert(questionsTable)
      .values({
        exam_id: examId,
        type: 'MULTIPLE_CHOICE',
        question_text: 'What is 2 + 2?',
        points: 10,
        order_index: 1
      })
      .returning()
      .execute();
    
    questionId = questionResult[0].id;

    // Create multiple choice option
    const optionResult = await db.insert(multipleChoiceOptionsTable)
      .values({
        question_id: questionId,
        option_text: 'Four',
        is_correct: true,
        order_index: 0
      })
      .returning()
      .execute();
    
    optionId = optionResult[0].id;
  });

  it('should update option text only', async () => {
    const input: UpdateMultipleChoiceOptionInput = {
      id: optionId,
      option_text: 'Updated Option Text'
    };

    const result = await updateMultipleChoiceOption(input);

    expect(result).not.toBeNull();
    expect(result!.id).toBe(optionId);
    expect(result!.option_text).toBe('Updated Option Text');
    expect(result!.is_correct).toBe(true); // Unchanged
    expect(result!.order_index).toBe(0); // Unchanged
    expect(result!.question_id).toBe(questionId);
  });

  it('should update is_correct flag only', async () => {
    const input: UpdateMultipleChoiceOptionInput = {
      id: optionId,
      is_correct: false
    };

    const result = await updateMultipleChoiceOption(input);

    expect(result).not.toBeNull();
    expect(result!.id).toBe(optionId);
    expect(result!.option_text).toBe('Four'); // Unchanged
    expect(result!.is_correct).toBe(false); // Updated
    expect(result!.order_index).toBe(0); // Unchanged
  });

  it('should update order_index only', async () => {
    const input: UpdateMultipleChoiceOptionInput = {
      id: optionId,
      order_index: 5
    };

    const result = await updateMultipleChoiceOption(input);

    expect(result).not.toBeNull();
    expect(result!.id).toBe(optionId);
    expect(result!.option_text).toBe('Four'); // Unchanged
    expect(result!.is_correct).toBe(true); // Unchanged
    expect(result!.order_index).toBe(5); // Updated
  });

  it('should update multiple fields at once', async () => {
    const input: UpdateMultipleChoiceOptionInput = {
      id: optionId,
      option_text: 'New Answer',
      is_correct: false,
      order_index: 3
    };

    const result = await updateMultipleChoiceOption(input);

    expect(result).not.toBeNull();
    expect(result!.id).toBe(optionId);
    expect(result!.option_text).toBe('New Answer');
    expect(result!.is_correct).toBe(false);
    expect(result!.order_index).toBe(3);
    expect(result!.question_id).toBe(questionId);
  });

  it('should save changes to database', async () => {
    const input: UpdateMultipleChoiceOptionInput = {
      id: optionId,
      option_text: 'Database Test Answer',
      is_correct: false
    };

    await updateMultipleChoiceOption(input);

    // Verify changes were saved
    const savedOptions = await db.select()
      .from(multipleChoiceOptionsTable)
      .where(eq(multipleChoiceOptionsTable.id, optionId))
      .execute();

    expect(savedOptions).toHaveLength(1);
    expect(savedOptions[0].option_text).toBe('Database Test Answer');
    expect(savedOptions[0].is_correct).toBe(false);
    expect(savedOptions[0].order_index).toBe(0); // Unchanged
  });

  it('should return null when option does not exist', async () => {
    const input: UpdateMultipleChoiceOptionInput = {
      id: 99999, // Non-existent ID
      option_text: 'This will not work'
    };

    const result = await updateMultipleChoiceOption(input);

    expect(result).toBeNull();
  });

  it('should return null when no fields are provided to update', async () => {
    const input: UpdateMultipleChoiceOptionInput = {
      id: optionId
      // No update fields provided
    };

    const result = await updateMultipleChoiceOption(input);

    expect(result).toBeNull();
  });

  it('should handle empty string option_text update', async () => {
    const input: UpdateMultipleChoiceOptionInput = {
      id: optionId,
      option_text: ''
    };

    // This should throw due to Zod validation, but if it passes validation,
    // the handler should process it
    const result = await updateMultipleChoiceOption(input);

    expect(result).not.toBeNull();
    expect(result!.option_text).toBe('');
  });

  it('should handle boolean false correctly for is_correct', async () => {
    const input: UpdateMultipleChoiceOptionInput = {
      id: optionId,
      is_correct: false
    };

    const result = await updateMultipleChoiceOption(input);

    expect(result).not.toBeNull();
    expect(result!.is_correct).toBe(false);
    expect(typeof result!.is_correct).toBe('boolean');
  });

  it('should handle zero as valid order_index', async () => {
    const input: UpdateMultipleChoiceOptionInput = {
      id: optionId,
      order_index: 0
    };

    const result = await updateMultipleChoiceOption(input);

    expect(result).not.toBeNull();
    expect(result!.order_index).toBe(0);
    expect(typeof result!.order_index).toBe('number');
  });
});