import { Search, ChevronLeft, ChevronRight } from "lucide-react";
import { Label } from "../components/ui/label";
import { Input } from "../components/ui/input";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "../components/ui/select";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "../components/ui/table";
import { Avatar, AvatarFallback, AvatarImage } from "../components/ui/avatar";
import { Badge } from "../components/ui/badge";
import { Button } from "../components/ui/button";

export interface BaseEmployee {
  id: string;
  name: string;
  avatar: string;
  jobTitle: string;
  typeTitle: string;
  status: string;
  cycle?: string;
}

function getInitials(name: string) {
  return name.split(" ").map((n) => n[0]).join("").toUpperCase();
}

interface EmployeeTableProps<T extends BaseEmployee> {
  title: string;
  description: string;
  employees: T[];
  searchQuery: string;
  setSearchQuery: (v: string) => void;
  jobFilter: string;
  setJobFilter: (v: string) => void;
  cycleTypeFilter: string;
  setCycleTypeFilter: (v: string) => void;
  statusFilter: string;
  setStatusFilter: (v: string) => void;
  hideStatus?: boolean;
  showCycle?: boolean;
  //statusOptions: string[];
  statusColorMap: Record<string, string>;
  onEmployeeClick: (employee: T) => void;
  currentPage?: number;
  isFirstPage?: boolean;
  isLastPage?: boolean;
  onPageChange?: (newPage: number) => void;
  isLoading?: boolean;
}

export function EmployeeTable<T extends BaseEmployee>({
  title,
  description,
  employees,
  searchQuery,
  setSearchQuery,
  jobFilter,
  setJobFilter,
  cycleTypeFilter,
  setCycleTypeFilter,
  statusFilter,
  setStatusFilter,
  hideStatus = false,
  showCycle = false,
  //statusOptions,
  statusColorMap,
  onEmployeeClick,
  currentPage,
  isFirstPage,
  isLastPage,
  onPageChange,
  isLoading = false,
}: EmployeeTableProps<T>) {
  const uniqueJobTitles = Array.from(new Set(employees.map((e) => e.jobTitle)));
  const uniqueTypeTitles = Array.from(new Set(employees.map((e) => e.typeTitle)));
  const uniqueStatusOptions = Array.from(new Set(employees.map((e) => e.status)));

  const startIndex = currentPage !== undefined ? currentPage * 10 : 0;
  const endIndex = startIndex + employees.length;

  // TODO: Move filtering and searching to the server-side once the backend API supports it.
  // Currently, we perform client-side filtering which is constrained to the loaded page size (e.g. 10 items).
  const filtered = employees.filter((employee) => {
    const matchesSearch = employee.name.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesJob = jobFilter === "all" || employee.jobTitle === jobFilter;
    const matchesType = cycleTypeFilter === "all" || employee.typeTitle === cycleTypeFilter;
    const matchesStatus = statusFilter === "all" || employee.status === statusFilter;
    return matchesSearch && matchesJob && matchesType && matchesStatus;
  });

  const getStatusColor = (status: string) =>
    statusColorMap[status] ?? "bg-gray-100 text-gray-800";

  return (
    <div className="p-8">
      <div className="max-w-7xl mx-auto">
        <div className="mb-8">
          <h2 className="text-2xl font-bold text-gray-900">{title}</h2>
          <p className="text-gray-600 mt-1">{description}</p>
        </div>

        <div className="bg-white rounded-lg border">
          <div className="p-6 border-b bg-gray-50">
            <div className="flex gap-4 items-end">
              <div className="flex-1">
                <Label htmlFor="search" className="text-sm mb-2 block">Search by Name</Label>
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                  <Input
                    id="search"
                    placeholder="Type employee name..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="pl-10"
                  />
                </div>
              </div>

              <div className="w-53">
                <Label className="text-sm mb-2 block">Filter by Job</Label>
                <Select value={jobFilter} onValueChange={setJobFilter}>
                  <SelectTrigger><SelectValue placeholder="All Jobs" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Jobs</SelectItem>
                    {uniqueJobTitles.map((job) => (
                      <SelectItem key={job} value={job}>{job}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="w-46">
                <Label className="text-sm mb-2 block">Filter by Cycle Type</Label>
                <Select value={cycleTypeFilter} onValueChange={setCycleTypeFilter}>
                  <SelectTrigger><SelectValue placeholder="All Types" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Types</SelectItem>
                    {uniqueTypeTitles.map((type) => (
                      <SelectItem key={type} value={type}>{type}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {!hideStatus && (
                <div className="w-52">
                  <Label className="text-sm mb-2 block">Filter by Status</Label>
                  <Select value={statusFilter} onValueChange={setStatusFilter}>
                    <SelectTrigger><SelectValue placeholder="All Status" /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Status</SelectItem>
                      {uniqueStatusOptions.map((s) => (
                        <SelectItem key={s} value={s}>{s}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              )}
            </div>
          </div>

          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-[300px]">Employee</TableHead>
                <TableHead>Job Title</TableHead>
                <TableHead>Cycle Type</TableHead>
                {showCycle && <TableHead>Cycle Name</TableHead>}
                {!hideStatus && <TableHead>Status</TableHead>}  
              </TableRow>
            </TableHeader>
            <TableBody>
              {filtered.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={3 + (showCycle ? 1 : 0) + (hideStatus ? 0 : 1)} className="text-center py-8 text-gray-500">
                    No employees found matching your filters
                  </TableCell>
                </TableRow>
              ) : (
                filtered.map((employee) => (
                  <TableRow
                    key={employee.id}
                    className="cursor-pointer hover:bg-gray-50"
                    onClick={() => onEmployeeClick(employee)}
                  >
                    <TableCell>
                      <div className="flex items-center gap-3">
                        <Avatar>
                          <AvatarImage src={employee.avatar} alt={employee.name} />
                          <AvatarFallback>{getInitials(employee.name)}</AvatarFallback>
                        </Avatar>
                        <span className="font-medium">{employee.name}</span>
                      </div>
                    </TableCell>
                    <TableCell>{employee.jobTitle}</TableCell>
                    <TableCell>{employee.typeTitle}</TableCell>
                    {showCycle && <TableCell>{employee.cycle ?? "—"}</TableCell>}
                    {!hideStatus && ( 
                    <TableCell>
                      <Badge className={getStatusColor(employee.status)}>
                        {employee.status}
                      </Badge>
                    </TableCell>
                    )}
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>

          {onPageChange !== undefined && currentPage !== undefined && !(employees.length === 0 && currentPage === 0) && (
            <div className="p-4 border-t flex items-center justify-between bg-gray-50 rounded-b-lg">
              <div className="text-sm text-gray-600">
                Showing {employees.length > 0 ? startIndex + 1 : 0} to {endIndex} entries
              </div>
              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => onPageChange(Math.max(0, currentPage - 1))}
                  disabled={isFirstPage || isLoading}
                  className="flex items-center gap-1.5 text-xs"
                >
                  <ChevronLeft className="w-4 h-4 mr-1" />
                  Previous
                </Button>
                <div className="text-sm text-gray-600 font-medium px-2">
                  {isLoading ? "Loading..." : `Page ${currentPage + 1}`}
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => onPageChange(currentPage + 1)}
                  disabled={isLastPage || isLoading}
                  className="flex items-center gap-1.5 text-xs"
                >
                  Next
                  <ChevronRight className="w-4 h-4 ml-1" />
                </Button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
