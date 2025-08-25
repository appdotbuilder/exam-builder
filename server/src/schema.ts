import { z } from 'zod';

// Enum for question types
export const questionTypeEnum = z.enum(['MULTIPLE_CHOICE', 'MATHEMATICS_FORMULA']);
export type QuestionType = z.infer<typeof questionTypeEnum>;

// Exam schema
export const examSchema = z.object({
  id: z.number(),
  title: z.string(),
  description: z.string().nullable(),
  created_at: z.coerce.date(),
  updated_at: z.coerce.date()
});

export type Exam = z.infer<typeof examSchema>;

// Question schema - base question structure
export const questionSchema = z.object({
  id: z.number(),
  exam_id: z.number(),
  type: questionTypeEnum,
  question_text: z.string(),
  points: z.number().positive(),
  order_index: z.number().int().nonnegative(),
  created_at: z.coerce.date()
});

export type Question = z.infer<typeof questionSchema>;

// Multiple choice option schema
export const multipleChoiceOptionSchema = z.object({
  id: z.number(),
  question_id: z.number(),
  option_text: z.string(),
  is_correct: z.boolean(),
  order_index: z.number().int().nonnegative()
});

export type MultipleChoiceOption = z.infer<typeof multipleChoiceOptionSchema>;

// Mathematics formula answer schema
export const mathematicsFormulaAnswerSchema = z.object({
  id: z.number(),
  question_id: z.number(),
  expected_answer: z.string() // Can be formula or numerical value
});

export type MathematicsFormulaAnswer = z.infer<typeof mathematicsFormulaAnswerSchema>;

// Input schemas for creating exams
export const createExamInputSchema = z.object({
  title: z.string().min(1, "Title is required"),
  description: z.string().nullable()
});

export type CreateExamInput = z.infer<typeof createExamInputSchema>;

// Input schemas for updating exams
export const updateExamInputSchema = z.object({
  id: z.number(),
  title: z.string().min(1, "Title is required").optional(),
  description: z.string().nullable().optional()
});

export type UpdateExamInput = z.infer<typeof updateExamInputSchema>;

// Input schema for creating questions
export const createQuestionInputSchema = z.object({
  exam_id: z.number(),
  type: questionTypeEnum,
  question_text: z.string().min(1, "Question text is required"),
  points: z.number().positive(),
  order_index: z.number().int().nonnegative()
});

export type CreateQuestionInput = z.infer<typeof createQuestionInputSchema>;

// Input schema for updating questions
export const updateQuestionInputSchema = z.object({
  id: z.number(),
  question_text: z.string().min(1, "Question text is required").optional(),
  points: z.number().positive().optional(),
  order_index: z.number().int().nonnegative().optional()
});

export type UpdateQuestionInput = z.infer<typeof updateQuestionInputSchema>;

// Input schema for creating multiple choice options
export const createMultipleChoiceOptionInputSchema = z.object({
  question_id: z.number(),
  option_text: z.string().min(1, "Option text is required"),
  is_correct: z.boolean(),
  order_index: z.number().int().nonnegative()
});

export type CreateMultipleChoiceOptionInput = z.infer<typeof createMultipleChoiceOptionInputSchema>;

// Input schema for updating multiple choice options
export const updateMultipleChoiceOptionInputSchema = z.object({
  id: z.number(),
  option_text: z.string().min(1, "Option text is required").optional(),
  is_correct: z.boolean().optional(),
  order_index: z.number().int().nonnegative().optional()
});

export type UpdateMultipleChoiceOptionInput = z.infer<typeof updateMultipleChoiceOptionInputSchema>;

// Input schema for creating mathematics formula answers
export const createMathematicsFormulaAnswerInputSchema = z.object({
  question_id: z.number(),
  expected_answer: z.string().min(1, "Expected answer is required")
});

export type CreateMathematicsFormulaAnswerInput = z.infer<typeof createMathematicsFormulaAnswerInputSchema>;

// Input schema for updating mathematics formula answers
export const updateMathematicsFormulaAnswerInputSchema = z.object({
  id: z.number(),
  expected_answer: z.string().min(1, "Expected answer is required").optional()
});

export type UpdateMathematicsFormulaAnswerInput = z.infer<typeof updateMathematicsFormulaAnswerInputSchema>;

// Complete exam with questions schema (for fetching full exam data)
export const examWithQuestionsSchema = z.object({
  id: z.number(),
  title: z.string(),
  description: z.string().nullable(),
  created_at: z.coerce.date(),
  updated_at: z.coerce.date(),
  questions: z.array(z.object({
    id: z.number(),
    type: questionTypeEnum,
    question_text: z.string(),
    points: z.number(),
    order_index: z.number().int(),
    created_at: z.coerce.date(),
    multipleChoiceOptions: z.array(multipleChoiceOptionSchema).optional(),
    mathematicsFormulaAnswer: mathematicsFormulaAnswerSchema.nullable().optional()
  }))
});

export type ExamWithQuestions = z.infer<typeof examWithQuestionsSchema>;