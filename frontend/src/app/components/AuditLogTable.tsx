import { useState } from "react";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "./ui/table";
import { Badge } from "./ui/badge";
import { Button } from "./ui/button";
import { ChevronLeft, ChevronRight } from "lucide-react";

interface AuditLog {
  id: string;
  timestamp: string;
  actor: string;
  actorRole: string;
  actionType: "CREATE" | "UPDATE" | "DELETE";
  affectedModule: string;
  affectedRecordId: string;
  changeSummary: string;
}

interface AuditLogTableProps {
  logs: AuditLog[];
}

const ITEMS_PER_PAGE = 10;

export function AuditLogTable({ logs }: AuditLogTableProps) {
  const [currentPage, setCurrentPage] = useState(1);

  const totalPages = Math.ceil(logs.length / ITEMS_PER_PAGE);
  const startIndex = (currentPage - 1) * ITEMS_PER_PAGE;
  const endIndex = startIndex + ITEMS_PER_PAGE;
  const currentLogs = logs.slice(startIndex, endIndex);

  const getActionColor = (action: string) => {
    switch (action) {
      case "CREATE":
        return "bg-green-100 text-green-800";
      case "UPDATE":
        return "bg-blue-100 text-blue-800";
      case "DELETE":
        return "bg-red-100 text-red-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  const handlePrevPage = () => {
    setCurrentPage((prev) => Math.max(prev - 1, 1));
  };

  const handleNextPage = () => {
    setCurrentPage((prev) => Math.min(prev + 1, totalPages));
  };

  return (
    <div className="space-y-4">
      <div className="border rounded-lg bg-white">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-[180px]">Timestamp (UTC)</TableHead>
              <TableHead className="w-[200px]">Actor</TableHead>
              <TableHead className="w-[120px]">Action Type</TableHead>
              <TableHead className="w-[150px]">Affected Module</TableHead>
              <TableHead className="w-[150px]">Record ID</TableHead>
              <TableHead>Change Summary</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {currentLogs.length === 0 ? (
              <TableRow>
                <TableCell colSpan={6} className="text-center py-8 text-gray-500">
                  No audit logs found
                </TableCell>
              </TableRow>
            ) : (
              currentLogs.map((log) => (
                <TableRow key={log.id}>
                  <TableCell className="font-mono text-xs">
                    {log.timestamp}
                  </TableCell>
                  <TableCell>
                    <div>
                      <div className="font-medium text-sm">{log.actor}</div>
                      <div className="text-xs text-gray-500">{log.actorRole}</div>
                    </div>
                  </TableCell>
                  <TableCell>
                    <Badge className={getActionColor(log.actionType)}>
                      {log.actionType}
                    </Badge>
                  </TableCell>
                  <TableCell className="font-medium">{log.affectedModule}</TableCell>
                  <TableCell className="font-mono text-xs">{log.affectedRecordId}</TableCell>
                  <TableCell className="text-sm text-gray-700">{log.changeSummary}</TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      {logs.length > 0 && (
        <div className="flex items-center justify-between">
          <div className="text-sm text-gray-600">
            Showing {startIndex + 1} to {Math.min(endIndex, logs.length)} of {logs.length} entries
          </div>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={handlePrevPage}
              disabled={currentPage === 1}
            >
              <ChevronLeft className="w-4 h-4 mr-1" />
              Previous
            </Button>
            <div className="text-sm text-gray-600">
              Page {currentPage} of {totalPages}
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={handleNextPage}
              disabled={currentPage === totalPages}
            >
              Next
              <ChevronRight className="w-4 h-4 ml-1" />
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
