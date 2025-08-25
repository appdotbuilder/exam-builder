import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { questionsTable, examsTable } from '../db/schema';
import { type CreateQuestionInput } from '../schema';
import { createQuestion } from '../handlers/create_question';
import { eq } from 'drizzle-orm';

// Test input for multiple choice question
const testMultipleChoiceInput: CreateQuestionInput = {
  exam_id: 1,
  type: 'MULTIPLE_CHOICE',
  question_text: 'What is the capital of France?',
  points: 10,
  order_index: 0
};

// Test input for mathematics formula question
const testMathematicsInput: CreateQuestionInput = {
  exam_id: 1,
  type: 'MATHEMATICS_FORMULA',
  question_text: 'Calculate the integral of x^2 dx',
  points: 15,
  order_index: 1
};

describe('createQuestion', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  // Helper function to create a test exam
  const createTestExam = async () => {
    const result = await db.insert(examsTable)
      .values({
        title: 'Test Exam',
        description: 'An exam for testing questions'
      })
      .returning()
      .execute();
    
    return result[0];
  };

  it('should create a multiple choice question', async () => {
    // Create prerequisite exam
    const exam = await createTestExam();
    const input = { ...testMultipleChoiceInput, exam_id: exam.id };

    const result = await createQuestion(input);

    // Basic field validation
    expect(result.exam_id).toEqual(exam.id);
    expect(result.type).toEqual('MULTIPLE_CHOICE');
    expect(result.question_text).toEqual('What is the capital of France?');
    expect(result.points).toEqual(10);
    expect(result.order_index).toEqual(0);
    expect(result.id).toBeDefined();
    expect(result.created_at).toBeInstanceOf(Date);
  });

  it('should create a mathematics formula question', async () => {
    // Create prerequisite exam
    const exam = await createTestExam();
    const input = { ...testMathematicsInput, exam_id: exam.id };

    const result = await createQuestion(input);

    // Basic field validation
    expect(result.exam_id).toEqual(exam.id);
    expect(result.type).toEqual('MATHEMATICS_FORMULA');
    expect(result.question_text).toEqual('Calculate the integral of x^2 dx');
    expect(result.points).toEqual(15);
    expect(result.order_index).toEqual(1);
    expect(result.id).toBeDefined();
    expect(result.created_at).toBeInstanceOf(Date);
  });

  it('should save question to database', async () => {
    // Create prerequisite exam
    const exam = await createTestExam();
    const input = { ...testMultipleChoiceInput, exam_id: exam.id };

    const result = await createQuestion(input);

    // Query using proper drizzle syntax
    const questions = await db.select()
      .from(questionsTable)
      .where(eq(questionsTable.id, result.id))
      .execute();

    expect(questions).toHaveLength(1);
    expect(questions[0].exam_id).toEqual(exam.id);
    expect(questions[0].type).toEqual('MULTIPLE_CHOICE');
    expect(questions[0].question_text).toEqual('What is the capital of France?');
    expect(questions[0].points).toEqual(10);
    expect(questions[0].order_index).toEqual(0);
    expect(questions[0].created_at).toBeInstanceOf(Date);
  });

  it('should create multiple questions with different order indices', async () => {
    // Create prerequisite exam
    const exam = await createTestExam();

    // Create first question
    const input1 = { ...testMultipleChoiceInput, exam_id: exam.id, order_index: 0 };
    const question1 = await createQuestion(input1);

    // Create second question
    const input2 = { ...testMathematicsInput, exam_id: exam.id, order_index: 1 };
    const question2 = await createQuestion(input2);

    // Verify both questions exist in database
    const questions = await db.select()
      .from(questionsTable)
      .where(eq(questionsTable.exam_id, exam.id))
      .execute();

    expect(questions).toHaveLength(2);

    // Find questions by order_index
    const firstQuestion = questions.find(q => q.order_index === 0);
    const secondQuestion = questions.find(q => q.order_index === 1);

    expect(firstQuestion).toBeDefined();
    expect(firstQuestion?.type).toEqual('MULTIPLE_CHOICE');
    expect(firstQuestion?.question_text).toEqual('What is the capital of France?');

    expect(secondQuestion).toBeDefined();
    expect(secondQuestion?.type).toEqual('MATHEMATICS_FORMULA');
    expect(secondQuestion?.question_text).toEqual('Calculate the integral of x^2 dx');
  });

  it('should throw error when exam does not exist', async () => {
    const input = { ...testMultipleChoiceInput, exam_id: 999 };

    await expect(createQuestion(input)).rejects.toThrow(/exam with id 999 does not exist/i);
  });

  it('should handle questions with same order_index for different exams', async () => {
    // Create two different exams
    const exam1 = await createTestExam();
    const exam2 = await db.insert(examsTable)
      .values({
        title: 'Second Test Exam',
        description: 'Another exam for testing'
      })
      .returning()
      .execute();

    // Create questions with same order_index but different exams
    const input1 = { ...testMultipleChoiceInput, exam_id: exam1.id, order_index: 0 };
    const input2 = { ...testMathematicsInput, exam_id: exam2[0].id, order_index: 0 };

    const question1 = await createQuestion(input1);
    const question2 = await createQuestion(input2);

    expect(question1.exam_id).toEqual(exam1.id);
    expect(question1.order_index).toEqual(0);
    expect(question2.exam_id).toEqual(exam2[0].id);
    expect(question2.order_index).toEqual(0);

    // Verify both questions exist in database
    const allQuestions = await db.select().from(questionsTable).execute();
    expect(allQuestions).toHaveLength(2);
  });

  it('should create question with high point value', async () => {
    // Create prerequisite exam
    const exam = await createTestExam();
    const input = { 
      ...testMultipleChoiceInput, 
      exam_id: exam.id,
      points: 100,
      question_text: 'Complex question worth many points'
    };

    const result = await createQuestion(input);

    expect(result.points).toEqual(100);
    expect(result.question_text).toEqual('Complex question worth many points');
  });
});