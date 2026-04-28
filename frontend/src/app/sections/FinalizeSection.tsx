import { useState } from "react";
import { EmployeeTable } from "../components/EmployeeTable";
import { FinalizeDialog } from "../components/FinalizeDialog";
import type { FinalizeEmployee } from "../types";

const STATUS_OPTIONS = ["Pending", "Approved", "Rejected"];

const STATUS_COLOR_MAP: Record<string, string> = {
  Pending:  "bg-yellow-100 text-yellow-800",
  Approved: "bg-green-100 text-green-800",
  Rejected: "bg-red-100 text-red-800",
};

interface FinalizeSectionProps {
  employees: FinalizeEmployee[];
  onApprove: (id: string) => void;
  onReject: (id: string) => void;
}

export function FinalizeSection({ employees, onApprove, onReject }: FinalizeSectionProps) {
  const [searchQuery, setSearchQuery]   = useState("");
  const [jobFilter, setJobFilter]       = useState("all");
  const [statusFilter, setStatusFilter] = useState("all");
  const [selected, setSelected]         = useState<FinalizeEmployee | null>(null);
  const [dialogOpen, setDialogOpen]     = useState(false);

  const handleClick = (employee: FinalizeEmployee) => {
    setSelected(employee);
    setDialogOpen(true);
  };

  return (
    <>
      <EmployeeTable
        title="Finalize"
        description="Review evaluation results and finalize employee appraisals"
        employees={employees}
        searchQuery={searchQuery}
        setSearchQuery={setSearchQuery}
        jobFilter={jobFilter}
        setJobFilter={setJobFilter}
        statusFilter={statusFilter}
        setStatusFilter={setStatusFilter}
        statusOptions={STATUS_OPTIONS}
        statusColorMap={STATUS_COLOR_MAP}
        onEmployeeClick={handleClick}
      />

      <FinalizeDialog
        open={dialogOpen}
        onClose={() => setDialogOpen(false)}
        employee={selected}
        onApprove={onApprove}
        onReject={onReject}
      />
    </>
  );
}
