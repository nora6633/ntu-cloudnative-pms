import { Card } from './ui/card';
import { Badge } from './ui/badge';
import { Button } from './ui/button';
import { Target, Calendar, MessageSquare } from 'lucide-react';
import type { GoalDTO } from '../../api';

interface GoalCardProps {
  goal: GoalDTO;
  onAddProgress: (goal: GoalDTO) => void;
  onViewDetails: (goal: GoalDTO) => void;
}

export function GoalCard({ goal, onAddProgress, onViewDetails }: GoalCardProps) {
  const latest = goal.progresses?.at(-1);

  return (
    <Card className="p-6 hover:shadow-lg transition-shadow">
      <div className="flex items-start gap-3 mb-4">
        <div className="p-2 bg-blue-50 rounded-lg shrink-0">
          <Target className="w-5 h-5 text-blue-600" />
        </div>
        <div className="flex-1 min-w-0">
          <h3 className="font-semibold text-lg leading-snug">{goal.definition}</h3>
          <p className="text-gray-500 text-sm mt-1 line-clamp-2">{goal.relevance}</p>
        </div>
      </div>

      {goal.criteria && goal.criteria.length > 0 && (
        <div className="flex flex-wrap gap-1.5 mb-4">
          {goal.criteria.map((c) => (
            <Badge key={c} variant="outline" className="text-xs">{c}</Badge>
          ))}
        </div>
      )}

      {latest && (
        <div className="flex items-start gap-2 bg-gray-50 rounded-lg p-3 mb-4">
          <MessageSquare className="w-4 h-4 text-gray-400 shrink-0 mt-0.5" />
          <div className="min-w-0">
            <p className="text-xs text-gray-400 mb-0.5">{latest.timestamp ?? 'Latest update'}</p>
            <p className="text-sm text-gray-700 line-clamp-2">{latest.description}</p>
          </div>
        </div>
      )}

      <div className="flex items-center justify-between pt-4 border-t">
        <div className="flex items-center gap-1 text-sm text-gray-500">
          <Calendar className="w-4 h-4" />
          <span>{goal.deadline ?? 'No deadline'}</span>
        </div>
        <div className="flex gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => onAddProgress(goal)}
          >
            Add Progress
          </Button>
          <Button
            size="sm"
            onClick={() => onViewDetails(goal)}
          >
            View Details
          </Button>
        </div>
      </div>
    </Card>
  );
}
