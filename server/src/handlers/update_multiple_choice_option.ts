import { db } from '../db';
import { multipleChoiceOptionsTable } from '../db/schema';
import { eq } from 'drizzle-orm';
import { type UpdateMultipleChoiceOptionInput, type MultipleChoiceOption } from '../schema';

export async function updateMultipleChoiceOption(input: UpdateMultipleChoiceOptionInput): Promise<MultipleChoiceOption | null> {
  try {
    // Build update object with only provided fields
    const updateData: Partial<typeof multipleChoiceOptionsTable.$inferInsert> = {};
    
    if (input.option_text !== undefined) {
      updateData.option_text = input.option_text;
    }
    
    if (input.is_correct !== undefined) {
      updateData.is_correct = input.is_correct;
    }
    
    if (input.order_index !== undefined) {
      updateData.order_index = input.order_index;
    }

    // If no fields to update, return null
    if (Object.keys(updateData).length === 0) {
      return null;
    }

    // Update the multiple choice option
    const result = await db.update(multipleChoiceOptionsTable)
      .set(updateData)
      .where(eq(multipleChoiceOptionsTable.id, input.id))
      .returning()
      .execute();

    // Return null if no option was found/updated
    if (result.length === 0) {
      return null;
    }

    return result[0];
  } catch (error) {
    console.error('Multiple choice option update failed:', error);
    throw error;
  }
}