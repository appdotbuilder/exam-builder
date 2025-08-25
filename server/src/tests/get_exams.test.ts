import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { examsTable } from '../db/schema';
import { type CreateExamInput } from '../schema';
import { getExams } from '../handlers/get_exams';

// Test exam data
const testExam1: CreateExamInput = {
  title: 'Math Exam 1',
  description: 'Basic mathematics examination'
};

const testExam2: CreateExamInput = {
  title: 'Science Quiz',
  description: null
};

const testExam3: CreateExamInput = {
  title: 'History Test',
  description: 'World War II history examination'
};

describe('getExams', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  it('should return empty array when no exams exist', async () => {
    const result = await getExams();
    
    expect(result).toEqual([]);
    expect(Array.isArray(result)).toBe(true);
  });

  it('should return all exams from database', async () => {
    // Create test exams
    await db.insert(examsTable)
      .values([
        {
          title: testExam1.title,
          description: testExam1.description
        },
        {
          title: testExam2.title,
          description: testExam2.description
        },
        {
          title: testExam3.title,
          description: testExam3.description
        }
      ])
      .execute();

    const result = await getExams();

    expect(result).toHaveLength(3);
    expect(Array.isArray(result)).toBe(true);

    // Check that all exams are present
    const titles = result.map(exam => exam.title);
    expect(titles).toContain('Math Exam 1');
    expect(titles).toContain('Science Quiz');
    expect(titles).toContain('History Test');
  });

  it('should return exams with correct structure and data types', async () => {
    // Create a single test exam
    await db.insert(examsTable)
      .values({
        title: testExam1.title,
        description: testExam1.description
      })
      .execute();

    const result = await getExams();

    expect(result).toHaveLength(1);
    
    const exam = result[0];
    
    // Verify all required fields are present
    expect(exam.id).toBeDefined();
    expect(typeof exam.id).toBe('number');
    expect(exam.title).toEqual('Math Exam 1');
    expect(typeof exam.title).toBe('string');
    expect(exam.description).toEqual('Basic mathematics examination');
    expect(typeof exam.description).toBe('string');
    expect(exam.created_at).toBeInstanceOf(Date);
    expect(exam.updated_at).toBeInstanceOf(Date);
  });

  it('should handle exams with null descriptions', async () => {
    // Create exam with null description
    await db.insert(examsTable)
      .values({
        title: testExam2.title,
        description: testExam2.description
      })
      .execute();

    const result = await getExams();

    expect(result).toHaveLength(1);
    
    const exam = result[0];
    expect(exam.title).toEqual('Science Quiz');
    expect(exam.description).toBeNull();
  });

  it('should return exams in database insertion order', async () => {
    // Insert exams in specific order
    await db.insert(examsTable)
      .values({
        title: 'First Exam',
        description: 'First exam description'
      })
      .execute();

    await db.insert(examsTable)
      .values({
        title: 'Second Exam',
        description: 'Second exam description'
      })
      .execute();

    await db.insert(examsTable)
      .values({
        title: 'Third Exam',
        description: 'Third exam description'
      })
      .execute();

    const result = await getExams();

    expect(result).toHaveLength(3);
    
    // Check that IDs are in ascending order (insertion order)
    expect(result[0].id < result[1].id).toBe(true);
    expect(result[1].id < result[2].id).toBe(true);
    
    // Verify the order by title
    expect(result[0].title).toEqual('First Exam');
    expect(result[1].title).toEqual('Second Exam');
    expect(result[2].title).toEqual('Third Exam');
  });

  it('should verify timestamps are set correctly', async () => {
    const beforeInsert = new Date();
    
    await db.insert(examsTable)
      .values({
        title: testExam1.title,
        description: testExam1.description
      })
      .execute();

    const afterInsert = new Date();
    const result = await getExams();

    expect(result).toHaveLength(1);
    
    const exam = result[0];
    
    // Verify timestamps are within expected range
    expect(exam.created_at >= beforeInsert).toBe(true);
    expect(exam.created_at <= afterInsert).toBe(true);
    expect(exam.updated_at >= beforeInsert).toBe(true);
    expect(exam.updated_at <= afterInsert).toBe(true);
    
    // created_at and updated_at should be very close or equal on creation
    const timeDiff = Math.abs(exam.updated_at.getTime() - exam.created_at.getTime());
    expect(timeDiff).toBeLessThan(1000); // Less than 1 second difference
  });
});