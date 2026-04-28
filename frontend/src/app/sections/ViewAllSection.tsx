import { useState } from "react";
import { EmployeeTable } from "../components/EmployeeTable";
import { ViewAllDialog } from "../components/ViewAllDialog";
import type { ViewAllEmployee } from "../types";

const STATUS_OPTIONS = [
  "Initial",
  "Pending_goal_approval",
  "Working",
  "Review",
  "Pending_Closure",
  "Closed",
];

const STATUS_COLOR_MAP: Record<string, string> = {
  Initial:               "bg-gray-100 text-gray-700",
  Pending_goal_approval: "bg-yellow-100 text-yellow-800",
  Working:               "bg-blue-100 text-blue-800",
  Review:                "bg-purple-100 text-purple-800",
  Pending_Closure:       "bg-orange-100 text-orange-800",
  Closed:                "bg-green-100 text-green-800",
};

interface ViewAllSectionProps {
  employees: ViewAllEmployee[];
}

export function ViewAllSection({ employees }: ViewAllSectionProps) {
  const [searchQuery, setSearchQuery]   = useState("");
  const [jobFilter, setJobFilter]       = useState("all");
  const [statusFilter, setStatusFilter] = useState("all");
  const [selected, setSelected]         = useState<ViewAllEmployee | null>(null);
  const [dialogOpen, setDialogOpen]     = useState(false);

  const handleClick = (employee: ViewAllEmployee) => {
    setSelected(employee);
    setDialogOpen(true);
  };

  return (
    <>
      <EmployeeTable
        title="View All"
        description="Overview of all employees and their evaluation status"
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

      <ViewAllDialog
        open={dialogOpen}
        onClose={() => setDialogOpen(false)}
        employee={selected}
      />
    </>
  );
}
