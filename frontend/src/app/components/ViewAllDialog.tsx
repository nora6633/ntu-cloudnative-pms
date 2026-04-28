import { useState, useEffect } from "react";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle,
} from "./ui/dialog";
import { Button } from "./ui/button";
import { ScrollArea } from "./ui/scroll-area";
import { Badge } from "./ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "./ui/avatar";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "./ui/tabs";
import { Star, Eye, Target, Calendar, TrendingUp } from "lucide-react";
import type { ViewAllEmployee, EmployeeGoal } from "../types";

// ── shared helpers ────────────────────────────────────────────────────────
function getInitials(name: string) {
  return name.split(" ").map((n) => n[0]).join("").toUpperCase();
}

const CRITERIA = [
  { name: "Business Impact", description: "Demonstrates measurable contribution to business outcomes, revenue growth, cost savings, or strategic initiatives." },
  { name: "Delivery",        description: "Consistently delivers high-quality work on time. Manages priorities effectively and meets deadlines." },
  { name: "Quality",         description: "Produces work that meets or exceeds standards with attention to detail and commitment to excellence." },
  { name: "Innovation",      description: "Brings creative solutions to problems and contributes new ideas that improve processes or products." },
  { name: "Collaboration",   description: "Works effectively with others, communicates clearly, and contributes to a positive team culture." },
];

function StarDisplay({ rating }: { rating: number }) {
  return (
    <div className="flex gap-1">
      {[1, 2, 3, 4, 5].map((star) => (
        <Star key={star} className={`w-5 h-5 ${star <= rating ? "fill-yellow-400 text-yellow-400" : "fill-none text-gray-300"}`} />
      ))}
    </div>
  );
}

// ── Progress history sub-dialog ───────────────────────────────────────────
function ProgressHistoryDialog({ goal, onClose }: { goal: EmployeeGoal | null; onClose: () => void }) {
  return (
    <Dialog open={!!goal} onOpenChange={(o) => { if (!o) onClose(); }}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>{goal?.title}</DialogTitle>
        </DialogHeader>
        <ScrollArea className="max-h-[55vh] pr-4">
          <div className="space-y-4 mt-4">
            {goal?.progressHistory?.map((entry, i) => (
              <div key={i} className="border-l-2 border-blue-200 pl-4 pb-4">
                <div className="flex items-center gap-2 mb-1">
                  <span className="text-sm text-gray-500">{entry.date}</span>
                  <Badge variant="outline" className="ml-auto">{entry.progress}%</Badge>
                </div>
                {entry.note && <p className="text-sm text-gray-700 mt-1">{entry.note}</p>}
              </div>
            ))}
          </div>
        </ScrollArea>
      </DialogContent>
    </Dialog>
  );
}

// ── Goal-only view (Pending_goal_approval / Working) ──────────────────────
function GoalsOnlyContent({ goals }: { goals: EmployeeGoal[] }) {
  return (
    <div className="space-y-4 mt-4">
      <h3 className="font-semibold text-lg">Submitted Goals</h3>
      {goals.length === 0 ? (
        <p className="text-gray-500 text-sm">No goals submitted.</p>
      ) : (
        goals.map((goal, i) => (
          <div key={i} className="border rounded-lg p-4 bg-gray-50">
            <div className="flex items-start gap-3 mb-3">
              <div className="p-2 bg-blue-50 rounded-lg shrink-0">
                <Target className="w-4 h-4 text-blue-600" />
              </div>
              <div className="flex-1">
                <h4 className="font-semibold text-gray-900">{goal.title}</h4>
                <p className="text-sm text-gray-600 mt-1">{goal.description}</p>
              </div>
            </div>
            <div className="grid grid-cols-3 gap-4 mt-3 pt-3 border-t">
              <div>
                <div className="flex items-center gap-1 text-xs text-gray-500 mb-1">
                  <TrendingUp className="w-3 h-3" /><span>Metric</span>
                </div>
                <p className="text-sm font-medium text-gray-900">{goal.metric}</p>
              </div>
              <div>
                <div className="text-xs text-gray-500 mb-1">Target Value</div>
                <p className="text-sm font-medium text-gray-900">{goal.targetValue}</p>
              </div>
              <div>
                <div className="flex items-center gap-1 text-xs text-gray-500 mb-1">
                  <Calendar className="w-3 h-3" /><span>Due Date</span>
                </div>
                <p className="text-sm font-medium text-gray-900">{goal.dueDate}</p>
              </div>
            </div>
          </div>
        ))
      )}
    </div>
  );
}

// ── Goals + progress view (Review) ────────────────────────────────────────
function GoalsWithProgressContent({
  goals,
  onViewProgress,
}: {
  goals: EmployeeGoal[];
  onViewProgress: (goal: EmployeeGoal) => void;
}) {
  return (
    <div className="space-y-4 mt-4">
      <h3 className="font-semibold text-lg">Goals & Progress</h3>
      {goals.map((goal, i) => (
        <div key={i} className="border rounded-lg p-4 bg-gray-50">
          <h4 className="font-semibold text-gray-900">{goal.title}</h4>
          <p className="text-sm text-gray-600 mt-1">{goal.description}</p>
          <div className="grid grid-cols-3 gap-4 mt-3 pt-3 border-t">
            <div>
              <div className="text-xs text-gray-500 mb-1">Metric</div>
              <p className="text-sm font-medium">{goal.metric}</p>
            </div>
            <div>
              <div className="text-xs text-gray-500 mb-1">Target</div>
              <p className="text-sm font-medium">{goal.targetValue}</p>
            </div>
            <div>
              <div className="text-xs text-gray-500 mb-1">Due Date</div>
              <p className="text-sm font-medium">{goal.dueDate}</p>
            </div>
          </div>
          {goal.progressHistory && goal.progressHistory.length > 0 && (
            <div className="mt-3 pt-3 border-t">
              <div className="flex items-center gap-3 mb-3">
                <div className="flex-1 bg-gray-200 rounded-full h-2">
                  <div
                    className="bg-blue-500 h-2 rounded-full"
                    style={{ width: `${goal.progressHistory[goal.progressHistory.length - 1].progress}%` }}
                  />
                </div>
                <span className="text-sm font-medium text-gray-700 w-10 text-right">
                  {goal.progressHistory[goal.progressHistory.length - 1].progress}%
                </span>
              </div>
              <Button variant="outline" size="sm" onClick={() => onViewProgress(goal)}>
                <Eye className="w-4 h-4 mr-2" />
                View Progress History
              </Button>
            </div>
          )}
        </div>
      ))}
    </div>
  );
}

