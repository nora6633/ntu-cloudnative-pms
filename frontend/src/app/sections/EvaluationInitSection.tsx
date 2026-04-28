import { Bell, ListTodo, Plus } from "lucide-react";
import { Button } from "../components/ui/button";
import { EvaluationGoalCard } from "../components/EvaluationGoalCard";
import { EvaluationCriteriaDialog } from "../components/EvaluationCriteriaDialog";
import { EvaluationGoalDialog } from "../components/EvaluationGoalDialog";
import type { EvaluationGoal } from "../types";

interface EvaluationInitSectionProps {
  evaluationGoals: EvaluationGoal[];
  criteriaDialogOpen: boolean;
  setCriteriaDialogOpen: (open: boolean) => void;
  evaluationGoalDialogOpen: boolean;
  setEvaluationGoalDialogOpen: (open: boolean) => void;
  evaluationGoalMode: "create" | "edit";
  selectedEvaluationGoal: EvaluationGoal | null;
  onCreateEvaluationGoal: (goal: Omit<EvaluationGoal, "id">) => void;
  onUpdateEvaluationGoal: (goal: Omit<EvaluationGoal, "id">) => void;
  onDeleteEvaluationGoal: (id: string) => void;
  onOpenUpdateEvaluationGoal: (id: string) => void;
  onOpenCreateEvaluationGoal: () => void;
  userJobTitle: string;
}

export function EvaluationInitSection({
  evaluationGoals,
  criteriaDialogOpen,
  setCriteriaDialogOpen,
  evaluationGoalDialogOpen,
  setEvaluationGoalDialogOpen,
  evaluationGoalMode,
  selectedEvaluationGoal,
  onCreateEvaluationGoal,
  onUpdateEvaluationGoal,
  onDeleteEvaluationGoal,
  onOpenUpdateEvaluationGoal,
  onOpenCreateEvaluationGoal,
  userJobTitle,
}: EvaluationInitSectionProps) {
  return (
    <>
      <div className="bg-white border-b">
        <div className="max-w-7xl mx-auto px-6 py-8">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Goal Setting</h1>
              <p className="text-gray-600 mt-1">Status: Initial</p>
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
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-6 py-8">
        <div className="space-y-4">
          {evaluationGoals.map((goal) => (
            <EvaluationGoalCard
              key={goal.id}
              goal={goal}
              onUpdate={onOpenUpdateEvaluationGoal}
              onDelete={onDeleteEvaluationGoal}
            />
          ))}

          <div className="flex justify-center pt-4">
            <Button
              variant="outline"
              onClick={onOpenCreateEvaluationGoal}
              size="lg"
              className="w-full max-w-md"
            >
              <Plus className="w-5 h-5 mr-2" />
              New Goal
            </Button>
          </div>
        </div>
      </div>

      <EvaluationCriteriaDialog
        open={criteriaDialogOpen}
        onClose={() => setCriteriaDialogOpen(false)}
        jobTitle={userJobTitle}
      />

      <EvaluationGoalDialog
        open={evaluationGoalDialogOpen}
        onClose={() => setEvaluationGoalDialogOpen(false)}
        onSave={evaluationGoalMode === "create" ? onCreateEvaluationGoal : onUpdateEvaluationGoal}
        existingGoal={selectedEvaluationGoal}
        mode={evaluationGoalMode}
      />
    </>
  );
}
