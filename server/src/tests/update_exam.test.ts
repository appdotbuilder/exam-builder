import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { examsTable } from '../db/schema';
import { type UpdateExamInput, type CreateExamInput } from '../schema';
import { updateExam } from '../handlers/update_exam';
import { eq } from 'drizzle-orm';

// Helper function to create a test exam
const createTestExam = async (input: CreateExamInput) => {
  const result = await db.insert(examsTable)
    .values({
      title: input.title,
      description: input.description
    })
    .returning()
    .execute();
  return result[0];
};

describe('updateExam', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  it('should update exam title only', async () => {
    // Create a test exam
    const testExam = await createTestExam({
      title: 'Original Title',
      description: 'Original description'
    });

    const originalUpdatedAt = testExam.updated_at;

    // Wait a bit to ensure timestamp difference
    await new Promise(resolve => setTimeout(resolve, 10));

    // Update only the title
    const updateInput: UpdateExamInput = {
      id: testExam.id,
      title: 'Updated Title'
    };

    const result = await updateExam(updateInput);

    // Verify result
    expect(result).not.toBeNull();
    expect(result!.id).toEqual(testExam.id);
    expect(result!.title).toEqual('Updated Title');
    expect(result!.description).toEqual('Original description'); // Should remain unchanged
    expect(result!.updated_at).toBeInstanceOf(Date);
    expect(result!.updated_at.getTime()).toBeGreaterThan(originalUpdatedAt.getTime());
    expect(result!.created_at).toEqual(testExam.created_at);
  });

  it('should update exam description only', async () => {
    // Create a test exam
    const testExam = await createTestExam({
      title: 'Original Title',
      description: 'Original description'
    });

    const originalUpdatedAt = testExam.updated_at;

    // Wait a bit to ensure timestamp difference
    await new Promise(resolve => setTimeout(resolve, 10));

    // Update only the description
    const updateInput: UpdateExamInput = {
      id: testExam.id,
      description: 'Updated description'
    };

    const result = await updateExam(updateInput);

    // Verify result
    expect(result).not.toBeNull();
    expect(result!.id).toEqual(testExam.id);
    expect(result!.title).toEqual('Original Title'); // Should remain unchanged
    expect(result!.description).toEqual('Updated description');
    expect(result!.updated_at).toBeInstanceOf(Date);
    expect(result!.updated_at.getTime()).toBeGreaterThan(originalUpdatedAt.getTime());
  });

  it('should update both title and description', async () => {
    // Create a test exam
    const testExam = await createTestExam({
      title: 'Original Title',
      description: 'Original description'
    });

    const originalUpdatedAt = testExam.updated_at;

    // Wait a bit to ensure timestamp difference
    await new Promise(resolve => setTimeout(resolve, 10));

    // Update both fields
    const updateInput: UpdateExamInput = {
      id: testExam.id,
      title: 'Updated Title',
      description: 'Updated description'
    };

    const result = await updateExam(updateInput);

    // Verify result
    expect(result).not.toBeNull();
    expect(result!.id).toEqual(testExam.id);
    expect(result!.title).toEqual('Updated Title');
    expect(result!.description).toEqual('Updated description');
    expect(result!.updated_at).toBeInstanceOf(Date);
    expect(result!.updated_at.getTime()).toBeGreaterThan(originalUpdatedAt.getTime());
  });

  it('should update description to null', async () => {
    // Create a test exam with description
    const testExam = await createTestExam({
      title: 'Original Title',
      description: 'Original description'
    });

    // Update description to null
    const updateInput: UpdateExamInput = {
      id: testExam.id,
      description: null
    };

    const result = await updateExam(updateInput);

    // Verify result
    expect(result).not.toBeNull();
    expect(result!.id).toEqual(testExam.id);
    expect(result!.title).toEqual('Original Title');
    expect(result!.description).toBeNull();
  });

  it('should save updated exam to database', async () => {
    // Create a test exam
    const testExam = await createTestExam({
      title: 'Original Title',
      description: 'Original description'
    });

    // Update the exam
    const updateInput: UpdateExamInput = {
      id: testExam.id,
      title: 'Updated Title',
      description: 'Updated description'
    };

    const result = await updateExam(updateInput);

    // Query the database directly to verify the update
    const exams = await db.select()
      .from(examsTable)
      .where(eq(examsTable.id, testExam.id))
      .execute();

    expect(exams).toHaveLength(1);
    expect(exams[0].title).toEqual('Updated Title');
    expect(exams[0].description).toEqual('Updated description');
    expect(exams[0].updated_at).toBeInstanceOf(Date);
    expect(exams[0].updated_at.getTime()).toBeGreaterThan(testExam.updated_at.getTime());
  });

  it('should return null for non-existent exam', async () => {
    const updateInput: UpdateExamInput = {
      id: 99999, // Non-existent ID
      title: 'Updated Title'
    };

    const result = await updateExam(updateInput);

    expect(result).toBeNull();
  });

  it('should update only updated_at timestamp when no other fields provided', async () => {
    // Create a test exam
    const testExam = await createTestExam({
      title: 'Original Title',
      description: 'Original description'
    });

    const originalUpdatedAt = testExam.updated_at;

    // Wait a bit to ensure timestamp difference
    await new Promise(resolve => setTimeout(resolve, 10));

    // Update with only ID (no title or description changes)
    const updateInput: UpdateExamInput = {
      id: testExam.id
    };

    const result = await updateExam(updateInput);

    // Verify result - only updated_at should change
    expect(result).not.toBeNull();
    expect(result!.id).toEqual(testExam.id);
    expect(result!.title).toEqual('Original Title');
    expect(result!.description).toEqual('Original description');
    expect(result!.updated_at).toBeInstanceOf(Date);
    expect(result!.updated_at.getTime()).toBeGreaterThan(originalUpdatedAt.getTime());
  });

  it('should handle multiple exams correctly', async () => {
    // Create multiple test exams
    const exam1 = await createTestExam({
      title: 'Exam 1',
      description: 'Description 1'
    });

    const exam2 = await createTestExam({
      title: 'Exam 2',
      description: 'Description 2'
    });

    // Update only the first exam
    const updateInput: UpdateExamInput = {
      id: exam1.id,
      title: 'Updated Exam 1'
    };

    const result = await updateExam(updateInput);

    // Verify only the first exam was updated
    expect(result).not.toBeNull();
    expect(result!.id).toEqual(exam1.id);
    expect(result!.title).toEqual('Updated Exam 1');

    // Verify the second exam was not affected
    const exam2Check = await db.select()
      .from(examsTable)
      .where(eq(examsTable.id, exam2.id))
      .execute();

    expect(exam2Check[0].title).toEqual('Exam 2');
    expect(exam2Check[0].description).toEqual('Description 2');
  });
});