import { Bell, ListTodo, Plus, Target, Trophy } from "lucide-react";
import { Button } from "../components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "../components/ui/tabs";
import { GoalCard } from "../components/GoalCard";
import { CreateGoalDialog } from "../components/CreateGoalDialog";
import { UpdateProgressDialog } from "../components/UpdateProgressDialog";
import { GoalDetailsDialog } from "../components/GoalDetailsDialog";
import { EvaluationCriteriaDialog } from "../components/EvaluationCriteriaDialog";
import type { Goal, EvaluationGoal } from "../types";

function TrendingUp(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg {...props} xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24"
      fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <polyline points="22 7 13.5 15.5 8.5 10.5 2 17" />
      <polyline points="16 7 22 7 22 13" />
    </svg>
  );
}

function AlertCircle(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg {...props} xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24"
      fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="10" />
      <line x1="12" y1="8" x2="12" y2="12" />
      <line x1="12" y1="16" x2="12.01" y2="16" />
    </svg>
  );
}

interface EvaluationWorkingSectionProps {
  goals: Goal[];
  selectedGoal: Goal | null;
  createDialogOpen: boolean;
  setCreateDialogOpen: (open: boolean) => void;
  updateProgressDialogOpen: boolean;
  setUpdateProgressDialogOpen: (open: boolean) => void;
  detailsDialogOpen: boolean;
  setDetailsDialogOpen: (open: boolean) => void;
  criteriaDialogOpen: boolean;
  setCriteriaDialogOpen: (open: boolean) => void;
  onCreateGoal: (goal: Omit<Goal, "id" | "progress" | "status" | "progressHistory">) => void;
  onUpdateProgress: (goalId: string) => void;
  onProgressUpdate: (progress: number, note: string) => void;
  onViewDetails: (goalId: string) => void;
  userJobTitle: string;
  evaluationGoalDialogOpen?: boolean;
  selectedEvaluationGoal?: EvaluationGoal | null;
}

