import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { examsTable, questionsTable, multipleChoiceOptionsTable, mathematicsFormulaAnswersTable } from '../db/schema';
import { deleteExam } from '../handlers/delete_exam';
import { eq } from 'drizzle-orm';

describe('deleteExam', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  it('should delete an exam that exists', async () => {
    // Create test exam
    const examResult = await db.insert(examsTable)
      .values({
        title: 'Test Exam',
        description: 'An exam for testing deletion'
      })
      .returning()
      .execute();

    const examId = examResult[0].id;

    // Delete the exam
    const result = await deleteExam(examId);

    expect(result).toBe(true);

    // Verify exam was deleted
    const exams = await db.select()
      .from(examsTable)
      .where(eq(examsTable.id, examId))
      .execute();

    expect(exams).toHaveLength(0);
  });

  it('should return false when exam does not exist', async () => {
    // Try to delete non-existent exam
    const result = await deleteExam(999);

    expect(result).toBe(false);
  });

  it('should cascade delete associated questions', async () => {
    // Create test exam
    const examResult = await db.insert(examsTable)
      .values({
        title: 'Test Exam with Questions',
        description: 'An exam for testing cascade deletion'
      })
      .returning()
      .execute();

    const examId = examResult[0].id;

    // Create test questions
    await db.insert(questionsTable)
      .values([
        {
          exam_id: examId,
          type: 'MULTIPLE_CHOICE',
          question_text: 'What is 2 + 2?',
          points: 10,
          order_index: 0
        },
        {
          exam_id: examId,
          type: 'MATHEMATICS_FORMULA',
          question_text: 'Solve for x: x + 5 = 10',
          points: 15,
          order_index: 1
        }
      ])
      .execute();

    // Verify questions exist before deletion
    const questionsBeforeDelete = await db.select()
      .from(questionsTable)
      .where(eq(questionsTable.exam_id, examId))
      .execute();

    expect(questionsBeforeDelete).toHaveLength(2);

    // Delete the exam
    const result = await deleteExam(examId);

    expect(result).toBe(true);

    // Verify questions were cascade deleted
    const questionsAfterDelete = await db.select()
      .from(questionsTable)
      .where(eq(questionsTable.exam_id, examId))
      .execute();

    expect(questionsAfterDelete).toHaveLength(0);
  });

  it('should cascade delete associated multiple choice options', async () => {
    // Create test exam
    const examResult = await db.insert(examsTable)
      .values({
        title: 'Test Exam with Multiple Choice',
        description: 'Testing cascade deletion of options'
      })
      .returning()
      .execute();

    const examId = examResult[0].id;

    // Create test question
    const questionResult = await db.insert(questionsTable)
      .values({
        exam_id: examId,
        type: 'MULTIPLE_CHOICE',
        question_text: 'What is the capital of France?',
        points: 10,
        order_index: 0
      })
      .returning()
      .execute();

    const questionId = questionResult[0].id;

    // Create multiple choice options
    await db.insert(multipleChoiceOptionsTable)
      .values([
        {
          question_id: questionId,
          option_text: 'London',
          is_correct: false,
          order_index: 0
        },
        {
          question_id: questionId,
          option_text: 'Paris',
          is_correct: true,
          order_index: 1
        },
        {
          question_id: questionId,
          option_text: 'Berlin',
          is_correct: false,
          order_index: 2
        }
      ])
      .execute();

    // Verify options exist before deletion
    const optionsBeforeDelete = await db.select()
      .from(multipleChoiceOptionsTable)
      .where(eq(multipleChoiceOptionsTable.question_id, questionId))
      .execute();

    expect(optionsBeforeDelete).toHaveLength(3);

    // Delete the exam
    const result = await deleteExam(examId);

    expect(result).toBe(true);

    // Verify options were cascade deleted
    const optionsAfterDelete = await db.select()
      .from(multipleChoiceOptionsTable)
      .where(eq(multipleChoiceOptionsTable.question_id, questionId))
      .execute();

    expect(optionsAfterDelete).toHaveLength(0);
  });

  it('should cascade delete associated mathematics formula answers', async () => {
    // Create test exam
    const examResult = await db.insert(examsTable)
      .values({
        title: 'Test Exam with Formula Questions',
        description: 'Testing cascade deletion of formula answers'
      })
      .returning()
      .execute();

    const examId = examResult[0].id;

    // Create test question
    const questionResult = await db.insert(questionsTable)
      .values({
        exam_id: examId,
        type: 'MATHEMATICS_FORMULA',
        question_text: 'What is the derivative of x²?',
        points: 20,
        order_index: 0
      })
      .returning()
      .execute();

    const questionId = questionResult[0].id;

    // Create mathematics formula answer
    await db.insert(mathematicsFormulaAnswersTable)
      .values({
        question_id: questionId,
        expected_answer: '2x'
      })
      .execute();

    // Verify answer exists before deletion
    const answersBeforeDelete = await db.select()
      .from(mathematicsFormulaAnswersTable)
      .where(eq(mathematicsFormulaAnswersTable.question_id, questionId))
      .execute();

    expect(answersBeforeDelete).toHaveLength(1);

    // Delete the exam
    const result = await deleteExam(examId);

    expect(result).toBe(true);

    // Verify answer was cascade deleted
    const answersAfterDelete = await db.select()
      .from(mathematicsFormulaAnswersTable)
      .where(eq(mathematicsFormulaAnswersTable.question_id, questionId))
      .execute();

    expect(answersAfterDelete).toHaveLength(0);
  });

  it('should cascade delete complex exam with mixed question types', async () => {
    // Create test exam
    const examResult = await db.insert(examsTable)
      .values({
        title: 'Complex Test Exam',
        description: 'An exam with both question types for complete cascade testing'
      })
      .returning()
      .execute();

    const examId = examResult[0].id;

    // Create multiple choice question
    const mcQuestionResult = await db.insert(questionsTable)
      .values({
        exam_id: examId,
        type: 'MULTIPLE_CHOICE',
        question_text: 'Which planet is closest to the sun?',
        points: 5,
        order_index: 0
      })
      .returning()
      .execute();

    const mcQuestionId = mcQuestionResult[0].id;

    // Create mathematics formula question
    const mathQuestionResult = await db.insert(questionsTable)
      .values({
        exam_id: examId,
        type: 'MATHEMATICS_FORMULA',
        question_text: 'Find the integral of 3x²',
        points: 15,
        order_index: 1
      })
      .returning()
      .execute();

    const mathQuestionId = mathQuestionResult[0].id;

    // Create multiple choice options
    await db.insert(multipleChoiceOptionsTable)
      .values([
        {
          question_id: mcQuestionId,
          option_text: 'Mercury',
          is_correct: true,
          order_index: 0
        },
        {
          question_id: mcQuestionId,
          option_text: 'Venus',
          is_correct: false,
          order_index: 1
        }
      ])
      .execute();

    // Create mathematics formula answer
    await db.insert(mathematicsFormulaAnswersTable)
      .values({
        question_id: mathQuestionId,
        expected_answer: 'x³ + C'
      })
      .execute();

    // Delete the exam
    const result = await deleteExam(examId);

    expect(result).toBe(true);

    // Verify all data was cascade deleted
    const remainingExams = await db.select()
      .from(examsTable)
      .where(eq(examsTable.id, examId))
      .execute();
    expect(remainingExams).toHaveLength(0);

    const remainingQuestions = await db.select()
      .from(questionsTable)
      .where(eq(questionsTable.exam_id, examId))
      .execute();
    expect(remainingQuestions).toHaveLength(0);

    const remainingOptions = await db.select()
      .from(multipleChoiceOptionsTable)
      .where(eq(multipleChoiceOptionsTable.question_id, mcQuestionId))
      .execute();
    expect(remainingOptions).toHaveLength(0);

    const remainingAnswers = await db.select()
      .from(mathematicsFormulaAnswersTable)
      .where(eq(mathematicsFormulaAnswersTable.question_id, mathQuestionId))
      .execute();
    expect(remainingAnswers).toHaveLength(0);
  });

  it('should not affect other exams when deleting one', async () => {
    // Create two test exams
    const exam1Result = await db.insert(examsTable)
      .values({
        title: 'Exam 1',
        description: 'First exam'
      })
      .returning()
      .execute();

    const exam2Result = await db.insert(examsTable)
      .values({
        title: 'Exam 2',
        description: 'Second exam'
      })
      .returning()
      .execute();

    const exam1Id = exam1Result[0].id;
    const exam2Id = exam2Result[0].id;

    // Create questions for both exams
    await db.insert(questionsTable)
      .values([
        {
          exam_id: exam1Id,
          type: 'MULTIPLE_CHOICE',
          question_text: 'Question for exam 1',
          points: 10,
          order_index: 0
        },
        {
          exam_id: exam2Id,
          type: 'MATHEMATICS_FORMULA',
          question_text: 'Question for exam 2',
          points: 15,
          order_index: 0
        }
      ])
      .execute();

    // Delete only the first exam
    const result = await deleteExam(exam1Id);

    expect(result).toBe(true);

    // Verify first exam is deleted
    const exam1After = await db.select()
      .from(examsTable)
      .where(eq(examsTable.id, exam1Id))
      .execute();
    expect(exam1After).toHaveLength(0);

    // Verify second exam still exists
    const exam2After = await db.select()
      .from(examsTable)
      .where(eq(examsTable.id, exam2Id))
      .execute();
    expect(exam2After).toHaveLength(1);
    expect(exam2After[0].title).toBe('Exam 2');

    // Verify second exam's question still exists
    const exam2Questions = await db.select()
      .from(questionsTable)
      .where(eq(questionsTable.exam_id, exam2Id))
      .execute();
    expect(exam2Questions).toHaveLength(1);
  });
});