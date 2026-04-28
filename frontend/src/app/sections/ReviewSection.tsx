import { EmployeeTable } from "../components/EmployeeTable";
import { EmployeeReviewDialog } from "../components/EmployeeReviewDialog";
import type { ReviewEmployee, ReviewProgress } from "../types";

const STATUS_OPTIONS = ["Not Started", "In Progress", "Submitted", "Closed"];

const STATUS_COLOR_MAP: Record<string, string> = {
  "Not Started": "bg-gray-100 text-gray-800",
  "In Progress": "bg-blue-100 text-blue-800",
  "Submitted":   "bg-green-100 text-green-800",
  "Closed":      "bg-purple-100 text-purple-800",
};

interface ReviewSectionProps {
  employees: ReviewEmployee[];
  searchQuery: string;
  setSearchQuery: (v: string) => void;
  jobFilter: string;
  setJobFilter: (v: string) => void;
  statusFilter: string;
  setStatusFilter: (v: string) => void;
  selectedEmployee: ReviewEmployee | null;
  employeeReviewDialogOpen: boolean;
  setEmployeeReviewDialogOpen: (open: boolean) => void;
  savedReviewProgress: { [employeeId: string]: ReviewProgress };
  onEmployeeClick: (employee: ReviewEmployee) => void;
  onSaveReview: (employeeId: string, progress: ReviewProgress) => void;
  onSubmitReview: (employeeId: string, progress: ReviewProgress) => void;
}

export function ReviewSection({
  employees,
  searchQuery,
  setSearchQuery,
  jobFilter,
  setJobFilter,
  statusFilter,
  setStatusFilter,
  selectedEmployee,
  employeeReviewDialogOpen,
  setEmployeeReviewDialogOpen,
  savedReviewProgress,
  onEmployeeClick,
  onSaveReview,
  onSubmitReview,
}: ReviewSectionProps) {
  return (
    <>
      <EmployeeTable
        title="Review Performance"
        description="Review subordinates performance for this evaluation cycle"
        employees={employees}
        searchQuery={searchQuery}
        setSearchQuery={setSearchQuery}
        jobFilter={jobFilter}
        setJobFilter={setJobFilter}
        statusFilter={statusFilter}
        setStatusFilter={setStatusFilter}
        statusOptions={STATUS_OPTIONS}
        statusColorMap={STATUS_COLOR_MAP}
        onEmployeeClick={onEmployeeClick}
      />

      <EmployeeReviewDialog
        open={employeeReviewDialogOpen}
        onClose={() => setEmployeeReviewDialogOpen(false)}
        employee={selectedEmployee}
        onSave={onSaveReview}
        onSubmit={onSubmitReview}
        savedProgress={selectedEmployee ? savedReviewProgress[selectedEmployee.id] : undefined}
      />
    </>
  );
}