// ── Goals + progress + ratings view (Pending_Closure / Closed) ───────────
function FullReviewContent({
  employee,
  onViewProgress,
}: {
  employee: ViewAllEmployee;
  onViewProgress: (goal: EmployeeGoal) => void;
}) {
  const [activeTab, setActiveTab] = useState("ratings");

  const avgRating = (() => {
    const vals = Object.values(employee.ratings);
    if (vals.length === 0) return 0;
    return vals.reduce((a, b) => a + b, 0) / vals.length;
  })();

  return (
    <>
      {avgRating > 0 && (
        <div className="flex items-center gap-2 mt-1 mb-4">
          <StarDisplay rating={Math.round(avgRating)} />
          <span className="text-sm text-gray-500">{avgRating.toFixed(1)} overall</span>
        </div>
      )}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="ratings">Ratings</TabsTrigger>
          <TabsTrigger value="goals">Goals & Progress</TabsTrigger>
        </TabsList>

        <TabsContent value="ratings" className="space-y-4 mt-6">
          {CRITERIA.map((criterion) => {
            const rating  = employee.ratings[criterion.name]  ?? 0;
            const comment = employee.comments[criterion.name] ?? "";
            return (
              <div key={criterion.name} className="border rounded-lg p-4 bg-gray-50">
                <div className="flex items-start justify-between mb-2">
                  <div className="flex-1">
                    <h4 className="font-semibold text-gray-900">{criterion.name}</h4>
                    <p className="text-sm text-gray-500 mt-0.5">{criterion.description}</p>
                  </div>
                  <div className="ml-4 shrink-0">
                    <StarDisplay rating={rating} />
                  </div>
                </div>
                {comment && (
                  <p className="text-sm text-gray-700 mt-3 pt-3 border-t leading-relaxed">{comment}</p>
                )}
              </div>
            );
          })}
        </TabsContent>

        <TabsContent value="goals" className="space-y-4 mt-6">
          <GoalsWithProgressContent goals={employee.goals} onViewProgress={onViewProgress} />
        </TabsContent>
      </Tabs>
    </>
  );
}

// ── Main dialog ───────────────────────────────────────────────────────────
interface ViewAllDialogProps {
  open: boolean;
  onClose: () => void;
  employee: ViewAllEmployee | null;
}

export function ViewAllDialog({ open, onClose, employee }: ViewAllDialogProps) {
  const [progressGoal, setProgressGoal] = useState<EmployeeGoal | null>(null);

  useEffect(() => {
    setProgressGoal(null);
  }, [employee?.id]);

  if (!employee) return null;

  const status = employee.status;
  const showEmpty          = status === "Initial";
  const showGoalsOnly      = status === "Pending_goal_approval" || status === "Working";
  const showGoalsProgress  = status === "Review";
  const showFull           = status === "Pending_Closure" || status === "Closed";

  return (
    <>
      <Dialog open={open} onOpenChange={onClose}>
        <DialogContent className="sm:max-w-[800px] max-h-[90vh]">
          <DialogHeader>
            <div className="flex items-center gap-4">
              <Avatar className="h-16 w-16">
                <AvatarImage src={employee.avatar} alt={employee.name} />
                <AvatarFallback>{getInitials(employee.name)}</AvatarFallback>
              </Avatar>
              <div className="flex-1">
                <DialogTitle className="text-xl">{employee.name}</DialogTitle>
                <p className="text-sm text-gray-600 mt-0.5">{employee.jobTitle}</p>
                <Badge className="mt-2 text-xs">{status.replace(/_/g, " ")}</Badge>
              </div>
            </div>
          </DialogHeader>

          <ScrollArea className="max-h-[60vh] pr-4">
            {showEmpty && (
              <div className="flex flex-col items-center justify-center py-16 text-center">
                <div className="w-16 h-16 rounded-full bg-gray-100 flex items-center justify-center mb-4">
                  <Target className="w-8 h-8 text-gray-400" />
                </div>
                <p className="text-gray-500 font-medium">No data yet</p>
                <p className="text-sm text-gray-400 mt-1">
                  This employee has not started their evaluation.
                </p>
              </div>
            )}

            {showGoalsOnly && <GoalsOnlyContent goals={employee.goals} />}

            {showGoalsProgress && (
              <GoalsWithProgressContent
                goals={employee.goals}
                onViewProgress={setProgressGoal}
              />
            )}

            {showFull && (
              <FullReviewContent
                employee={employee}
                onViewProgress={setProgressGoal}
              />
            )}
          </ScrollArea>

          <div className="flex justify-end pt-4 border-t">
            <Button variant="outline" onClick={onClose}>Close</Button>
          </div>
        </DialogContent>
      </Dialog>

      <ProgressHistoryDialog
        goal={progressGoal}
        onClose={() => setProgressGoal(null)}
      />
    </>
  );
}
