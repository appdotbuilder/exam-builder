import { type CreateQuestionInput, type Question } from '../schema';

export async function createQuestion(input: CreateQuestionInput): Promise<Question> {
    // This is a placeholder declaration! Real code should be implemented here.
    // The goal of this handler is creating a new question for an exam.
    // It should validate that the exam exists and create the question with the provided details.
    // The order_index determines the position of the question in the exam.
    return Promise.resolve({
        id: 1, // Placeholder ID
        exam_id: input.exam_id,
        type: input.type,
        question_text: input.question_text,
        points: input.points,
        order_index: input.order_index,
        created_at: new Date()
    } as Question);
}