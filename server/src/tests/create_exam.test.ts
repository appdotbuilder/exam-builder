import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { examsTable } from '../db/schema';
import { type CreateExamInput } from '../schema';
import { createExam } from '../handlers/create_exam';
import { eq } from 'drizzle-orm';

// Simple test input with description
const testInputWithDescription: CreateExamInput = {
  title: 'Mathematics Final Exam',
  description: 'Comprehensive mathematics exam covering algebra and calculus'
};

// Test input with null description
const testInputWithoutDescription: CreateExamInput = {
  title: 'Physics Quiz',
  description: null
};

describe('createExam', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  it('should create an exam with description', async () => {
    const result = await createExam(testInputWithDescription);

    // Basic field validation
    expect(result.title).toEqual('Mathematics Final Exam');
    expect(result.description).toEqual('Comprehensive mathematics exam covering algebra and calculus');
    expect(result.id).toBeDefined();
    expect(typeof result.id).toBe('number');
    expect(result.created_at).toBeInstanceOf(Date);
    expect(result.updated_at).toBeInstanceOf(Date);
  });

  it('should create an exam without description', async () => {
    const result = await createExam(testInputWithoutDescription);

    // Basic field validation
    expect(result.title).toEqual('Physics Quiz');
    expect(result.description).toBeNull();
    expect(result.id).toBeDefined();
    expect(typeof result.id).toBe('number');
    expect(result.created_at).toBeInstanceOf(Date);
    expect(result.updated_at).toBeInstanceOf(Date);
  });

  it('should save exam to database', async () => {
    const result = await createExam(testInputWithDescription);

    // Query using proper drizzle syntax
    const exams = await db.select()
      .from(examsTable)
      .where(eq(examsTable.id, result.id))
      .execute();

    expect(exams).toHaveLength(1);
    expect(exams[0].title).toEqual('Mathematics Final Exam');
    expect(exams[0].description).toEqual('Comprehensive mathematics exam covering algebra and calculus');
    expect(exams[0].created_at).toBeInstanceOf(Date);
    expect(exams[0].updated_at).toBeInstanceOf(Date);
  });

  it('should generate unique IDs for multiple exams', async () => {
    const exam1 = await createExam({
      title: 'First Exam',
      description: 'First description'
    });

    const exam2 = await createExam({
      title: 'Second Exam',
      description: 'Second description'
    });

    expect(exam1.id).not.toEqual(exam2.id);
    expect(typeof exam1.id).toBe('number');
    expect(typeof exam2.id).toBe('number');
  });

  it('should handle timestamps correctly', async () => {
    const beforeCreation = new Date();
    const result = await createExam(testInputWithDescription);
    const afterCreation = new Date();

    // Verify timestamps are within reasonable bounds
    expect(result.created_at.getTime()).toBeGreaterThanOrEqual(beforeCreation.getTime());
    expect(result.created_at.getTime()).toBeLessThanOrEqual(afterCreation.getTime());
    expect(result.updated_at.getTime()).toBeGreaterThanOrEqual(beforeCreation.getTime());
    expect(result.updated_at.getTime()).toBeLessThanOrEqual(afterCreation.getTime());
  });

  it('should create multiple exams in database', async () => {
    // Create multiple exams
    await createExam({ title: 'Exam 1', description: 'Description 1' });
    await createExam({ title: 'Exam 2', description: null });
    await createExam({ title: 'Exam 3', description: 'Description 3' });

    // Verify all are saved
    const allExams = await db.select()
      .from(examsTable)
      .execute();

    expect(allExams).toHaveLength(3);
    
    // Check that all have different IDs
    const ids = allExams.map(exam => exam.id);
    const uniqueIds = new Set(ids);
    expect(uniqueIds.size).toEqual(3);

    // Verify content
    const titles = allExams.map(exam => exam.title).sort();
    expect(titles).toEqual(['Exam 1', 'Exam 2', 'Exam 3']);
  });
});