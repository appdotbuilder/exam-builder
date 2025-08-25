import { useState } from 'react';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Trash2, Edit2, Check, X, Plus, CheckSquare, Calculator } from 'lucide-react';
import { trpc } from '@/utils/trpc';
import type { Question, MultipleChoiceOption, QuestionType } from '../../../server/src/schema';

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

interface QuestionCardProps {
  question: QuestionWithDetails;
  index: number;
  onDelete: () => void;
  onUpdate: (question: Question) => void;
}

export function QuestionCard({ question, index, onDelete, onUpdate }: QuestionCardProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [editedText, setEditedText] = useState(question.question_text);
  const [editedPoints, setEditedPoints] = useState(question.points.toString());
  const [options, setOptions] = useState(question.multipleChoiceOptions || []);
  const [newOptionText, setNewOptionText] = useState('');
  const [expectedAnswer, setExpectedAnswer] = useState(
    question.mathematicsFormulaAnswer?.expected_answer || ''
  );
  const [isLoading, setIsLoading] = useState(false);

  const handleSave = async () => {
    if (!editedText.trim() || !editedPoints.trim()) return;

    setIsLoading(true);
    try {
      const points = parseFloat(editedPoints) || 1;
      await trpc.updateQuestion.mutate({
        id: question.id,
        question_text: editedText.trim(),
        points: points
      });

      onUpdate({
        id: question.id,
        exam_id: 0, // This will be ignored in the update handler anyway
        type: question.type,
        question_text: editedText.trim(),
        points: points,
        order_index: question.order_index,
        created_at: question.created_at
      });

      setIsEditing(false);
    } catch (error) {
      console.error('Failed to update question:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleCancel = () => {
    setEditedText(question.question_text);
    setEditedPoints(question.points.toString());
    setIsEditing(false);
  };

  const handleAddOption = async () => {
    if (!newOptionText.trim()) return;

    try {
      const newOption = await trpc.createMultipleChoiceOption.mutate({
        question_id: question.id,
        option_text: newOptionText.trim(),
        is_correct: options.length === 0, // First option is correct by default
        order_index: options.length
      });

      setOptions(prev => [...prev, newOption]);
      setNewOptionText('');
    } catch (error) {
      console.error('Failed to add option:', error);
    }
  };

  const handleUpdateOption = async (optionId: number, updates: Partial<MultipleChoiceOption>) => {
    try {
      await trpc.updateMultipleChoiceOption.mutate({
        id: optionId,
        ...updates
      });

      setOptions(prev => prev.map(opt => 
        opt.id === optionId ? { ...opt, ...updates } : opt
      ));
    } catch (error) {
      console.error('Failed to update option:', error);
    }
  };

  const handleDeleteOption = async (optionId: number) => {
    try {
      await trpc.deleteMultipleChoiceOption.mutate({ id: optionId });
      setOptions(prev => prev.filter(opt => opt.id !== optionId));
    } catch (error) {
      console.error('Failed to delete option:', error);
    }
  };

  const handleUpdateFormulaAnswer = async () => {
    if (!expectedAnswer.trim()) return;

    try {
      if (question.mathematicsFormulaAnswer && 'id' in question.mathematicsFormulaAnswer) {
        // Update existing answer
        await trpc.updateMathematicsFormulaAnswer.mutate({
          id: question.mathematicsFormulaAnswer.id,
          expected_answer: expectedAnswer.trim()
        });
      } else {
        // Create new answer
        await trpc.createMathematicsFormulaAnswer.mutate({
          question_id: question.id,
          expected_answer: expectedAnswer.trim()
        });
      }
    } catch (error) {
      console.error('Failed to update formula answer:', error);
    }
  };

  const getQuestionIcon = () => {
    return question.type === 'MULTIPLE_CHOICE' 
      ? <CheckSquare className="h-4 w-4 text-green-600" />
      : <Calculator className="h-4 w-4 text-blue-600" />;
  };

  const getQuestionTypeColor = () => {
    return question.type === 'MULTIPLE_CHOICE'
      ? 'bg-green-100 text-green-700'
      : 'bg-blue-100 text-blue-700';
  };

  return (
    <Card className="bg-white/90 backdrop-blur border-0 shadow-md">
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-3">
            {getQuestionIcon()}
            <div className="flex items-center gap-2">
              <span className="text-sm font-medium text-gray-500">Question {index + 1}</span>
              <Badge variant="secondary" className={getQuestionTypeColor()}>
                {question.type === 'MULTIPLE_CHOICE' ? 'Multiple Choice' : 'Math Formula'}
              </Badge>
              <Badge variant="outline" className="text-xs">
                {question.points} point{question.points !== 1 ? 's' : ''}
              </Badge>
            </div>
          </div>
          <div className="flex items-center gap-2">
            {isEditing ? (
              <>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={handleSave}
                  disabled={isLoading}
                  className="h-8"
                >
                  <Check className="h-3 w-3" />
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={handleCancel}
                  disabled={isLoading}
                  className="h-8"
                >
                  <X className="h-3 w-3" />
                </Button>
              </>
            ) : (
              <>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => setIsEditing(true)}
                  className="h-8"
                >
                  <Edit2 className="h-3 w-3" />
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={onDelete}
                  className="h-8 text-red-600 hover:text-red-700"
                >
                  <Trash2 className="h-3 w-3" />
                </Button>
              </>
            )}
          </div>
        </div>
      </CardHeader>
      <CardContent>
        {isEditing ? (
          <div className="space-y-4">
            <div>
              <Input
                value={editedText}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) => setEditedText(e.target.value)}
                placeholder="Question text"
                className="font-medium"
              />
            </div>
            <div className="w-32">
              <Input
                type="number"
                value={editedPoints}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) => setEditedPoints(e.target.value)}
                placeholder="Points"
                min="0.1"
                step="0.1"
              />
            </div>
          </div>
        ) : (
          <p className="font-medium text-gray-900 mb-4">{question.question_text}</p>
        )}

        {/* Multiple Choice Options */}
        {question.type === 'MULTIPLE_CHOICE' && (
          <div className="space-y-3">
            <h4 className="text-sm font-medium text-gray-700">Answer Options:</h4>
            <div className="space-y-2">
              {options.map((option: MultipleChoiceOption, optionIndex: number) => (
                <div key={option.id} className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
                  <span className="text-sm text-gray-500 font-mono w-6">
                    {String.fromCharCode(65 + optionIndex)}.
                  </span>
                  <div className="flex-1">
                    <Input
                      value={option.option_text}
                      onChange={(e: React.ChangeEvent<HTMLInputElement>) => 
                        handleUpdateOption(option.id, { option_text: e.target.value })
                      }
                      onBlur={() => handleUpdateOption(option.id, { option_text: option.option_text })}
                      className="border-0 bg-transparent p-0 focus-visible:ring-0"
                    />
                  </div>
                  <Button
                    size="sm"
                    variant={option.is_correct ? "default" : "outline"}
                    onClick={() => {
                      // Update all options to false first, then set this one to true
                      options.forEach(opt => {
                        if (opt.id !== option.id) {
                          handleUpdateOption(opt.id, { is_correct: false });
                        }
                      });
                      handleUpdateOption(option.id, { is_correct: true });
                    }}
                    className="text-xs"
                  >
                    {option.is_correct ? '✓ Correct' : 'Set Correct'}
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => handleDeleteOption(option.id)}
                    className="text-red-600 hover:text-red-700"
                  >
                    <Trash2 className="h-3 w-3" />
                  </Button>
                </div>
              ))}
              <div className="flex gap-2">
                <Input
                  value={newOptionText}
                  onChange={(e: React.ChangeEvent<HTMLInputElement>) => setNewOptionText(e.target.value)}
                  placeholder="Add new option..."
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      e.preventDefault();
                      handleAddOption();
                    }
                  }}
                />
                <Button onClick={handleAddOption} size="sm" disabled={!newOptionText.trim()}>
                  <Plus className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </div>
        )}

        {/* Mathematics Formula Answer */}
        {question.type === 'MATHEMATICS_FORMULA' && (
          <div className="space-y-3">
            <h4 className="text-sm font-medium text-gray-700">Expected Answer:</h4>
            <div className="flex gap-2">
              <Input
                value={expectedAnswer}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) => setExpectedAnswer(e.target.value)}
                placeholder="Enter expected answer or formula..."
                onBlur={handleUpdateFormulaAnswer}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    e.preventDefault();
                    handleUpdateFormulaAnswer();
                  }
                }}
              />
            </div>
            <p className="text-xs text-gray-500">
              💡 Tip: You can enter mathematical formulas (e.g., "2x + 5") or numerical answers (e.g., "42")
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}