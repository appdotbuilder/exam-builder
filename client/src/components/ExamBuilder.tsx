import { useState, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import type { ExamWithQuestions, Question, QuestionType, MultipleChoiceOption } from '../../../server/src/schema';
import { QuestionSidebar } from '@/components/QuestionSidebar';
import { QuestionCard } from '@/components/QuestionCard';
import { ArrowLeft, Plus, Save } from 'lucide-react';
import { trpc } from '@/utils/trpc';

interface ExamBuilderProps {
  exam: ExamWithQuestions;
  onBack: () => void;
}

type QuestionWithDetails = {
  id: number;
  type: QuestionType;
  question_text: string;
  points: number;
  order_index: number;
  created_at: Date;
  multipleChoiceOptions?: MultipleChoiceOption[];
  mathematicsFormulaAnswer?: { id: number; question_id: number; expected_answer: string } | null;
};

export function ExamBuilder({ exam, onBack }: ExamBuilderProps) {
  const [questions, setQuestions] = useState<QuestionWithDetails[]>(exam.questions || []);
  const [draggedQuestionType, setDraggedQuestionType] = useState<QuestionType | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const handleDragStart = (questionType: QuestionType) => {
    setDraggedQuestionType(questionType);
  };

  const handleDragEnd = () => {
    setDraggedQuestionType(null);
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
  };

  const handleDrop = async (e: React.DragEvent) => {
    e.preventDefault();
    if (!draggedQuestionType) return;

    setIsLoading(true);
    try {
      const newQuestion = await trpc.createQuestion.mutate({
        exam_id: exam.id,
        type: draggedQuestionType,
        question_text: `New ${draggedQuestionType === 'MULTIPLE_CHOICE' ? 'Multiple Choice' : 'Mathematics Formula'} Question`,
        points: 1,
        order_index: questions.length
      });

      // Transform the created question to match the ExamWithQuestions structure
      const questionWithDetails: QuestionWithDetails = {
        id: newQuestion.id,
        type: newQuestion.type,
        question_text: newQuestion.question_text,
        points: newQuestion.points,
        order_index: newQuestion.order_index,
        created_at: newQuestion.created_at,
        multipleChoiceOptions: draggedQuestionType === 'MULTIPLE_CHOICE' ? [] : undefined,
        mathematicsFormulaAnswer: draggedQuestionType === 'MATHEMATICS_FORMULA' ? null : undefined
      };

      setQuestions(prev => [...prev, questionWithDetails]);
    } catch (error) {
      console.error('Failed to create question:', error);
    } finally {
      setIsLoading(false);
      setDraggedQuestionType(null);
    }
  };

  const handleDeleteQuestion = async (questionId: number) => {
    try {
      await trpc.deleteQuestion.mutate({ id: questionId });
      setQuestions(prev => prev.filter(q => q.id !== questionId));
    } catch (error) {
      console.error('Failed to delete question:', error);
    }
  };

  const handleUpdateQuestion = useCallback((updatedQuestion: Question) => {
    setQuestions(prev => prev.map(q => 
      q.id === updatedQuestion.id 
        ? { 
            ...q, 
            question_text: updatedQuestion.question_text,
            points: updatedQuestion.points,
            order_index: updatedQuestion.order_index
          }
        : q
    ));
  }, []);

  const totalPoints = questions.reduce((sum, q) => sum + q.points, 0);

  return (
    <div className="flex gap-6 h-[calc(100vh-6rem)]">
      {/* Sidebar */}
      <div className="w-80 flex-shrink-0">
        <QuestionSidebar 
          onDragStart={handleDragStart}
          onDragEnd={handleDragEnd}
        />
      </div>

      {/* Main Content */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Header */}
        <div className="mb-6">
          <div className="flex items-center justify-between mb-4">
            <Button
              variant="outline"
              onClick={onBack}
              className="flex items-center gap-2"
            >
              <ArrowLeft className="h-4 w-4" />
              Back to Exams
            </Button>
            <div className="flex items-center gap-2">
              <Badge variant="secondary" className="bg-green-100 text-green-700">
                {questions.length} Question{questions.length !== 1 ? 's' : ''}
              </Badge>
              <Badge variant="secondary" className="bg-blue-100 text-blue-700">
                {totalPoints} Point{totalPoints !== 1 ? 's' : ''}
              </Badge>
            </div>
          </div>

          <div className="mb-4">
            <h1 className="text-2xl font-bold text-gray-900 mb-2">{exam.title}</h1>
            {exam.description && (
              <p className="text-gray-600">{exam.description}</p>
            )}
          </div>
        </div>

        {/* Canvas */}
        <div 
          className={`flex-1 overflow-auto ${
            draggedQuestionType ? 'bg-blue-50 border-2 border-dashed border-blue-300' : 'bg-gray-50'
          } rounded-lg p-6 transition-colors duration-200`}
          onDragOver={handleDragOver}
          onDrop={handleDrop}
        >
          {questions.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full text-center">
              <div className="w-20 h-20 bg-gray-200 rounded-full flex items-center justify-center mb-4">
                <Plus className="h-10 w-10 text-gray-400" />
              </div>
              <h3 className="text-lg font-medium text-gray-900 mb-2">
                {draggedQuestionType ? 'Drop to add question' : 'No questions yet'}
              </h3>
              <p className="text-gray-500 max-w-sm">
                {draggedQuestionType 
                  ? 'Release to add this question type to your exam'
                  : 'Drag question types from the sidebar to start building your exam'
                }
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              {questions.map((question, index) => (
                <QuestionCard
                  key={question.id}
                  question={question}
                  index={index}
                  onDelete={() => handleDeleteQuestion(question.id)}
                  onUpdate={handleUpdateQuestion}
                />
              ))}
              {draggedQuestionType && (
                <div className="border-2 border-dashed border-blue-300 rounded-lg p-8 text-center text-blue-600">
                  Drop here to add {draggedQuestionType === 'MULTIPLE_CHOICE' ? 'Multiple Choice' : 'Mathematics Formula'} question
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}