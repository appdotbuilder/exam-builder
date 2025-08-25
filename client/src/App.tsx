import { useState, useEffect, useCallback } from 'react';
import { trpc } from '@/utils/trpc';
import type { Exam, ExamWithQuestions } from '../../server/src/schema';
import { ExamList } from '@/components/ExamList';
import { ExamBuilder } from '@/components/ExamBuilder';
import { CreateExamDialog } from '@/components/CreateExamDialog';
import { Button } from '@/components/ui/button';
import { Plus, BookOpen } from 'lucide-react';

function App() {
  const [exams, setExams] = useState<Exam[]>([]);
  const [selectedExam, setSelectedExam] = useState<ExamWithQuestions | null>(null);
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [view, setView] = useState<'list' | 'builder'>('list');

  const loadExams = useCallback(async () => {
    try {
      const result = await trpc.getExams.query();
      setExams(result);
    } catch (error) {
      console.error('Failed to load exams:', error);
    }
  }, []);

  useEffect(() => {
    loadExams();
  }, [loadExams]);

  const handleCreateExam = async (examData: { title: string; description: string | null }) => {
    setIsLoading(true);
    try {
      const newExam = await trpc.createExam.mutate(examData);
      setExams(prev => [...prev, newExam]);
      setShowCreateDialog(false);
    } catch (error) {
      console.error('Failed to create exam:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleOpenExam = async (examId: number) => {
    try {
      const exam = await trpc.getExamById.query({ id: examId });
      if (exam) {
        setSelectedExam(exam);
        setView('builder');
      }
    } catch (error) {
      console.error('Failed to open exam:', error);
    }
  };

  const handleBackToList = () => {
    setView('list');
    setSelectedExam(null);
    loadExams(); // Refresh the list
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50">
      <div className="container mx-auto p-6">
        {view === 'list' ? (
          <>
            <div className="flex items-center justify-between mb-8">
              <div className="flex items-center gap-3">
                <BookOpen className="h-8 w-8 text-indigo-600" />
                <h1 className="text-3xl font-bold text-gray-900">📚 Exam Builder</h1>
              </div>
              <Button 
                onClick={() => setShowCreateDialog(true)}
                className="flex items-center gap-2 bg-indigo-600 hover:bg-indigo-700"
              >
                <Plus className="h-4 w-4" />
                Create New Exam
              </Button>
            </div>

            <ExamList 
              exams={exams} 
              onOpenExam={handleOpenExam}
            />

            <CreateExamDialog
              open={showCreateDialog}
              onOpenChange={setShowCreateDialog}
              onCreateExam={handleCreateExam}
              isLoading={isLoading}
            />
          </>
        ) : (
          selectedExam && (
            <ExamBuilder 
              exam={selectedExam}
              onBack={handleBackToList}
            />
          )
        )}
      </div>
    </div>
  );
}

export default App;