import { Card } from "./ui/card";
import { Button } from "./ui/button";
import { Target, Calendar, TrendingUp, Trash2, Pencil } from "lucide-react";

interface EvaluationGoal {
  id: string;
  title: string;
  description: string;
  metric: string;
  targetValue: string;
  deadline: string;
}

interface EvaluationGoalCardProps {
  goal: EvaluationGoal;
  onUpdate: (id: string) => void;
  onDelete: (id: string) => void;
}

export function EvaluationGoalCard({ goal, onUpdate, onDelete }: EvaluationGoalCardProps) {
  return (
    <Card className="p-6 hover:shadow-md transition-shadow">
      <div className="flex items-start justify-between mb-4">
        <div className="flex items-start gap-3 flex-1">
          <div className="p-2 bg-blue-50 rounded-lg">
            <Target className="w-5 h-5 text-blue-600" />
          </div>
          <div className="flex-1">
            <h3 className="font-semibold text-lg text-gray-900">{goal.title}</h3>
            <p className="text-gray-600 text-sm mt-1">{goal.description}</p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-3 gap-4 mt-4 pt-4 border-t">
        <div>
          <div className="text-xs text-gray-500 mb-1">Metric</div>
          <p className="text-sm font-medium text-gray-900">{goal.metric}</p>
        </div>
        <div>
          <div className="text-xs text-gray-500 mb-1">Target Value</div>
          <p className="text-sm font-medium text-gray-900">{goal.targetValue}</p>
        </div>
        <div>
          <div className="text-xs text-gray-500 mb-1">Deadline</div>
          <p className="text-sm font-medium text-gray-900">{goal.deadline}</p>
        </div>
      </div>

      <div className="flex gap-2 mt-4 pt-4 border-t">
        <Button variant="outline" size="sm" onClick={() => onUpdate(goal.id)} className="flex-1">
          <Pencil className="w-4 h-4 mr-2" />
          Update
        </Button>
        <Button variant="destructive" size="sm" onClick={() => onDelete(goal.id)}>
          <Trash2 className="w-4 h-4 mr-2" />
          Delete Goal
        </Button>
      </div>
    </Card>
  );
}
