import { Card } from "./ui/card";
import { Progress } from "./ui/progress";
import { Badge } from "./ui/badge";
import { Button } from "./ui/button";
import { Target, TrendingUp, Calendar } from "lucide-react";

interface Goal {
  id: string;
  title: string;
  description: string;
  category: string;
  progress: number;
  deadline: string;
  status: "on-track" | "at-risk" | "completed";
}

interface GoalCardProps {
  goal: Goal;
  onUpdateProgress: (id: string) => void;
  onViewDetails: (id: string) => void;
}

export function GoalCard({ goal, onUpdateProgress, onViewDetails }: GoalCardProps) {
  const statusColors = {
    "on-track": "bg-green-100 text-green-800",
    "at-risk": "bg-yellow-100 text-yellow-800",
    "completed": "bg-blue-100 text-blue-800",
  };

  return (
    <Card className="p-6 hover:shadow-lg transition-shadow">
      <div className="flex items-start justify-between mb-4">
        <div className="flex items-start gap-3">
          <div className="p-2 bg-blue-50 rounded-lg">
            <Target className="w-5 h-5 text-blue-600" />
          </div>
          <div>
            <h3 className="font-semibold text-lg">{goal.title}</h3>
            <p className="text-gray-600 text-sm mt-1">{goal.description}</p>
          </div>
        </div>
        <Badge className={statusColors[goal.status]}>
          {goal.status === "on-track" ? "On Track" : goal.status === "at-risk" ? "At Risk" : "Completed"}
        </Badge>
      </div>

      <div className="space-y-4">
        <div>
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm text-gray-600">Progress</span>
            <span className="text-sm font-semibold">{goal.progress}%</span>
          </div>
          <Progress value={goal.progress} className="h-2" />
        </div>

        <div className="flex items-center justify-between pt-4 border-t">
          <div className="flex items-center gap-4 text-sm text-gray-600">
            <div className="flex items-center gap-1">
              <Calendar className="w-4 h-4" />
              <span>{goal.deadline}</span>
            </div>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" size="sm" onClick={() => onUpdateProgress(goal.id)}>
              Update Progress
            </Button>
            <Button size="sm" onClick={() => onViewDetails(goal.id)}>
              View Details
            </Button>
          </div>
        </div>
      </div>
    </Card>
  );
}
