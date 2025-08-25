import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { examsTable, questionsTable, multipleChoiceOptionsTable, mathematicsFormulaAnswersTable } from '../db/schema';
import { getExamById } from '../handlers/get_exam_by_id';

describe('getExamById', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  it('should return null for non-existent exam', async () => {
    const result = await getExamById(999);
    expect(result).toBeNull();
  });

  it('should return exam without questions', async () => {
    // Create exam
    const examResult = await db.insert(examsTable)
      .values({
        title: 'Empty Exam',
        description: 'An exam with no questions'
      })
      .returning()
      .execute();

    const exam = examResult[0];
    const result = await getExamById(exam.id);

    expect(result).not.toBeNull();
    expect(result!.id).toEqual(exam.id);
    expect(result!.title).toEqual('Empty Exam');
    expect(result!.description).toEqual('An exam with no questions');
    expect(result!.created_at).toBeInstanceOf(Date);
    expect(result!.updated_at).toBeInstanceOf(Date);
    expect(result!.questions).toEqual([]);
  });

  it('should return exam with multiple choice questions', async () => {
    // Create exam
    const examResult = await db.insert(examsTable)
      .values({
        title: 'Multiple Choice Exam',
        description: 'Exam with MC questions'
      })
      .returning()
      .execute();

    const exam = examResult[0];

    // Create questions
    const questionsResult = await db.insert(questionsTable)
      .values([
        {
          exam_id: exam.id,
          type: 'MULTIPLE_CHOICE',
          question_text: 'What is 2+2?',
          points: 5,
          order_index: 0
        },
        {
          exam_id: exam.id,
          type: 'MULTIPLE_CHOICE',
          question_text: 'What is the capital of France?',
          points: 3,
          order_index: 1
        }
      ])
      .returning()
      .execute();

    const [question1, question2] = questionsResult;

    // Create multiple choice options for question1
    await db.insert(multipleChoiceOptionsTable)
      .values([
        {
          question_id: question1.id,
          option_text: '4',
          is_correct: true,
          order_index: 0
        },
        {
          question_id: question1.id,
          option_text: '5',
          is_correct: false,
          order_index: 1
        }
      ])
      .execute();

    // Create multiple choice options for question2
    await db.insert(multipleChoiceOptionsTable)
      .values([
        {
          question_id: question2.id,
          option_text: 'Paris',
          is_correct: true,
          order_index: 0
        },
        {
          question_id: question2.id,
          option_text: 'London',
          is_correct: false,
          order_index: 1
        },
        {
          question_id: question2.id,
          option_text: 'Berlin',
          is_correct: false,
          order_index: 2
        }
      ])
      .execute();

    const result = await getExamById(exam.id);

    expect(result).not.toBeNull();
    expect(result!.id).toEqual(exam.id);
    expect(result!.title).toEqual('Multiple Choice Exam');
    expect(result!.questions).toHaveLength(2);

    // Check first question
    const q1 = result!.questions.find(q => q.order_index === 0);
    expect(q1).toBeDefined();
    expect(q1!.question_text).toEqual('What is 2+2?');
    expect(q1!.type).toEqual('MULTIPLE_CHOICE');
    expect(q1!.points).toEqual(5);
    expect(q1!.multipleChoiceOptions).toHaveLength(2);
    expect(q1!.multipleChoiceOptions![0].option_text).toEqual('4');
    expect(q1!.multipleChoiceOptions![0].is_correct).toBe(true);
    expect(q1!.mathematicsFormulaAnswer).toBeUndefined();

    // Check second question
    const q2 = result!.questions.find(q => q.order_index === 1);
    expect(q2).toBeDefined();
    expect(q2!.question_text).toEqual('What is the capital of France?');
    expect(q2!.type).toEqual('MULTIPLE_CHOICE');
    expect(q2!.points).toEqual(3);
    expect(q2!.multipleChoiceOptions).toHaveLength(3);
    expect(q2!.multipleChoiceOptions!.find(opt => opt.option_text === 'Paris')!.is_correct).toBe(true);
    expect(q2!.multipleChoiceOptions!.find(opt => opt.option_text === 'London')!.is_correct).toBe(false);
  });

  it('should return exam with mathematics formula questions', async () => {
    // Create exam
    const examResult = await db.insert(examsTable)
      .values({
        title: 'Math Exam',
        description: 'Exam with math questions'
      })
      .returning()
      .execute();

    const exam = examResult[0];

    // Create questions
    const questionsResult = await db.insert(questionsTable)
      .values([
        {
          exam_id: exam.id,
          type: 'MATHEMATICS_FORMULA',
          question_text: 'Solve for x: 2x + 5 = 15',
          points: 10,
          order_index: 0
        },
        {
          exam_id: exam.id,
          type: 'MATHEMATICS_FORMULA',
          question_text: 'What is the derivative of x^2?',
          points: 8,
          order_index: 1
        }
      ])
      .returning()
      .execute();

    const [question1, question2] = questionsResult;

    // Create mathematics formula answers
    await db.insert(mathematicsFormulaAnswersTable)
      .values([
        {
          question_id: question1.id,
          expected_answer: '5'
        },
        {
          question_id: question2.id,
          expected_answer: '2x'
        }
      ])
      .execute();

    const result = await getExamById(exam.id);

    expect(result).not.toBeNull();
    expect(result!.id).toEqual(exam.id);
    expect(result!.title).toEqual('Math Exam');
    expect(result!.questions).toHaveLength(2);

    // Check first question
    const q1 = result!.questions.find(q => q.order_index === 0);
    expect(q1).toBeDefined();
    expect(q1!.question_text).toEqual('Solve for x: 2x + 5 = 15');
    expect(q1!.type).toEqual('MATHEMATICS_FORMULA');
    expect(q1!.points).toEqual(10);
    expect(q1!.multipleChoiceOptions).toBeUndefined();
    expect(q1!.mathematicsFormulaAnswer).toBeDefined();
    expect(q1!.mathematicsFormulaAnswer!.expected_answer).toEqual('5');

    // Check second question
    const q2 = result!.questions.find(q => q.order_index === 1);
    expect(q2).toBeDefined();
    expect(q2!.question_text).toEqual('What is the derivative of x^2?');
    expect(q2!.type).toEqual('MATHEMATICS_FORMULA');
    expect(q2!.points).toEqual(8);
    expect(q2!.mathematicsFormulaAnswer!.expected_answer).toEqual('2x');
  });

  it('should return exam with mixed question types', async () => {
    // Create exam
    const examResult = await db.insert(examsTable)
      .values({
        title: 'Mixed Exam',
        description: null
      })
      .returning()
      .execute();

    const exam = examResult[0];

    // Create questions
    const questionsResult = await db.insert(questionsTable)
      .values([
        {
          exam_id: exam.id,
          type: 'MULTIPLE_CHOICE',
          question_text: 'Which is correct?',
          points: 2,
          order_index: 0
        },
        {
          exam_id: exam.id,
          type: 'MATHEMATICS_FORMULA',
          question_text: 'Calculate: 3 * 4',
          points: 4,
          order_index: 1
        }
      ])
      .returning()
      .execute();

    const [mcQuestion, mathQuestion] = questionsResult;

    // Create multiple choice options
    await db.insert(multipleChoiceOptionsTable)
      .values([
        {
          question_id: mcQuestion.id,
          option_text: 'Option A',
          is_correct: true,
          order_index: 0
        },
        {
          question_id: mcQuestion.id,
          option_text: 'Option B',
          is_correct: false,
          order_index: 1
        }
      ])
      .execute();

    // Create mathematics formula answer
    await db.insert(mathematicsFormulaAnswersTable)
      .values({
        question_id: mathQuestion.id,
        expected_answer: '12'
      })
      .execute();

    const result = await getExamById(exam.id);

    expect(result).not.toBeNull();
    expect(result!.description).toBeNull();
    expect(result!.questions).toHaveLength(2);

    // Check MC question
    const mcQ = result!.questions.find(q => q.type === 'MULTIPLE_CHOICE');
    expect(mcQ).toBeDefined();
    expect(mcQ!.multipleChoiceOptions).toHaveLength(2);
    expect(mcQ!.mathematicsFormulaAnswer).toBeUndefined();

    // Check math question
    const mathQ = result!.questions.find(q => q.type === 'MATHEMATICS_FORMULA');
    expect(mathQ).toBeDefined();
    expect(mathQ!.multipleChoiceOptions).toBeUndefined();
    expect(mathQ!.mathematicsFormulaAnswer).toBeDefined();
    expect(mathQ!.mathematicsFormulaAnswer!.expected_answer).toEqual('12');
  });

  it('should handle questions with no options or answers gracefully', async () => {
    // Create exam
    const examResult = await db.insert(examsTable)
      .values({
        title: 'Incomplete Exam',
        description: 'Exam with incomplete questions'
      })
      .returning()
      .execute();

    const exam = examResult[0];

    // Create questions without options/answers
    await db.insert(questionsTable)
      .values([
        {
          exam_id: exam.id,
          type: 'MULTIPLE_CHOICE',
          question_text: 'MC question without options',
          points: 1,
          order_index: 0
        },
        {
          exam_id: exam.id,
          type: 'MATHEMATICS_FORMULA',
          question_text: 'Math question without answer',
          points: 1,
          order_index: 1
        }
      ])
      .execute();

    const result = await getExamById(exam.id);

    expect(result).not.toBeNull();
    expect(result!.questions).toHaveLength(2);

    const mcQ = result!.questions.find(q => q.type === 'MULTIPLE_CHOICE');
    expect(mcQ!.multipleChoiceOptions).toBeUndefined();

    const mathQ = result!.questions.find(q => q.type === 'MATHEMATICS_FORMULA');
    expect(mathQ!.mathematicsFormulaAnswer).toBeUndefined();
  });
});