export function EvaluationWorkingSection({
  goals,
  selectedGoal,
  createDialogOpen,
  setCreateDialogOpen,
  updateProgressDialogOpen,
  setUpdateProgressDialogOpen,
  detailsDialogOpen,
  setDetailsDialogOpen,
  criteriaDialogOpen,
  setCriteriaDialogOpen,
  onCreateGoal,
  onUpdateProgress,
  onProgressUpdate,
  onViewDetails,
  userJobTitle,
}: EvaluationWorkingSectionProps) {
  const activeGoals = goals.filter((g) => g.status !== "completed");
  const completedGoals = goals.filter((g) => g.status === "completed");

  const stats = {
    total: goals.length,
    completed: completedGoals.length,
    onTrack: goals.filter((g) => g.status === "on-track").length,
    atRisk: goals.filter((g) => g.status === "at-risk").length,
  };

  return (
    <>
      <div className="bg-white border-b">
        <div className="max-w-7xl mx-auto px-6 py-8">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Goal Tracking</h1>
              <p className="text-gray-600 mt-1">Status: Working</p>
            </div>
            <div className="flex items-center gap-4">
              <Button variant="outline" size="icon" onClick={() => {}}>
                <Bell className="w-5 h-5" />
              </Button>
              <Button variant="outline" size="icon" onClick={() => setCriteriaDialogOpen(true)}>
                <ListTodo className="w-5 h-5" />
              </Button>
              <Button onClick={() => alert("Goals submitted for review!")} size="lg">
                Submit
              </Button>
            </div>
          </div>

          <div className="grid grid-cols-4 gap-4 mt-8">
            <div className="bg-blue-50 rounded-lg p-4">
              <div className="flex items-center gap-2 text-blue-600 mb-1">
                <Target className="w-5 h-5" />
                <span className="text-sm font-medium">Total Goals</span>
              </div>
              <p className="text-3xl font-bold text-blue-900">{stats.total}</p>
            </div>
            <div className="bg-green-50 rounded-lg p-4">
              <div className="flex items-center gap-2 text-green-600 mb-1">
                <Trophy className="w-5 h-5" />
                <span className="text-sm font-medium">Completed</span>
              </div>
              <p className="text-3xl font-bold text-green-900">{stats.completed}</p>
            </div>
            <div className="bg-emerald-50 rounded-lg p-4">
              <div className="flex items-center gap-2 text-emerald-600 mb-1">
                <TrendingUp className="w-5 h-5" />
                <span className="text-sm font-medium">On Track</span>
              </div>
              <p className="text-3xl font-bold text-emerald-900">{stats.onTrack}</p>
            </div>
            <div className="bg-yellow-50 rounded-lg p-4">
              <div className="flex items-center gap-2 text-yellow-600 mb-1">
                <AlertCircle className="w-5 h-5" />
                <span className="text-sm font-medium">At Risk</span>
              </div>
              <p className="text-3xl font-bold text-yellow-900">{stats.atRisk}</p>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-6 py-8">
        <Tabs defaultValue="active" className="w-full">
          <TabsList>
            <TabsTrigger value="active">Active Goals ({activeGoals.length})</TabsTrigger>
            <TabsTrigger value="completed">Completed ({completedGoals.length})</TabsTrigger>
            <TabsTrigger value="all">All Goals ({goals.length})</TabsTrigger>
          </TabsList>

          <TabsContent value="active" className="mt-6">
            {activeGoals.length === 0 ? (
              <div className="text-center py-12">
                <Target className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                <h3 className="text-lg font-semibold text-gray-900 mb-2">No active goals</h3>
                <p className="text-gray-600 mb-4">Start by creating your first goal</p>
                <Button onClick={() => setCreateDialogOpen(true)}>
                  <Plus className="w-4 h-4 mr-2" />
                  Create Goal
                </Button>
              </div>
            ) : (
              <div className="grid gap-4">
                {activeGoals.map((goal) => (
                  <GoalCard
                    key={goal.id}
                    goal={goal}
                    onUpdateProgress={onUpdateProgress}
                    onViewDetails={onViewDetails}
                  />
                ))}
              </div>
            )}
          </TabsContent>

          <TabsContent value="completed" className="mt-6">
            {completedGoals.length === 0 ? (
              <div className="text-center py-12">
                <Trophy className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                <h3 className="text-lg font-semibold text-gray-900 mb-2">No completed goals yet</h3>
                <p className="text-gray-600">Keep working on your active goals!</p>
              </div>
            ) : (
              <div className="grid gap-4">
                {completedGoals.map((goal) => (
                  <GoalCard
                    key={goal.id}
                    goal={goal}
                    onUpdateProgress={onUpdateProgress}
                    onViewDetails={onViewDetails}
                  />
                ))}
              </div>
            )}
          </TabsContent>

          <TabsContent value="all" className="mt-6">
            <div className="grid gap-4">
              {goals.map((goal) => (
                <GoalCard
                  key={goal.id}
                  goal={goal}
                  onUpdateProgress={onUpdateProgress}
                  onViewDetails={onViewDetails}
                />
              ))}
            </div>
          </TabsContent>
        </Tabs>
      </div>

      <CreateGoalDialog
        open={createDialogOpen}
        onClose={() => setCreateDialogOpen(false)}
        onCreateGoal={onCreateGoal}
      />

      <UpdateProgressDialog
        open={updateProgressDialogOpen}
        onClose={() => setUpdateProgressDialogOpen(false)}
        currentProgress={selectedGoal?.progress || 0}
        onUpdateProgress={onProgressUpdate}
      />

      <GoalDetailsDialog
        open={detailsDialogOpen}
        onClose={() => setDetailsDialogOpen(false)}
        goal={selectedGoal}
      />

      <EvaluationCriteriaDialog
        open={criteriaDialogOpen}
        onClose={() => setCriteriaDialogOpen(false)}
        jobTitle={userJobTitle}
      />
    </>
  );
}
