import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import type { Exam } from '../../../server/src/schema';
import { Edit, Clock, FileText } from 'lucide-react';

interface ExamListProps {
  exams: Exam[];
  onOpenExam: (examId: number) => void;
}

export function ExamList({ exams, onOpenExam }: ExamListProps) {
  if (exams.length === 0) {
    return (
      <div className="text-center py-12">
        <div className="mx-auto w-24 h-24 bg-gray-100 rounded-full flex items-center justify-center mb-4">
          <FileText className="h-12 w-12 text-gray-400" />
        </div>
        <h3 className="text-lg font-medium text-gray-900 mb-2">No exams yet</h3>
        <p className="text-gray-500 mb-4">Create your first exam to get started!</p>
      </div>
    );
  }

  return (
    <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
      {exams.map((exam: Exam) => (
        <Card key={exam.id} className="group hover:shadow-lg transition-shadow duration-200 border-0 shadow-md bg-white/80 backdrop-blur">
          <CardHeader className="pb-3">
            <div className="flex items-start justify-between">
              <div className="flex-1">
                <CardTitle className="text-lg font-semibold text-gray-900 mb-2">
                  {exam.title}
                </CardTitle>
                {exam.description && (
                  <CardDescription className="text-sm text-gray-600 line-clamp-2">
                    {exam.description}
                  </CardDescription>
                )}
              </div>
              <Badge variant="secondary" className="ml-2 bg-indigo-100 text-indigo-700">
                Draft
              </Badge>
            </div>
          </CardHeader>
          <CardContent className="pt-0">
            <div className="flex items-center gap-4 text-xs text-gray-500 mb-4">
              <div className="flex items-center gap-1">
                <Clock className="h-3 w-3" />
                Created {exam.created_at.toLocaleDateString()}
              </div>
            </div>
            <Button 
              onClick={() => onOpenExam(exam.id)}
              className="w-full bg-indigo-600 hover:bg-indigo-700 text-white"
            >
              <Edit className="h-4 w-4 mr-2" />
              Edit Exam
            </Button>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}