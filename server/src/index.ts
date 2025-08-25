import { initTRPC } from '@trpc/server';
import { createHTTPServer } from '@trpc/server/adapters/standalone';
import 'dotenv/config';
import cors from 'cors';
import superjson from 'superjson';
import { z } from 'zod';

// Import schemas
import {
  createExamInputSchema,
  updateExamInputSchema,
  createQuestionInputSchema,
  updateQuestionInputSchema,
  createMultipleChoiceOptionInputSchema,
  updateMultipleChoiceOptionInputSchema,
  createMathematicsFormulaAnswerInputSchema,
  updateMathematicsFormulaAnswerInputSchema
} from './schema';

// Import handlers
import { createExam } from './handlers/create_exam';
import { getExams } from './handlers/get_exams';
import { getExamById } from './handlers/get_exam_by_id';
import { updateExam } from './handlers/update_exam';
import { deleteExam } from './handlers/delete_exam';
import { createQuestion } from './handlers/create_question';
import { updateQuestion } from './handlers/update_question';
import { deleteQuestion } from './handlers/delete_question';
import { createMultipleChoiceOption } from './handlers/create_multiple_choice_option';
import { updateMultipleChoiceOption } from './handlers/update_multiple_choice_option';
import { deleteMultipleChoiceOption } from './handlers/delete_multiple_choice_option';
import { createMathematicsFormulaAnswer } from './handlers/create_mathematics_formula_answer';
import { updateMathematicsFormulaAnswer } from './handlers/update_mathematics_formula_answer';
import { deleteMathematicsFormulaAnswer } from './handlers/delete_mathematics_formula_answer';

const t = initTRPC.create({
  transformer: superjson,
});

const publicProcedure = t.procedure;
const router = t.router;

const appRouter = router({
  // Health check
  healthcheck: publicProcedure.query(() => {
    return { status: 'ok', timestamp: new Date().toISOString() };
  }),

  // Exam routes
  createExam: publicProcedure
    .input(createExamInputSchema)
    .mutation(({ input }) => createExam(input)),
  
  getExams: publicProcedure
    .query(() => getExams()),
  
  getExamById: publicProcedure
    .input(z.object({ id: z.number() }))
    .query(({ input }) => getExamById(input.id)),
  
  updateExam: publicProcedure
    .input(updateExamInputSchema)
    .mutation(({ input }) => updateExam(input)),
  
  deleteExam: publicProcedure
    .input(z.object({ id: z.number() }))
    .mutation(({ input }) => deleteExam(input.id)),

  // Question routes
  createQuestion: publicProcedure
    .input(createQuestionInputSchema)
    .mutation(({ input }) => createQuestion(input)),
  
  updateQuestion: publicProcedure
    .input(updateQuestionInputSchema)
    .mutation(({ input }) => updateQuestion(input)),
  
  deleteQuestion: publicProcedure
    .input(z.object({ id: z.number() }))
    .mutation(({ input }) => deleteQuestion(input.id)),

  // Multiple choice option routes
  createMultipleChoiceOption: publicProcedure
    .input(createMultipleChoiceOptionInputSchema)
    .mutation(({ input }) => createMultipleChoiceOption(input)),
  
  updateMultipleChoiceOption: publicProcedure
    .input(updateMultipleChoiceOptionInputSchema)
    .mutation(({ input }) => updateMultipleChoiceOption(input)),
  
  deleteMultipleChoiceOption: publicProcedure
    .input(z.object({ id: z.number() }))
    .mutation(({ input }) => deleteMultipleChoiceOption(input.id)),

  // Mathematics formula answer routes
  createMathematicsFormulaAnswer: publicProcedure
    .input(createMathematicsFormulaAnswerInputSchema)
    .mutation(({ input }) => createMathematicsFormulaAnswer(input)),
  
  updateMathematicsFormulaAnswer: publicProcedure
    .input(updateMathematicsFormulaAnswerInputSchema)
    .mutation(({ input }) => updateMathematicsFormulaAnswer(input)),
  
  deleteMathematicsFormulaAnswer: publicProcedure
    .input(z.object({ id: z.number() }))
    .mutation(({ input }) => deleteMathematicsFormulaAnswer(input.id)),
});

export type AppRouter = typeof appRouter;

async function start() {
  const port = process.env['SERVER_PORT'] || 2022;
  const server = createHTTPServer({
    middleware: (req, res, next) => {
      cors()(req, res, next);
    },
    router: appRouter,
    createContext() {
      return {};
    },
  });
  server.listen(port);
  console.log(`TRPC server listening at port: ${port}`);
}

start();