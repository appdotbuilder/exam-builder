import { serial, text, pgTable, timestamp, integer, boolean, pgEnum } from 'drizzle-orm/pg-core';
import { relations } from 'drizzle-orm';

// Enum for question types
export const questionTypeEnum = pgEnum('question_type', ['MULTIPLE_CHOICE', 'MATHEMATICS_FORMULA']);

// Exams table
export const examsTable = pgTable('exams', {
  id: serial('id').primaryKey(),
  title: text('title').notNull(),
  description: text('description'), // Nullable by default
  created_at: timestamp('created_at').defaultNow().notNull(),
  updated_at: timestamp('updated_at').defaultNow().notNull(),
});

// Questions table
export const questionsTable = pgTable('questions', {
  id: serial('id').primaryKey(),
  exam_id: integer('exam_id').notNull().references(() => examsTable.id, { onDelete: 'cascade' }),
  type: questionTypeEnum('type').notNull(),
  question_text: text('question_text').notNull(),
  points: integer('points').notNull(), // Using integer for points to keep it simple
  order_index: integer('order_index').notNull(),
  created_at: timestamp('created_at').defaultNow().notNull(),
});

// Multiple choice options table
export const multipleChoiceOptionsTable = pgTable('multiple_choice_options', {
  id: serial('id').primaryKey(),
  question_id: integer('question_id').notNull().references(() => questionsTable.id, { onDelete: 'cascade' }),
  option_text: text('option_text').notNull(),
  is_correct: boolean('is_correct').notNull(),
  order_index: integer('order_index').notNull(),
});

// Mathematics formula answers table
export const mathematicsFormulaAnswersTable = pgTable('mathematics_formula_answers', {
  id: serial('id').primaryKey(),
  question_id: integer('question_id').notNull().references(() => questionsTable.id, { onDelete: 'cascade' }),
  expected_answer: text('expected_answer').notNull(),
});

// Define relations
export const examsRelations = relations(examsTable, ({ many }) => ({
  questions: many(questionsTable),
}));

export const questionsRelations = relations(questionsTable, ({ one, many }) => ({
  exam: one(examsTable, {
    fields: [questionsTable.exam_id],
    references: [examsTable.id],
  }),
  multipleChoiceOptions: many(multipleChoiceOptionsTable),
  mathematicsFormulaAnswer: one(mathematicsFormulaAnswersTable, {
    fields: [questionsTable.id],
    references: [mathematicsFormulaAnswersTable.question_id],
  }),
}));

export const multipleChoiceOptionsRelations = relations(multipleChoiceOptionsTable, ({ one }) => ({
  question: one(questionsTable, {
    fields: [multipleChoiceOptionsTable.question_id],
    references: [questionsTable.id],
  }),
}));

export const mathematicsFormulaAnswersRelations = relations(mathematicsFormulaAnswersTable, ({ one }) => ({
  question: one(questionsTable, {
    fields: [mathematicsFormulaAnswersTable.question_id],
    references: [questionsTable.id],
  }),
}));

// TypeScript types for the table schemas
export type Exam = typeof examsTable.$inferSelect;
export type NewExam = typeof examsTable.$inferInsert;

export type Question = typeof questionsTable.$inferSelect;
export type NewQuestion = typeof questionsTable.$inferInsert;

export type MultipleChoiceOption = typeof multipleChoiceOptionsTable.$inferSelect;
export type NewMultipleChoiceOption = typeof multipleChoiceOptionsTable.$inferInsert;

export type MathematicsFormulaAnswer = typeof mathematicsFormulaAnswersTable.$inferSelect;
export type NewMathematicsFormulaAnswer = typeof mathematicsFormulaAnswersTable.$inferInsert;

// Export all tables for proper query building
export const tables = {
  exams: examsTable,
  questions: questionsTable,
  multipleChoiceOptions: multipleChoiceOptionsTable,
  mathematicsFormulaAnswers: mathematicsFormulaAnswersTable,
};