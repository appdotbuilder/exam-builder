import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import type { QuestionType } from '../../../server/src/schema';
import { CheckSquare, Calculator, GripVertical } from 'lucide-react';

interface QuestionSidebarProps {
  onDragStart: (questionType: QuestionType) => void;
  onDragEnd: () => void;
}

const questionTypes = [
  {
    type: 'MULTIPLE_CHOICE' as QuestionType,
    title: 'Multiple Choice',
    description: 'Question with selectable options',
    icon: CheckSquare,
    color: 'bg-green-50 border-green-200 hover:bg-green-100',
    iconColor: 'text-green-600'
  },
  {
    type: 'MATHEMATICS_FORMULA' as QuestionType,
    title: 'Mathematics Formula',
    description: 'Mathematical equation or calculation',
    icon: Calculator,
    color: 'bg-blue-50 border-blue-200 hover:bg-blue-100',
    iconColor: 'text-blue-600'
  }
];

export function QuestionSidebar({ onDragStart, onDragEnd }: QuestionSidebarProps) {
  const handleDragStart = (e: React.DragEvent, questionType: QuestionType) => {
    e.dataTransfer.effectAllowed = 'copy';
    onDragStart(questionType);
  };

  return (
    <Card className="h-full bg-white/80 backdrop-blur border-0 shadow-md">
      <CardHeader className="pb-4">
        <CardTitle className="text-lg font-semibold flex items-center gap-2">
          🧩 Question Types
        </CardTitle>
        <CardDescription>
          Drag question types to the canvas to add them to your exam
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-3">
        {questionTypes.map((questionType) => {
          const Icon = questionType.icon;
          return (
            <div
              key={questionType.type}
              draggable
              onDragStart={(e) => handleDragStart(e, questionType.type)}
              onDragEnd={onDragEnd}
              className={`p-4 rounded-lg border-2 cursor-grab active:cursor-grabbing transition-colors duration-200 ${questionType.color}`}
            >
              <div className="flex items-start gap-3">
                <div className="flex items-center gap-2 flex-1">
                  <Icon className={`h-5 w-5 ${questionType.iconColor}`} />
                  <div className="flex-1">
                    <h3 className="font-medium text-gray-900 text-sm">
                      {questionType.title}
                    </h3>
                    <p className="text-xs text-gray-600 mt-1">
                      {questionType.description}
                    </p>
                  </div>
                </div>
                <GripVertical className="h-4 w-4 text-gray-400 flex-shrink-0" />
              </div>
            </div>
          );
        })}

        <div className="mt-6 p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
          <h4 className="font-medium text-yellow-800 text-sm mb-2">💡 How to use</h4>
          <ul className="text-xs text-yellow-700 space-y-1">
            <li>• Drag question types to canvas</li>
            <li>• Click questions to edit them</li>
            <li>• Questions auto-save changes</li>
          </ul>
        </div>
      </CardContent>
    </Card>
  );
}