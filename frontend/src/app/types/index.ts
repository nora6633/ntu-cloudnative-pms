// ── My Evaluation status ──────────────────────────────────────────────────
// Maps from EvaluationDTOStatus; adds "Confirming" for PENDING_REVIEW_CONFIRMATION
export type MyEvalStatus =
  | 'Initial'
  | 'Pending_goal_approval'
  | 'Working'
  | 'Review'
  | 'Confirming'
  | 'Pending_Closure'
  | 'Closed';

export type EvalCycleTab = 'Annual' | 'Quarter' | 'Probation';

// ── API Types ──────────────────────────────────────────────────────────────
export type { GoalDTO as Goal, EvaluationDTO as EvaluationGoal } from "../../api/generated/orvalClient";

// ── Templates (no API — kept mocked) ─────────────────────────────────────
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
