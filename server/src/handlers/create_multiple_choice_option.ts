import { type CreateMultipleChoiceOptionInput, type MultipleChoiceOption } from '../schema';

export async function createMultipleChoiceOption(input: CreateMultipleChoiceOptionInput): Promise<MultipleChoiceOption> {
    // This is a placeholder declaration! Real code should be implemented here.
    // The goal of this handler is creating a new multiple choice option for a question.
    // It should validate that the question exists and is of type MULTIPLE_CHOICE.
    // The order_index determines the position of the option in the question.
    return Promise.resolve({
        id: 1, // Placeholder ID
        question_id: input.question_id,
        option_text: input.option_text,
        is_correct: input.is_correct,
        order_index: input.order_index
    } as MultipleChoiceOption);
}