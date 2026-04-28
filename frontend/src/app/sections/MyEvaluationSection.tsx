import { useState } from "react";
import { Bell, ListTodo, Plus, Target, Trophy, Star } from "lucide-react";
import { Button } from "../components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "../components/ui/tabs";
import { GoalCard } from "../components/GoalCard";
import { CreateGoalDialog } from "../components/CreateGoalDialog";
import { UpdateProgressDialog } from "../components/UpdateProgressDialog";
import { GoalDetailsDialog } from "../components/GoalDetailsDialog";
import { EvaluationGoalCard } from "../components/EvaluationGoalCard";
import { EvaluationCriteriaDialog } from "../components/EvaluationCriteriaDialog";
import { EvaluationGoalDialog } from "../components/EvaluationGoalDialog";
import type {
  Goal, EvaluationGoal, EvalCycleState, EvalCycleTab, MyEvalStatus,
} from "../types";
import { INITIAL_GOALS, INITIAL_EVALUATION_GOALS } from "../data";

// ── helpers ───────────────────────────────────────────────────────────────
const CRITERIA = [
  { name: "Business Impact", description: "Measurable contribution to business outcomes." },
  { name: "Delivery",        description: "Delivers high-quality work on time." },
  { name: "Quality",         description: "Work meets or exceeds standards." },
  { name: "Innovation",      description: "Brings creative solutions to problems." },
  { name: "Collaboration",   description: "Works effectively with others." },
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

const STATUS_LABELS: Record<MyEvalStatus, string> = {
  Initial:               "Initial",
  Pending_goal_approval: "Pending Goal Approval",
  Working:               "Working",
  Review:                "Review",
  Confirming:            "Confirming",
  Pending_Closure:       "Pending Closure",
  Closed:                "Closed",
};

const STATUS_COLORS: Record<MyEvalStatus, string> = {
  Initial:               "text-gray-500",
  Pending_goal_approval: "text-yellow-600",
  Working:               "text-blue-600",
  Review:                "text-purple-600",
  Confirming:            "text-orange-500",
  Pending_Closure:       "text-orange-600",
  Closed:                "text-green-600",
};

// ── default state factory ─────────────────────────────────────────────────
function makeDefaultState(prefill = false): EvalCycleState {
  return {
    status: "Initial",
    evaluationGoals: prefill ? INITIAL_EVALUATION_GOALS : [],
    goals: prefill ? INITIAL_GOALS : [],
    ratings: {},
    comments: {},
  };
}

// ── per-cycle inner view ──────────────────────────────────────────────────
interface CycleViewProps {
  cycleState: EvalCycleState;
  onChange: (next: EvalCycleState) => void;
  userJobTitle: string;
  onConfirm: () => void;
}

function CycleView({ cycleState, onChange, userJobTitle, onConfirm }: CycleViewProps) {
  const { status, evaluationGoals, goals, ratings, comments } = cycleState;

  // ── local dialog state ────────────────────────────────────────────────
  const [criteriaDialogOpen, setCriteriaDialogOpen] = useState(false);
  const [evalGoalDialogOpen, setEvalGoalDialogOpen] = useState(false);
  const [evalGoalMode, setEvalGoalMode] = useState<"create" | "edit">("create");
  const [selectedEvalGoal, setSelectedEvalGoal] = useState<EvaluationGoal | null>(null);
  const [createGoalOpen, setCreateGoalOpen] = useState(false);
  const [updateProgressOpen, setUpdateProgressOpen] = useState(false);
  const [detailsOpen, setDetailsOpen] = useState(false);
  const [selectedGoal, setSelectedGoal] = useState<Goal | null>(null);

  // ── evaluation goal handlers ──────────────────────────────────────────
  const createEvalGoal = (goal: Omit<EvaluationGoal, "id">) =>
    onChange({ ...cycleState, evaluationGoals: [...evaluationGoals, { id: Date.now().toString(), ...goal }] });

  const updateEvalGoal = (goal: Omit<EvaluationGoal, "id">) => {
    if (!selectedEvalGoal) return;
    onChange({ ...cycleState, evaluationGoals: evaluationGoals.map((g) => g.id === selectedEvalGoal.id ? { ...g, ...goal } : g) });
    setSelectedEvalGoal(null);
  };

  const deleteEvalGoal = (id: string) =>
    onChange({ ...cycleState, evaluationGoals: evaluationGoals.filter((g) => g.id !== id) });

  const openUpdateEvalGoal = (id: string) => {
    const g = evaluationGoals.find((g) => g.id === id);
    if (g) { setSelectedEvalGoal(g); setEvalGoalMode("edit"); setEvalGoalDialogOpen(true); }
  };

  // ── working goal handlers ─────────────────────────────────────────────
  const createGoal = (newGoal: Omit<Goal, "id" | "progress" | "status" | "progressHistory">) =>
    onChange({ ...cycleState, goals: [{ id: Date.now().toString(), ...newGoal, progress: 0, status: "on-track", progressHistory: [] }, ...goals] });

  const updateProgress = (goalId: string) => {
    const g = goals.find((g) => g.id === goalId);
    if (g) { setSelectedGoal(g); setUpdateProgressOpen(true); }
  };

  const progressUpdate = (progress: number, note: string) => {
    if (!selectedGoal) return;
    onChange({
      ...cycleState,
      goals: goals.map((goal) => {
        if (goal.id !== selectedGoal.id) return goal;
        const newHistory = [...(goal.progressHistory || []), { date: new Date().toLocaleDateString(), progress, note: note || undefined }];
        let newStatus: Goal["status"] = "on-track";
        if (progress === 100) { newStatus = "completed"; }
        else { const d = Math.ceil((new Date(goal.deadline).getTime() - Date.now()) / 86400000); if (d < 30 && progress < 70) newStatus = "at-risk"; }
        return { ...goal, progress, status: newStatus, progressHistory: newHistory };
      }),
    });
  };

  const viewDetails = (goalId: string) => {
    const g = goals.find((g) => g.id === goalId);
    if (g) { setSelectedGoal(g); setDetailsOpen(true); }
  };

  // ── submit handlers ───────────────────────────────────────────────────
  const handleInitSubmit = () => {
    if (evaluationGoals.length === 0) { alert("Please add at least one goal."); return; }
    onChange({ ...cycleState, status: "Pending_goal_approval" });
  };

  const handleWorkingSubmit = () => {
    onChange({ ...cycleState, status: "Review" });
  };

  // ── stats for working view ────────────────────────────────────────────
  const activeGoals    = goals.filter((g) => g.status !== "completed");
  const completedGoals = goals.filter((g) => g.status === "completed");
  const stats = { total: goals.length, completed: completedGoals.length, onTrack: goals.filter((g) => g.status === "on-track").length, atRisk: goals.filter((g) => g.status === "at-risk").length };

  const avgRating = (() => {
    const vals = Object.values(ratings);
    if (vals.length === 0) return 0;
    return vals.reduce((a, b) => a + b, 0) / vals.length;
  })();

  return (
    <>
      {/* ── Header ──────────────────────────────────────────────────────── */}
      <div className="bg-white border-b">
        <div className="max-w-7xl mx-auto px-6 py-8">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">My Evaluation</h1>
              <p className={`mt-1 font-medium ${STATUS_COLORS[status]}`}>
                Status: {STATUS_LABELS[status]}
              </p>
            </div>
            <div className="flex items-center gap-3">
              <Button variant="outline" size="icon"><Bell className="w-5 h-5" /></Button>
              <Button variant="outline" size="icon" onClick={() => setCriteriaDialogOpen(true)}><ListTodo className="w-5 h-5" /></Button>
              {status === "Initial" && (
                <Button size="lg" onClick={handleInitSubmit}>Submit</Button>
              )}
              {status === "Working" && (
                <Button size="lg" onClick={handleWorkingSubmit}>Submit</Button>
              )}
            </div>
          </div>

          {/* Stats bar — only in Working */}
          {status === "Working" && (
            <div className="grid grid-cols-4 gap-4 mt-8">
              <div className="bg-blue-50 rounded-lg p-4">
                <div className="flex items-center gap-2 text-blue-600 mb-1"><Target className="w-5 h-5" /><span className="text-sm font-medium">Total Goals</span></div>
                <p className="text-3xl font-bold text-blue-900">{stats.total}</p>
              </div>
              <div className="bg-green-50 rounded-lg p-4">
                <div className="flex items-center gap-2 text-green-600 mb-1"><Trophy className="w-5 h-5" /><span className="text-sm font-medium">Completed</span></div>
                <p className="text-3xl font-bold text-green-900">{stats.completed}</p>
              </div>
              <div className="bg-emerald-50 rounded-lg p-4">
                <div className="flex items-center gap-2 text-emerald-600 mb-1"><TrendingUp className="w-5 h-5" /><span className="text-sm font-medium">On Track</span></div>
                <p className="text-3xl font-bold text-emerald-900">{stats.onTrack}</p>
              </div>
              <div className="bg-yellow-50 rounded-lg p-4">
                <div className="flex items-center gap-2 text-yellow-600 mb-1"><AlertCircle className="w-5 h-5" /><span className="text-sm font-medium">At Risk</span></div>
                <p className="text-3xl font-bold text-yellow-900">{stats.atRisk}</p>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* ── Body ────────────────────────────────────────────────────────── */}
      <div className="max-w-7xl mx-auto px-6 py-8">

        {/* Initial — goal setting */}
        {status === "Initial" && (
          <div className="space-y-4">
            {evaluationGoals.map((goal) => (
              <EvaluationGoalCard key={goal.id} goal={goal} onUpdate={openUpdateEvalGoal} onDelete={deleteEvalGoal} />
            ))}
            <div className="flex justify-center pt-4">
              <Button variant="outline" size="lg" className="w-full max-w-md"
                onClick={() => { setSelectedEvalGoal(null); setEvalGoalMode("create"); setEvalGoalDialogOpen(true); }}>
                <Plus className="w-5 h-5 mr-2" />New Goal
              </Button>
            </div>
          </div>
        )}

        {/* Pending_goal_approval — read-only goals */}
        {status === "Pending_goal_approval" && (
          <div className="space-y-4">
            <p className="text-sm text-yellow-700 bg-yellow-50 border border-yellow-200 rounded-lg px-4 py-3">
              Your goals have been submitted and are awaiting approval.
            </p>
            {evaluationGoals.map((goal) => (
              <EvaluationGoalCard key={goal.id} goal={goal} onUpdate={() => {}} onDelete={() => {}} />
            ))}
          </div>
        )}

        {/* Working — goal tracking */}
        {status === "Working" && (
          <Tabs defaultValue="active">
            <TabsList>
              <TabsTrigger value="active">Active Goals ({activeGoals.length})</TabsTrigger>
              <TabsTrigger value="completed">Completed ({completedGoals.length})</TabsTrigger>
              <TabsTrigger value="all">All Goals ({goals.length})</TabsTrigger>
            </TabsList>
            <TabsContent value="active" className="mt-6">
              {activeGoals.length === 0
                ? <div className="text-center py-12 text-gray-500">No active goals.<Button className="ml-4" onClick={() => setCreateGoalOpen(true)}>Create Goal</Button></div>
                : <div className="grid gap-4">{activeGoals.map((g) => <GoalCard key={g.id} goal={g} onUpdateProgress={updateProgress} onViewDetails={viewDetails} />)}</div>}
            </TabsContent>
            <TabsContent value="completed" className="mt-6">
              <div className="grid gap-4">{completedGoals.map((g) => <GoalCard key={g.id} goal={g} onUpdateProgress={updateProgress} onViewDetails={viewDetails} />)}</div>
            </TabsContent>
            <TabsContent value="all" className="mt-6">
              <div className="grid gap-4">{goals.map((g) => <GoalCard key={g.id} goal={g} onUpdateProgress={updateProgress} onViewDetails={viewDetails} />)}</div>
            </TabsContent>
          </Tabs>
        )}

        {/* Review — waiting for manager */}
        {status === "Review" && (
          <div className="text-center py-16">
            <div className="w-16 h-16 rounded-full bg-purple-50 flex items-center justify-center mx-auto mb-4">
              <Star className="w-8 h-8 text-purple-400" />
            </div>
            <h3 className="text-lg font-semibold text-gray-900 mb-2">Awaiting Manager Review</h3>
            <p className="text-gray-500 text-sm">Your manager is reviewing your goals and progress. You'll be notified once ratings are submitted.</p>
          </div>
        )}

        {/* Confirming — show received ratings, confirm button */}
        {status === "Confirming" && (
          <div className="space-y-6">
            <div className="flex items-center gap-3 mb-2">
              <StarDisplay rating={Math.round(avgRating)} />
              <span className="text-gray-600 text-sm">{avgRating.toFixed(1)} overall rating from your manager</span>
            </div>
            {CRITERIA.map((criterion) => {
              const rating  = ratings[criterion.name]  ?? 0;
              const comment = comments[criterion.name] ?? "";
              return (
                <div key={criterion.name} className="border rounded-lg p-4 bg-gray-50">
                  <div className="flex items-start justify-between mb-2">
                    <div className="flex-1">
                      <h4 className="font-semibold text-gray-900">{criterion.name}</h4>
                      <p className="text-sm text-gray-500 mt-0.5">{criterion.description}</p>
                    </div>
                    <div className="ml-4 shrink-0"><StarDisplay rating={rating} /></div>
                  </div>
                  {comment && <p className="text-sm text-gray-700 mt-3 pt-3 border-t leading-relaxed">{comment}</p>}
                </div>
              );
            })}
            <div className="flex justify-end pt-4 border-t">
              <Button size="lg" onClick={onConfirm}>Confirm</Button>
            </div>
          </div>
        )}

        {/* Pending_Closure / Closed — read-only full record */}
        {(status === "Pending_Closure" || status === "Closed") && (
          <div className="space-y-6">
            <div className="flex items-center gap-3">
              <StarDisplay rating={Math.round(avgRating)} />
              <span className="text-gray-600 text-sm">{avgRating.toFixed(1)} overall</span>
            </div>
            {CRITERIA.map((criterion) => {
              const rating  = ratings[criterion.name]  ?? 0;
              const comment = comments[criterion.name] ?? "";
              return (
                <div key={criterion.name} className="border rounded-lg p-4 bg-gray-50">
                  <div className="flex items-start justify-between mb-2">
                    <div className="flex-1">
                      <h4 className="font-semibold text-gray-900">{criterion.name}</h4>
                      <p className="text-sm text-gray-500 mt-0.5">{criterion.description}</p>
                    </div>
                    <div className="ml-4 shrink-0"><StarDisplay rating={rating} /></div>
                  </div>
                  {comment && <p className="text-sm text-gray-700 mt-3 pt-3 border-t leading-relaxed">{comment}</p>}
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* ── Dialogs ──────────────────────────────────────────────────────── */}
      <EvaluationCriteriaDialog open={criteriaDialogOpen} onClose={() => setCriteriaDialogOpen(false)} jobTitle={userJobTitle} />
      <EvaluationGoalDialog
        open={evalGoalDialogOpen}
        onClose={() => setEvalGoalDialogOpen(false)}
        onSave={evalGoalMode === "create" ? createEvalGoal : updateEvalGoal}
        existingGoal={selectedEvalGoal}
        mode={evalGoalMode}
      />
      <CreateGoalDialog open={createGoalOpen} onClose={() => setCreateGoalOpen(false)} onCreateGoal={createGoal} />
      <UpdateProgressDialog open={updateProgressOpen} onClose={() => setUpdateProgressOpen(false)} currentProgress={selectedGoal?.progress || 0} onUpdateProgress={progressUpdate} />
      <GoalDetailsDialog open={detailsOpen} onClose={() => setDetailsOpen(false)} goal={selectedGoal} />
    </>
  );
}

// ── exported section ──────────────────────────────────────────────────────
interface MyEvaluationSectionProps {
  cycleStates: Record<EvalCycleTab, EvalCycleState>;
  onCycleChange: (tab: EvalCycleTab, next: EvalCycleState) => void;
  onConfirm: (tab: EvalCycleTab) => void;
  userJobTitle: string;
}

export function MyEvaluationSection({ cycleStates, onCycleChange, onConfirm, userJobTitle }: MyEvaluationSectionProps) {
  const [activeTab, setActiveTab] = useState<EvalCycleTab>("Annual");

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Cycle tab selector */}
      <div className="bg-white border-b px-6 pt-4">
        <div className="max-w-7xl mx-auto">
          <div className="flex gap-1">
            {(["Annual", "Quarter", "Probation"] as EvalCycleTab[]).map((tab) => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                className={`px-6 py-2.5 text-sm font-medium rounded-t-lg border-b-2 transition-colors ${
                  activeTab === tab
                    ? "border-blue-600 text-blue-600 bg-blue-50"
                    : "border-transparent text-gray-600 hover:text-gray-900"
                }`}
              >
                {tab}
              </button>
            ))}
          </div>
        </div>
      </div>

      <CycleView
        key={activeTab}
        cycleState={cycleStates[activeTab]}
        onChange={(next) => onCycleChange(activeTab, next)}
        onConfirm={() => onConfirm(activeTab)}
        userJobTitle={userJobTitle}
      />
    </div>
  );
}
