import { useState, useMemo } from "react";
import {
  ClipboardList, FileCheck, FileText, Search, UserPlus,
  PlayCircle, BadgeCheck, LayoutList, History,
} from "lucide-react";

import { MyEvaluationSection } from "./sections/MyEvaluationSection";
import { ReviewGoalSection } from "./sections/ReviewGoalSection";
import { ReviewSection } from "./sections/ReviewSection";
import { TemplateSection } from "./sections/TemplateSection";
import { AuditSection } from "./sections/AuditSection";
import { RegisterSection } from "./sections/RegisterSection";
import { StartEvaluationSection } from "./sections/StartEvaluationSection";
import { FinalizeSection } from "./sections/FinalizeSection";
import { ViewAllSection } from "./sections/ViewAllSection";
import { HistorySection } from "./sections/HistorySection";

import type {
  ReviewGoalEmployee, ReviewEmployee,
  AuditLog, ReviewProgress, Template, FinalizeEmployee, ViewAllEmployee,
  EvalCycleState, EvalCycleTab,
} from "./types";
import {
  INITIAL_REVIEW_GOAL_EMPLOYEES,
  INITIAL_REVIEW_EMPLOYEES,
  INITIAL_AUDIT_LOGS,
  INITIAL_TEMPLATES,
  INITIAL_FINALIZE_EMPLOYEES,
  INITIAL_VIEW_ALL_EMPLOYEES,
  INITIAL_GOALS,
  INITIAL_EVALUATION_GOALS,
} from "./data";

// ── menu ──────────────────────────────────────────────────────────────────
type SectionId =
  | "start_evaluation" | "my_evaluation" | "review_goal" | "review"
  | "finalize" | "view_all" | "history" | "template" | "audit" | "register";

const menuItems: { id: SectionId; label: string; icon: React.ElementType }[] = [
  { id: "start_evaluation", label: "Start Evaluation", icon: PlayCircle },
  { id: "my_evaluation",    label: "My Evaluation",    icon: ClipboardList },
  { id: "review_goal",      label: "Review Goal",      icon: FileCheck },
  { id: "review",           label: "Review",           icon: FileCheck },
  { id: "finalize",         label: "Finalize",         icon: BadgeCheck },
  { id: "view_all",         label: "View All",         icon: LayoutList },
  { id: "history",          label: "History",          icon: History },
  { id: "template",         label: "Template",         icon: FileText },
  { id: "audit",            label: "Audit",            icon: Search },
  { id: "register",         label: "Register",         icon: UserPlus },
];

const USER_JOB_TITLE = "Software Engineer";
const USER_NAME = "Alex Kim";
const USER_ID = "current-user";

// ── default cycle state ───────────────────────────────────────────────────
function makeDefaultCycleState(): EvalCycleState {
  return {
    status: "Initial",
    evaluationGoals: INITIAL_EVALUATION_GOALS,
    goals: INITIAL_GOALS,
    ratings: {},
    comments: {},
  };
}

