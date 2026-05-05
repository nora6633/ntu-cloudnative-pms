import { Card } from './ui/card';
import { Badge } from './ui/badge';
import { Button } from './ui/button';
import { Target, Calendar, Pencil, Trash2 } from 'lucide-react';
import type { GoalDTO } from '../../api';

interface EvaluationGoalCardProps {
  status: string;
  goal: GoalDTO;
  onUpdate: (goal: GoalDTO) => void;
  onDelete: (goal: GoalDTO) => void;
}

export function EvaluationGoalCard({ status, goal, onUpdate, onDelete }: EvaluationGoalCardProps) {
  return (
    <Card className="p-6 hover:shadow-md transition-shadow">
      <div className="flex items-start gap-3 mb-4">
        <div className="p-2 bg-blue-50 rounded-lg shrink-0">
          <Target className="w-5 h-5 text-blue-600" />
        </div>
        <div className="flex-1 min-w-0">
          <h3 className="font-semibold text-lg text-gray-900 leading-snug">{goal.definition}</h3>
          <p className="text-sm text-gray-500 mt-1">{goal.relevance}</p>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4 mt-4 pt-4 border-t">
        <div>
          <div className="text-xs text-gray-500 mb-1">Metric</div>
          <p className="text-sm font-medium text-gray-900">{goal.metric}</p>
        </div>
        <div>
          <div className="text-xs text-gray-500 mb-1 flex items-center gap-1">
            <Calendar className="w-3 h-3" />Deadline
          </div>
          <p className="text-sm font-medium text-gray-900">{goal.deadline ?? '—'}</p>
        </div>
      </div>

      {goal.criteria && goal.criteria.length > 0 && (
        <div className="mt-3 flex flex-wrap gap-1.5">
          {goal.criteria.map((c) => (
            <Badge key={c} variant="outline" className="text-xs">{c}</Badge>
          ))}
        </div>
      )}

      {status === 'Initial' && (
        <div className="flex gap-2 mt-4 pt-4 border-t">
            <Button
              variant="outline"
              size="sm"
              onClick={() => onUpdate(goal)}
            className="flex-1"
          >
            <Pencil className="w-4 h-4 mr-2" />Update
          </Button>
          <Button
            variant="destructive"
            size="sm"
            onClick={() => onDelete(goal)}
          >
            <Trash2 className="w-4 h-4 mr-2" />Delete
          </Button>
        </div>
      )}
    </Card>
  );
}
