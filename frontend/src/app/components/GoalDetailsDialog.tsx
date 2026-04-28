import { Dialog, DialogContent, DialogHeader, DialogTitle } from "./ui/dialog";
import { Progress } from "./ui/progress";
import { Badge } from "./ui/badge";
import { ScrollArea } from "./ui/scroll-area";
import { Calendar, TrendingUp, Clock } from "lucide-react";

interface Goal {
  id: string;
  title: string;
  description: string;
  metric: string;
  targetValue: string;
  progress: number;
  deadline: string;
  status: "on-track" | "at-risk" | "completed";
  progressHistory?: Array<{
    date: string;
    progress: number;
    note?: string;
  }>;
}

interface GoalDetailsDialogProps {
  open: boolean;
  onClose: () => void;
  goal: Goal | null;
}

export function GoalDetailsDialog({ open, onClose, goal }: GoalDetailsDialogProps) {
  if (!goal) return null;

  const statusColors = {
    "on-track": "bg-green-100 text-green-800",
    "at-risk": "bg-yellow-100 text-yellow-800",
    "completed": "bg-blue-100 text-blue-800",
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[600px] max-h-[80vh]">
        <DialogHeader>
          <DialogTitle>{goal.title}</DialogTitle>
        </DialogHeader>
        <ScrollArea className="max-h-[60vh] pr-4">
          <div className="space-y-6 mt-4">
            <div>
              <p className="text-gray-600">{goal.description}</p>
            </div>

            <div className="flex items-center gap-4 flex-wrap">
              <Badge className={statusColors[goal.status]}>
                {goal.status === "on-track" ? "On Track" : goal.status === "at-risk" ? "At Risk" : "Completed"}
              </Badge>
              <div>
                <div className="text-xs text-gray-500 mb-1">Metric</div>
                <p className="text-sm font-medium text-gray-900">{goal.metric}</p>
              </div>
              <div>
                <div className="text-xs text-gray-500 mb-1">Target Value</div>
                <p className="text-sm font-medium text-gray-900">{goal.targetValue}</p>
              </div>
              <div className="flex items-center gap-2 text-sm text-gray-600">
                <Calendar className="w-4 h-4" />
                <span>Due: {goal.deadline}</span>
              </div>
            </div>

            <div>
              <div className="flex items-center justify-between mb-2">
                <span className="font-semibold">Overall Progress</span>
                <span className="text-2xl font-bold text-blue-600">{goal.progress}%</span>
              </div>
              <Progress value={goal.progress} className="h-3" />
            </div>

            {goal.progressHistory && goal.progressHistory.length > 0 && (
              <div>
                <h4 className="font-semibold mb-4">Progress History</h4>
                <div className="space-y-4">
                  {goal.progressHistory.map((entry, index) => (
                    <div key={index} className="border-l-2 border-blue-200 pl-4 pb-4">
                      <div className="flex items-center gap-2 mb-1">
                        <Clock className="w-4 h-4 text-gray-400" />
                        <span className="text-sm text-gray-600">{entry.date}</span>
                        <Badge variant="outline" className="ml-auto">
                          {entry.progress}%
                        </Badge>
                      </div>
                      {entry.note && (
                        <p className="text-sm text-gray-700 mt-2">{entry.note}</p>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </ScrollArea>
      </DialogContent>
    </Dialog>
  );
}
