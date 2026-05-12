import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from './ui/table';
import { Badge } from './ui/badge';
import { Button } from './ui/button';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import type { AuditLogDTOActionType, PageAuditLogDTO } from '../../api';

interface AuditLogTableProps {
  page: PageAuditLogDTO;
  loading?: boolean;
  onPageChange: (page: number) => void;
}

const ACTION_COLORS: Record<AuditLogDTOActionType, string> = {
  CREATE: 'bg-green-100 text-green-800',
  UPDATE: 'bg-blue-100 text-blue-800',
  DELETE: 'bg-red-100 text-red-800',
};

function formatTimestamp(iso: string): string {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return iso;
  return d.toISOString().replace('T', ' ').replace(/\.\d+Z$/, ' UTC');
}

export function AuditLogTable({ page, loading, onPageChange }: AuditLogTableProps) {
  const { content, number, totalPages, totalElements, size } = page;
  const startIndex = number * size;
  const endIndex = startIndex + content.length;

  return (
    <div className="space-y-4">
      <div className="border rounded-lg bg-white">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-[200px]">Timestamp (UTC)</TableHead>
              <TableHead className="w-[180px]">Actor</TableHead>
              <TableHead className="w-[120px]">IP Address</TableHead>
              <TableHead className="w-[120px]">Action Type</TableHead>
              <TableHead className="w-[150px]">Affected Module</TableHead>
              <TableHead className="w-[110px]">Record ID</TableHead>
              <TableHead>Change Summary</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {loading ? (
              <TableRow>
                <TableCell colSpan={7} className="text-center py-8 text-gray-500">
                  Loading…
                </TableCell>
              </TableRow>
            ) : content.length === 0 ? (
              <TableRow>
                <TableCell colSpan={7} className="text-center py-8 text-gray-500">
                  No audit logs found
                </TableCell>
              </TableRow>
            ) : (
              content.map((log) => (
                <TableRow key={`${log.module}-${log.recordId}-${log.rev}`}>
                  <TableCell className="font-mono text-xs">
                    {formatTimestamp(log.timestamp)}
                  </TableCell>
                  <TableCell className="font-medium text-sm">{log.username}</TableCell>
                  <TableCell className="font-mono text-xs text-gray-600">{log.ipAddress}</TableCell>
                  <TableCell>
                    <Badge className={ACTION_COLORS[log.actionType] ?? 'bg-gray-100 text-gray-800'}>
                      {log.actionType}
                    </Badge>
                  </TableCell>
                  <TableCell className="font-medium">{log.module}</TableCell>
                  <TableCell className="font-mono text-xs">{log.recordId}</TableCell>
                  <TableCell className="text-sm text-gray-700">{log.changeSummary}</TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      {totalElements > 0 && (
        <div className="flex items-center justify-between">
          <div className="text-sm text-gray-600">
            Showing {startIndex + 1} to {endIndex} of {totalElements} entries
          </div>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => onPageChange(Math.max(number - 1, 0))}
              disabled={number === 0 || loading}
            >
              <ChevronLeft className="w-4 h-4 mr-1" />
              Previous
            </Button>
            <div className="text-sm text-gray-600">
              Page {number + 1} of {Math.max(totalPages, 1)}
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={() => onPageChange(Math.min(number + 1, totalPages - 1))}
              disabled={number >= totalPages - 1 || loading}
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