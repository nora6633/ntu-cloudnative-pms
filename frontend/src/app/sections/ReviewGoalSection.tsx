import { EmployeeTable } from "../components/EmployeeTable";
import { ReviewDialog } from "../components/ReviewDialog";
import type { ReviewGoalEmployee } from "../types";

const STATUS_OPTIONS = ["Pending", "Approved", "Rejected"];

const STATUS_COLOR_MAP: Record<string, string> = {
  Pending:  "bg-yellow-100 text-yellow-800",
  Approved: "bg-green-100 text-green-800",
  Rejected: "bg-red-100 text-red-800",
};

interface ReviewGoalSectionProps {
  employees: ReviewGoalEmployee[];
  searchQuery: string;
  setSearchQuery: (v: string) => void;
  jobFilter: string;
  setJobFilter: (v: string) => void;
  statusFilter: string;
  setStatusFilter: (v: string) => void;
  selectedEmployee: ReviewGoalEmployee | null;
  reviewDialogOpen: boolean;
  setReviewDialogOpen: (open: boolean) => void;
  onEmployeeClick: (employee: ReviewGoalEmployee) => void;
  onApprove: (id: string) => void;
  onReject: (id: string) => void;
}

export function ReviewGoalSection({
  employees,
  searchQuery,
  setSearchQuery,
  jobFilter,
  setJobFilter,
  statusFilter,
  setStatusFilter,
  selectedEmployee,
  reviewDialogOpen,
  setReviewDialogOpen,
  onEmployeeClick,
  onApprove,
  onReject,
}: ReviewGoalSectionProps) {
  return (
    <>
      <EmployeeTable
        title="Review Goals"
        description="Review and approve employee goal submissions"
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

      <ReviewDialog
        open={reviewDialogOpen}
        onClose={() => setReviewDialogOpen(false)}
        employee={selectedEmployee}
        onApprove={onApprove}
        onReject={onReject}
      />
    </>
  );
}
