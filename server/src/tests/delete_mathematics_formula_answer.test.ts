import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { examsTable, questionsTable, mathematicsFormulaAnswersTable } from '../db/schema';
import { deleteMathematicsFormulaAnswer } from '../handlers/delete_mathematics_formula_answer';
import { eq } from 'drizzle-orm';

describe('deleteMathematicsFormulaAnswer', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  it('should delete an existing mathematics formula answer', async () => {
    // Create prerequisite data
    const [exam] = await db.insert(examsTable)
      .values({
        title: 'Test Exam',
        description: 'Test Description'
      })
      .returning()
      .execute();

    const [question] = await db.insert(questionsTable)
      .values({
        exam_id: exam.id,
        type: 'MATHEMATICS_FORMULA',
        question_text: 'What is 2 + 2?',
        points: 10,
        order_index: 0
      })
      .returning()
      .execute();

    const [answer] = await db.insert(mathematicsFormulaAnswersTable)
      .values({
        question_id: question.id,
        expected_answer: '4'
      })
      .returning()
      .execute();

    // Delete the answer
    const result = await deleteMathematicsFormulaAnswer(answer.id);

    // Verify deletion was successful
    expect(result).toBe(true);

    // Verify answer no longer exists in database
    const answers = await db.select()
      .from(mathematicsFormulaAnswersTable)
      .where(eq(mathematicsFormulaAnswersTable.id, answer.id))
      .execute();

    expect(answers).toHaveLength(0);
  });

  it('should return false when trying to delete non-existent answer', async () => {
    // Try to delete answer with non-existent ID
    const result = await deleteMathematicsFormulaAnswer(999);

    // Should return false since answer doesn't exist
    expect(result).toBe(false);
  });

  it('should not affect other mathematics formula answers when deleting one', async () => {
    // Create prerequisite data
    const [exam] = await db.insert(examsTable)
      .values({
        title: 'Test Exam',
        description: 'Test Description'
      })
      .returning()
      .execute();

    const [question1] = await db.insert(questionsTable)
      .values({
        exam_id: exam.id,
        type: 'MATHEMATICS_FORMULA',
        question_text: 'What is 2 + 2?',
        points: 10,
        order_index: 0
      })
      .returning()
      .execute();

    const [question2] = await db.insert(questionsTable)
      .values({
        exam_id: exam.id,
        type: 'MATHEMATICS_FORMULA',
        question_text: 'What is 5 * 3?',
        points: 15,
        order_index: 1
      })
      .returning()
      .execute();

    // Create two mathematics formula answers
    const [answer1] = await db.insert(mathematicsFormulaAnswersTable)
      .values({
        question_id: question1.id,
        expected_answer: '4'
      })
      .returning()
      .execute();

    const [answer2] = await db.insert(mathematicsFormulaAnswersTable)
      .values({
        question_id: question2.id,
        expected_answer: '15'
      })
      .returning()
      .execute();

    // Delete first answer
    const result = await deleteMathematicsFormulaAnswer(answer1.id);

    // Verify deletion was successful
    expect(result).toBe(true);

    // Verify first answer is deleted
    const deletedAnswers = await db.select()
      .from(mathematicsFormulaAnswersTable)
      .where(eq(mathematicsFormulaAnswersTable.id, answer1.id))
      .execute();

    expect(deletedAnswers).toHaveLength(0);

    // Verify second answer still exists
    const remainingAnswers = await db.select()
      .from(mathematicsFormulaAnswersTable)
      .where(eq(mathematicsFormulaAnswersTable.id, answer2.id))
      .execute();

    expect(remainingAnswers).toHaveLength(1);
    expect(remainingAnswers[0].expected_answer).toEqual('15');
    expect(remainingAnswers[0].question_id).toEqual(question2.id);
  });

  it('should handle deletion of answer with complex formula', async () => {
    // Create prerequisite data
    const [exam] = await db.insert(examsTable)
      .values({
        title: 'Advanced Math Exam',
        description: 'Complex formulas test'
      })
      .returning()
      .execute();

    const [question] = await db.insert(questionsTable)
      .values({
        exam_id: exam.id,
        type: 'MATHEMATICS_FORMULA',
        question_text: 'Solve quadratic equation',
        points: 25,
        order_index: 0
      })
      .returning()
      .execute();

    const [answer] = await db.insert(mathematicsFormulaAnswersTable)
      .values({
        question_id: question.id,
        expected_answer: 'x = (-b ± √(b² - 4ac)) / 2a'
      })
      .returning()
      .execute();

    // Delete the complex formula answer
    const result = await deleteMathematicsFormulaAnswer(answer.id);

    // Verify deletion was successful
    expect(result).toBe(true);

    // Verify answer no longer exists
    const answers = await db.select()
      .from(mathematicsFormulaAnswersTable)
      .where(eq(mathematicsFormulaAnswersTable.id, answer.id))
      .execute();

    expect(answers).toHaveLength(0);
  });
});