import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { 
  examsTable, 
  questionsTable, 
  multipleChoiceOptionsTable,
  mathematicsFormulaAnswersTable
} from '../db/schema';
import { deleteQuestion } from '../handlers/delete_question';
import { eq } from 'drizzle-orm';

describe('deleteQuestion', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  it('should delete a question that exists', async () => {
    // Create an exam first
    const examResult = await db.insert(examsTable)
      .values({
        title: 'Test Exam',
        description: 'Test exam description'
      })
      .returning()
      .execute();

    const examId = examResult[0].id;

    // Create a question
    const questionResult = await db.insert(questionsTable)
      .values({
        exam_id: examId,
        type: 'MULTIPLE_CHOICE',
        question_text: 'What is 2 + 2?',
        points: 5,
        order_index: 1
      })
      .returning()
      .execute();

    const questionId = questionResult[0].id;

    // Delete the question
    const result = await deleteQuestion(questionId);

    expect(result).toBe(true);

    // Verify question was deleted
    const questions = await db.select()
      .from(questionsTable)
      .where(eq(questionsTable.id, questionId))
      .execute();

    expect(questions).toHaveLength(0);
  });

  it('should return false when deleting non-existent question', async () => {
    const nonExistentId = 99999;

    const result = await deleteQuestion(nonExistentId);

    expect(result).toBe(false);
  });

  it('should cascade delete multiple choice options', async () => {
    // Create an exam first
    const examResult = await db.insert(examsTable)
      .values({
        title: 'Test Exam',
        description: 'Test exam description'
      })
      .returning()
      .execute();

    const examId = examResult[0].id;

    // Create a multiple choice question
    const questionResult = await db.insert(questionsTable)
      .values({
        exam_id: examId,
        type: 'MULTIPLE_CHOICE',
        question_text: 'What is the capital of France?',
        points: 10,
        order_index: 1
      })
      .returning()
      .execute();

    const questionId = questionResult[0].id;

    // Create multiple choice options
    await db.insert(multipleChoiceOptionsTable)
      .values([
        {
          question_id: questionId,
          option_text: 'Paris',
          is_correct: true,
          order_index: 1
        },
        {
          question_id: questionId,
          option_text: 'London',
          is_correct: false,
          order_index: 2
        },
        {
          question_id: questionId,
          option_text: 'Berlin',
          is_correct: false,
          order_index: 3
        }
      ])
      .execute();

    // Verify options were created
    const optionsBefore = await db.select()
      .from(multipleChoiceOptionsTable)
      .where(eq(multipleChoiceOptionsTable.question_id, questionId))
      .execute();

    expect(optionsBefore).toHaveLength(3);

    // Delete the question
    const result = await deleteQuestion(questionId);

    expect(result).toBe(true);

    // Verify question was deleted
    const questions = await db.select()
      .from(questionsTable)
      .where(eq(questionsTable.id, questionId))
      .execute();

    expect(questions).toHaveLength(0);

    // Verify options were cascade deleted
    const optionsAfter = await db.select()
      .from(multipleChoiceOptionsTable)
      .where(eq(multipleChoiceOptionsTable.question_id, questionId))
      .execute();

    expect(optionsAfter).toHaveLength(0);
  });

  it('should cascade delete mathematics formula answer', async () => {
    // Create an exam first
    const examResult = await db.insert(examsTable)
      .values({
        title: 'Math Exam',
        description: 'Mathematics test exam'
      })
      .returning()
      .execute();

    const examId = examResult[0].id;

    // Create a mathematics formula question
    const questionResult = await db.insert(questionsTable)
      .values({
        exam_id: examId,
        type: 'MATHEMATICS_FORMULA',
        question_text: 'Calculate the area of a circle with radius 5',
        points: 15,
        order_index: 1
      })
      .returning()
      .execute();

    const questionId = questionResult[0].id;

    // Create mathematics formula answer
    await db.insert(mathematicsFormulaAnswersTable)
      .values({
        question_id: questionId,
        expected_answer: '25π'
      })
      .execute();

    // Verify answer was created
    const answersBefore = await db.select()
      .from(mathematicsFormulaAnswersTable)
      .where(eq(mathematicsFormulaAnswersTable.question_id, questionId))
      .execute();

    expect(answersBefore).toHaveLength(1);

    // Delete the question
    const result = await deleteQuestion(questionId);

    expect(result).toBe(true);

    // Verify question was deleted
    const questions = await db.select()
      .from(questionsTable)
      .where(eq(questionsTable.id, questionId))
      .execute();

    expect(questions).toHaveLength(0);

    // Verify answer was cascade deleted
    const answersAfter = await db.select()
      .from(mathematicsFormulaAnswersTable)
      .where(eq(mathematicsFormulaAnswersTable.question_id, questionId))
      .execute();

    expect(answersAfter).toHaveLength(0);
  });

  it('should delete question with both types of related data', async () => {
    // Create an exam first
    const examResult = await db.insert(examsTable)
      .values({
        title: 'Mixed Exam',
        description: 'Test exam with different question types'
      })
      .returning()
      .execute();

    const examId = examResult[0].id;

    // Create a multiple choice question
    const mcQuestionResult = await db.insert(questionsTable)
      .values({
        exam_id: examId,
        type: 'MULTIPLE_CHOICE',
        question_text: 'Choose the correct answer',
        points: 5,
        order_index: 1
      })
      .returning()
      .execute();

    const mcQuestionId = mcQuestionResult[0].id;

    // Create a math question
    const mathQuestionResult = await db.insert(questionsTable)
      .values({
        exam_id: examId,
        type: 'MATHEMATICS_FORMULA',
        question_text: 'Solve for x: 2x + 5 = 15',
        points: 10,
        order_index: 2
      })
      .returning()
      .execute();

    const mathQuestionId = mathQuestionResult[0].id;

    // Add options to MC question
    await db.insert(multipleChoiceOptionsTable)
      .values([
        {
          question_id: mcQuestionId,
          option_text: 'Option A',
          is_correct: true,
          order_index: 1
        },
        {
          question_id: mcQuestionId,
          option_text: 'Option B',
          is_correct: false,
          order_index: 2
        }
      ])
      .execute();

    // Add answer to math question
    await db.insert(mathematicsFormulaAnswersTable)
      .values({
        question_id: mathQuestionId,
        expected_answer: 'x = 5'
      })
      .execute();

    // Delete the MC question
    const mcResult = await deleteQuestion(mcQuestionId);
    expect(mcResult).toBe(true);

    // Verify MC question and its options are deleted
    const mcQuestions = await db.select()
      .from(questionsTable)
      .where(eq(questionsTable.id, mcQuestionId))
      .execute();

    expect(mcQuestions).toHaveLength(0);

    const mcOptions = await db.select()
      .from(multipleChoiceOptionsTable)
      .where(eq(multipleChoiceOptionsTable.question_id, mcQuestionId))
      .execute();

    expect(mcOptions).toHaveLength(0);

    // Delete the math question
    const mathResult = await deleteQuestion(mathQuestionId);
    expect(mathResult).toBe(true);

    // Verify math question and its answer are deleted
    const mathQuestions = await db.select()
      .from(questionsTable)
      .where(eq(questionsTable.id, mathQuestionId))
      .execute();

    expect(mathQuestions).toHaveLength(0);

    const mathAnswers = await db.select()
      .from(mathematicsFormulaAnswersTable)
      .where(eq(mathematicsFormulaAnswersTable.question_id, mathQuestionId))
      .execute();

    expect(mathAnswers).toHaveLength(0);

    // Verify exam still exists
    const exams = await db.select()
      .from(examsTable)
      .where(eq(examsTable.id, examId))
      .execute();

    expect(exams).toHaveLength(1);
  });
});