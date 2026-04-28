export interface Goal {
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

export interface EmployeeGoal {
  title: string;
  description: string;
  metric: string;
  targetValue: string;
  dueDate: string;
  progressHistory?: Array<{
    date: string;
    progress: number;
    note?: string;
  }>;
}

/** Used in review_goal — goal-submission approval flow */
export interface ReviewGoalEmployee {
  id: string;
  name: string;
  avatar: string;
  jobTitle: string;
  submitDate: string;
  status: "Pending" | "Approved" | "Rejected";
  goals: EmployeeGoal[];
}

/** Used in review — performance evaluation flow */
export interface ReviewEmployee {
  id: string;
  name: string;
  avatar: string;
  jobTitle: string;
  submitDate: string;
  status: "Not Started" | "In Progress" | "Submitted" | "Closed";
  goals: EmployeeGoal[];
}

export interface ReviewProgress {
  ratings: { [key: string]: number };
  comments: { [key: string]: string };
}

export interface EvaluationGoal {
  id: string;
  title: string;
  description: string;
  metric: string;
  targetValue: string;
  deadline: string;
}

export interface AuditLog {
  id: string;
  timestamp: string;
  actor: string;
  actorRole: string;
  actionType: "CREATE" | "UPDATE" | "DELETE";
  affectedModule: string;
  affectedRecordId: string;
  changeSummary: string;
}

export interface TemplateCriterion {
  id: string;
  title: string;
  description: string;
}

export interface Template {
  id: string;
  name: string;
  jobTitle: string;
  evaluationCycle: string;
  criteria: TemplateCriterion[];
}

/** Used in finalize — final approval flow */
export interface FinalizeEmployee {
  id: string;
  name: string;
  avatar: string;
  jobTitle: string;
  submitDate: string;
  status: "Pending" | "Approved" | "Rejected";
  goals: EmployeeGoal[];
  ratings: { [criterionName: string]: number };
  comments: { [criterionName: string]: string };
}

export type ViewAllStatus =
  | "Initial"
  | "Pending_goal_approval"
  | "Working"
  | "Review"
  | "Pending_Closure"
  | "Closed";

export interface ViewAllEmployee {
  id: string;
  name: string;
  avatar: string;
  jobTitle: string;
  submitDate: string;
  status: ViewAllStatus;
  goals: EmployeeGoal[];
  ratings: { [criterionName: string]: number };
  comments: { [criterionName: string]: string };
}

// ── My Evaluation (combined, per-cycle) ───────────────────────────────────

export type MyEvalStatus =
  | "Initial"
  | "Pending_goal_approval"
  | "Working"
  | "Review"
  | "Confirming"
  | "Pending_Closure"
  | "Closed";

export type EvalCycleTab = "Annual" | "Quarter" | "Probation";

export interface EvalCycleState {
  status: MyEvalStatus;
  // Init-phase goals (goal setting)
  evaluationGoals: EvaluationGoal[];
  // Working-phase goals (progress tracking)
  goals: Goal[];
  // Ratings received from manager
  ratings: { [criterionName: string]: number };
  comments: { [criterionName: string]: string };
}

// ── History ───────────────────────────────────────────────────────────────
export interface HistoryRecord {
  id: string;
  label: string;           // e.g. "2025 Annual", "2025 Q1"
  closedDate: string;      // display date
  goals: Goal[];
  ratings: { [criterionName: string]: number };
  comments: { [criterionName: string]: string };
}
