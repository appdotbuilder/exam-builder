import { db } from '../db';
import { examsTable, questionsTable, multipleChoiceOptionsTable, mathematicsFormulaAnswersTable } from '../db/schema';
import { type ExamWithQuestions } from '../schema';
import { eq } from 'drizzle-orm';

export async function getExamById(id: number): Promise<ExamWithQuestions | null> {
  try {
    // First, get the exam
    const examResults = await db.select()
      .from(examsTable)
      .where(eq(examsTable.id, id))
      .execute();

    if (examResults.length === 0) {
      return null;
    }

    const exam = examResults[0];

    // Get all questions for this exam
    const questions = await db.select()
      .from(questionsTable)
      .where(eq(questionsTable.exam_id, id))
      .execute();

    // Get all multiple choice options for all questions in this exam
    const questionIds = questions.map(q => q.id);
    
    let multipleChoiceOptions: any[] = [];
    let mathematicsAnswers: any[] = [];

    if (questionIds.length > 0) {
      // Get multiple choice options
      const mcOptionsResults = await db.select()
        .from(multipleChoiceOptionsTable)
        .innerJoin(questionsTable, eq(multipleChoiceOptionsTable.question_id, questionsTable.id))
        .where(eq(questionsTable.exam_id, id))
        .execute();

      multipleChoiceOptions = mcOptionsResults.map(result => result.multiple_choice_options);

      // Get mathematics formula answers
      const mathAnswersResults = await db.select()
        .from(mathematicsFormulaAnswersTable)
        .innerJoin(questionsTable, eq(mathematicsFormulaAnswersTable.question_id, questionsTable.id))
        .where(eq(questionsTable.exam_id, id))
        .execute();

      mathematicsAnswers = mathAnswersResults.map(result => result.mathematics_formula_answers);
    }

    // Combine the data
    const questionsWithOptions = questions.map(question => {
      const questionMCOptions = multipleChoiceOptions.filter(option => option.question_id === question.id);
      const questionMathAnswer = mathematicsAnswers.find(answer => answer.question_id === question.id);

      return {
        id: question.id,
        type: question.type,
        question_text: question.question_text,
        points: question.points,
        order_index: question.order_index,
        created_at: question.created_at,
        multipleChoiceOptions: questionMCOptions.length > 0 ? questionMCOptions : undefined,
        mathematicsFormulaAnswer: questionMathAnswer || undefined
      };
    });

    return {
      id: exam.id,
      title: exam.title,
      description: exam.description,
      created_at: exam.created_at,
      updated_at: exam.updated_at,
      questions: questionsWithOptions
    };
  } catch (error) {
    console.error('Failed to get exam by id:', error);
    throw error;
  }
}