export default function App() {
  const [activeSection, setActiveSection] = useState<SectionId>("my_evaluation");

  // ── My Evaluation — per-cycle state ──────────────────────────────────────
  const [cycleStates, setCycleStates] = useState<Record<EvalCycleTab, EvalCycleState>>({
    Annual:    makeDefaultCycleState(),
    Quarter:   { ...makeDefaultCycleState(), evaluationGoals: [], goals: [] },
    Probation: { ...makeDefaultCycleState(), evaluationGoals: [], goals: [] },
  });

  const handleCycleChange = (tab: EvalCycleTab, next: EvalCycleState) => {
    setCycleStates((prev) => ({ ...prev, [tab]: next }));

    // When status becomes Pending_goal_approval → inject into ReviewGoal
    if (next.status === "Pending_goal_approval") {
      const evalGoals = next.evaluationGoals;
      const newEmp: ReviewGoalEmployee = {
        id: `${USER_ID}-${tab}`,
        name: `${USER_NAME} (${tab})`,
        avatar: "",
        jobTitle: USER_JOB_TITLE,
        submitDate: new Date().toLocaleDateString(),
        status: "Pending",
        goals: evalGoals.map((g) => ({
          title: g.title, description: g.description,
          metric: g.metric, targetValue: g.targetValue, dueDate: g.deadline,
        })),
      };
      setReviewGoalEmployees((prev) => {
        const filtered = prev.filter((e) => e.id !== `${USER_ID}-${tab}`);
        return [...filtered, newEmp];
      });
    }

    // When status becomes Review → inject into Review section
    if (next.status === "Review") {
      const newEmp: ReviewEmployee = {
        id: `${USER_ID}-${tab}`,
        name: `${USER_NAME} (${tab})`,
        avatar: "",
        jobTitle: USER_JOB_TITLE,
        submitDate: new Date().toLocaleDateString(),
        status: "Not Started",
        goals: next.goals.map((g) => ({
          title: g.title, description: g.description,
          metric: g.metric, targetValue: g.targetValue, dueDate: g.deadline,
          progressHistory: g.progressHistory,
        })),
      };
      setReviewEmployees((prev) => {
        const filtered = prev.filter((e) => e.id !== `${USER_ID}-${tab}`);
        return [...filtered, newEmp];
      });
    }
  };

  // When manager submits rating → push to MyEvaluation as Confirming
  const handleSubmitReviewWithSync = (employeeId: string, progress: ReviewProgress) => {
    setSavedReviewProgress((prev) => ({ ...prev, [employeeId]: progress }));
    setReviewEmployees((prev) =>
      prev.map((emp) => emp.id === employeeId ? { ...emp, status: "Submitted" as const } : emp)
    );
    // Find which cycle tab this employee belongs to
    const tab = (["Annual", "Quarter", "Probation"] as EvalCycleTab[]).find(
      (t) => `${USER_ID}-${t}` === employeeId
    );
    if (tab) {
      setCycleStates((prev) => ({
        ...prev,
        [tab]: { ...prev[tab], status: "Confirming", ratings: progress.ratings, comments: progress.comments },
      }));
    }
  };

  // Save review (not submitted yet — update ratings but keep Confirming if already there)
  const handleSaveReviewWithSync = (employeeId: string, progress: ReviewProgress) => {
    setSavedReviewProgress((prev) => ({ ...prev, [employeeId]: progress }));
    setReviewEmployees((prev) =>
      prev.map((emp) => emp.id === employeeId && emp.status === "Not Started"
        ? { ...emp, status: "In Progress" as const } : emp)
    );
    // Also update ratings in cycle state if already Confirming
    const tab = (["Annual", "Quarter", "Probation"] as EvalCycleTab[]).find(
      (t) => `${USER_ID}-${t}` === employeeId
    );
    if (tab) {
      setCycleStates((prev) => {
        const cur = prev[tab];
        if (cur.status === "Confirming") {
          return { ...prev, [tab]: { ...cur, ratings: progress.ratings, comments: progress.comments } };
        }
        return prev;
      });
    }
  };

  // Confirm button in MyEvaluation → Pending_Closure → inject into Finalize
  const handleConfirm = (tab: EvalCycleTab) => {
    setCycleStates((prev) => {
      const cur = prev[tab];
      const next = { ...cur, status: "Pending_Closure" as const };
      // Inject into finalize
      const newEmp: FinalizeEmployee = {
        id: `${USER_ID}-${tab}`,
        name: `${USER_NAME} (${tab})`,
        avatar: "",
        jobTitle: USER_JOB_TITLE,
        submitDate: new Date().toLocaleDateString(),
        status: "Pending",
        goals: cur.goals.map((g) => ({
          title: g.title, description: g.description,
          metric: g.metric, targetValue: g.targetValue, dueDate: g.deadline,
          progressHistory: g.progressHistory,
        })),
        ratings: cur.ratings,
        comments: cur.comments,
      };
      setFinalizeEmployees((fe) => {
        const filtered = fe.filter((e) => e.id !== `${USER_ID}-${tab}`);
        return [...filtered, newEmp];
      });
      return { ...prev, [tab]: next };
    });
  };

  // ── ReviewGoal section state ──────────────────────────────────────────────
  const [reviewGoalEmployees, setReviewGoalEmployees] = useState<ReviewGoalEmployee[]>(INITIAL_REVIEW_GOAL_EMPLOYEES);
  const [selectedReviewGoalEmployee, setSelectedReviewGoalEmployee] = useState<ReviewGoalEmployee | null>(null);
  const [reviewGoalSearchQuery, setReviewGoalSearchQuery] = useState("");
  const [reviewGoalJobFilter, setReviewGoalJobFilter] = useState("all");
  const [reviewGoalStatusFilter, setReviewGoalStatusFilter] = useState("all");
  const [reviewGoalDialogOpen, setReviewGoalDialogOpen] = useState(false);

  const handleReviewGoalEmployeeClick = (employee: ReviewGoalEmployee) => {
    setSelectedReviewGoalEmployee(employee);
    setReviewGoalDialogOpen(true);
  };

  const handleApprove = (id: string) => {
    setReviewGoalEmployees((prev) =>
      prev.map((emp) => emp.id === id ? { ...emp, status: "Approved" as const } : emp)
    );
    // If this is the current user, advance their cycle status to Working
    const tab = (["Annual", "Quarter", "Probation"] as EvalCycleTab[]).find(
      (t) => `${USER_ID}-${t}` === id
    );
    if (tab) {
      setCycleStates((prev) => ({
        ...prev,
        [tab]: { ...prev[tab], status: "Working" },
      }));
    }
  };

  const handleReject = (id: string) => {
    setReviewGoalEmployees((prev) =>
      prev.map((emp) => emp.id === id ? { ...emp, status: "Rejected" as const } : emp)
    );
    // If this is the current user, send them back to Initial
    const tab = (["Annual", "Quarter", "Probation"] as EvalCycleTab[]).find(
      (t) => `${USER_ID}-${t}` === id
    );
    if (tab) {
      setCycleStates((prev) => ({
        ...prev,
        [tab]: { ...prev[tab], status: "Initial" },
      }));
    }
  };

  // ── Review section state ──────────────────────────────────────────────────
  const [reviewEmployees, setReviewEmployees] = useState<ReviewEmployee[]>(INITIAL_REVIEW_EMPLOYEES);
  const [selectedReviewEmployee, setSelectedReviewEmployee] = useState<ReviewEmployee | null>(null);
  const [reviewSearchQuery, setReviewSearchQuery] = useState("");
  const [reviewJobFilter, setReviewJobFilter] = useState("all");
  const [reviewStatusFilter, setReviewStatusFilter] = useState("all");
  const [employeeReviewDialogOpen, setEmployeeReviewDialogOpen] = useState(false);
  const [savedReviewProgress, setSavedReviewProgress] = useState<{ [id: string]: ReviewProgress }>({});

  const handleReviewEmployeeClick = (employee: ReviewEmployee) => {
    setSelectedReviewEmployee(employee);
    setEmployeeReviewDialogOpen(true);
  };

  // ── Finalize section state ────────────────────────────────────────────────
  const [finalizeEmployees, setFinalizeEmployees] = useState<FinalizeEmployee[]>(INITIAL_FINALIZE_EMPLOYEES);

  const handleFinalizeApprove = (id: string) => {
    setFinalizeEmployees((prev) =>
      prev.map((emp) => emp.id === id ? { ...emp, status: "Approved" as const } : emp)
    );
    // Advance current user's cycle to Closed
    const tab = (["Annual", "Quarter", "Probation"] as EvalCycleTab[]).find(
      (t) => `${USER_ID}-${t}` === id
    );
    if (tab) {
      setCycleStates((prev) => ({
        ...prev,
        [tab]: { ...prev[tab], status: "Closed" },
      }));
    }
  };

  const handleFinalizeReject = (id: string) => {
    setFinalizeEmployees((prev) =>
      prev.map((emp) => emp.id === id ? { ...emp, status: "Rejected" as const } : emp)
    );
  };

  // ── Template state ────────────────────────────────────────────────────────
  const [templates, setTemplates] = useState<Template[]>(INITIAL_TEMPLATES);
  const handleCreateTemplate = (t: Omit<Template, "id">) =>
    setTemplates((prev) => [...prev, { id: Date.now().toString(), ...t }]);

  // ── View All state ────────────────────────────────────────────────────────
  const [viewAllEmployees] = useState<ViewAllEmployee[]>(INITIAL_VIEW_ALL_EMPLOYEES);

  // ── Audit state ───────────────────────────────────────────────────────────
  const [auditLogs] = useState<AuditLog[]>(INITIAL_AUDIT_LOGS);
  const [auditTimeInterval, setAuditTimeInterval] = useState("all");
  const [auditActorFilter, setAuditActorFilter] = useState("all");
  const [auditActionFilter, setAuditActionFilter] = useState("all");
  const [auditModuleFilter, setAuditModuleFilter] = useState("all");
  const [auditRecordIdFilter, setAuditRecordIdFilter] = useState("");

  return (
    <div className="min-h-screen bg-gray-50 flex">
      <aside className="w-64 bg-white border-r min-h-screen">
        <div className="p-6 border-b">
          <h2 className="text-xl font-bold text-gray-900">Performance Hub</h2>
        </div>
        <nav className="p-4">
          <ul className="space-y-2">
            {menuItems.map((item) => {
              const Icon = item.icon;
              return (
                <li key={item.id}>
                  <button
                    onClick={() => setActiveSection(item.id)}
                    className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-colors ${
                      activeSection === item.id
                        ? "bg-blue-50 text-blue-700 font-medium"
                        : "text-gray-700 hover:bg-gray-50"
                    }`}
                  >
                    <Icon className="w-5 h-5" />
                    <span>{item.label}</span>
                  </button>
                </li>
              );
            })}
          </ul>
        </nav>
      </aside>

      <div className="flex-1">
        {activeSection === "start_evaluation" && (
          <StartEvaluationSection templates={templates} onStart={() => {}} />
        )}

        {activeSection === "my_evaluation" && (
          <MyEvaluationSection
            cycleStates={cycleStates}
            onCycleChange={handleCycleChange}
            onConfirm={handleConfirm}
            userJobTitle={USER_JOB_TITLE}
          />
        )}

        {activeSection === "review_goal" && (
          <ReviewGoalSection
            employees={reviewGoalEmployees}
            searchQuery={reviewGoalSearchQuery}
            setSearchQuery={setReviewGoalSearchQuery}
            jobFilter={reviewGoalJobFilter}
            setJobFilter={setReviewGoalJobFilter}
            statusFilter={reviewGoalStatusFilter}
            setStatusFilter={setReviewGoalStatusFilter}
            selectedEmployee={selectedReviewGoalEmployee}
            reviewDialogOpen={reviewGoalDialogOpen}
            setReviewDialogOpen={setReviewGoalDialogOpen}
            onEmployeeClick={handleReviewGoalEmployeeClick}
            onApprove={handleApprove}
            onReject={handleReject}
          />
        )}

        {activeSection === "review" && (
          <ReviewSection
            employees={reviewEmployees}
            searchQuery={reviewSearchQuery}
            setSearchQuery={setReviewSearchQuery}
            jobFilter={reviewJobFilter}
            setJobFilter={setReviewJobFilter}
            statusFilter={reviewStatusFilter}
            setStatusFilter={setReviewStatusFilter}
            selectedEmployee={selectedReviewEmployee}
            employeeReviewDialogOpen={employeeReviewDialogOpen}
            setEmployeeReviewDialogOpen={setEmployeeReviewDialogOpen}
            savedReviewProgress={savedReviewProgress}
            onEmployeeClick={handleReviewEmployeeClick}
            onSaveReview={handleSaveReviewWithSync}
            onSubmitReview={handleSubmitReviewWithSync}
          />
        )}

        {activeSection === "finalize" && (
          <FinalizeSection
            employees={finalizeEmployees}
            onApprove={handleFinalizeApprove}
            onReject={handleFinalizeReject}
          />
        )}

        {activeSection === "view_all" && (
          <ViewAllSection employees={viewAllEmployees} />
        )}

        {activeSection === "history" && (
          <HistorySection cycleStates={cycleStates} />
        )}

        {activeSection === "template" && (
          <TemplateSection onCreateTemplate={handleCreateTemplate} />
        )}

        {activeSection === "audit" && (
          <AuditSection
            auditLogs={auditLogs}
            timeInterval={auditTimeInterval}
            setTimeInterval={setAuditTimeInterval}
            actorFilter={auditActorFilter}
            setActorFilter={setAuditActorFilter}
            actionFilter={auditActionFilter}
            setActionFilter={setAuditActionFilter}
            moduleFilter={auditModuleFilter}
            setModuleFilter={setAuditModuleFilter}
            recordIdFilter={auditRecordIdFilter}
            setRecordIdFilter={setAuditRecordIdFilter}
          />
        )}

        {activeSection === "register" && <RegisterSection />}
      </div>
    </div>
  );
}
