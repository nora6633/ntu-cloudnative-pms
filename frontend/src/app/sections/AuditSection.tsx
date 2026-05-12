import { Label } from "../components/ui/label";
import { Input } from "../components/ui/input";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "../components/ui/select";
import { AuditLogTable } from "../components/AuditLogTable";
import type { AuditLog } from "../types";

interface AuditSectionProps {
  auditLogs: AuditLog[];
  timeInterval: string;
  setTimeInterval: (v: string) => void;
  actorFilter: string;
  setActorFilter: (v: string) => void;
  actionFilter: string;
  setActionFilter: (v: string) => void;
  moduleFilter: string;
  setModuleFilter: (v: string) => void;
  recordIdFilter: string;
  setRecordIdFilter: (v: string) => void;
}

export function AuditSection({
  auditLogs,
  timeInterval,
  setTimeInterval,
  actorFilter,
  setActorFilter,
  actionFilter,
  setActionFilter,
  moduleFilter,
  setModuleFilter,
  recordIdFilter,
  setRecordIdFilter,
}: AuditSectionProps) {
  const uniqueActors = Array.from(new Set(auditLogs.map((log) => log.actor)));
  const uniqueModules = Array.from(new Set(auditLogs.map((log) => log.affectedModule)));

  const filteredLogs = auditLogs.filter((log) => {
    const matchesActor = actorFilter === "all" || log.actor === actorFilter;
    const matchesAction = actionFilter === "all" || log.actionType === actionFilter;
    const matchesModule = moduleFilter === "all" || log.affectedModule === moduleFilter;
    const matchesRecordId =
      !recordIdFilter ||
      log.affectedRecordId.toLowerCase().includes(recordIdFilter.toLowerCase());

    let matchesTime = true;
    if (timeInterval !== "all") {
      const logDate = new Date(log.timestamp);
      const now = new Date();
      const hoursDiff = (now.getTime() - logDate.getTime()) / (1000 * 60 * 60);
      switch (timeInterval) {
        case "1h":  matchesTime = hoursDiff <= 1;   break;
        case "24h": matchesTime = hoursDiff <= 24;  break;
        case "7d":  matchesTime = hoursDiff <= 168; break;
        case "30d": matchesTime = hoursDiff <= 720; break;
      }
    }

    return matchesActor && matchesAction && matchesModule && matchesRecordId && matchesTime;
  });

  return (
    <div className="p-8">
      <div className="max-w-7xl mx-auto">
        <div className="mb-8">
          <h2 className="text-2xl font-bold text-gray-900">Audit Log</h2>
          <p className="text-gray-600 mt-1">View system activity and changes</p>
        </div>

        <div className="bg-white rounded-lg border p-6 mb-6">
          <h3 className="font-semibold mb-4">Filter Audit Logs</h3>
          <div className="grid grid-cols-5 gap-4">
            <div>
              <Label className="text-sm mb-2 block">Time Interval</Label>
              <Select value={timeInterval} onValueChange={setTimeInterval}>
                <SelectTrigger><SelectValue placeholder="All Time" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Time</SelectItem>
                  <SelectItem value="1h">Last Hour</SelectItem>
                  <SelectItem value="24h">Last 24 Hours</SelectItem>
                  <SelectItem value="7d">Last 7 Days</SelectItem>
                  <SelectItem value="30d">Last 30 Days</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label className="text-sm mb-2 block">Actor</Label>
              <Select value={actorFilter} onValueChange={setActorFilter}>
                <SelectTrigger><SelectValue placeholder="All Actors" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Actors</SelectItem>
                  {uniqueActors.map((actor) => (
                    <SelectItem key={actor} value={actor}>{actor}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label className="text-sm mb-2 block">Action Type</Label>
              <Select value={actionFilter} onValueChange={setActionFilter}>
                <SelectTrigger><SelectValue placeholder="All Actions" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Actions</SelectItem>
                  <SelectItem value="CREATE">CREATE</SelectItem>
                  <SelectItem value="UPDATE">UPDATE</SelectItem>
                  <SelectItem value="DELETE">DELETE</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label className="text-sm mb-2 block">Affected Module</Label>
              <Select value={moduleFilter} onValueChange={setModuleFilter}>
                <SelectTrigger><SelectValue placeholder="All Modules" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Modules</SelectItem>
                  {uniqueModules.map((module) => (
                    <SelectItem key={module} value={module}>{module}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label className="text-sm mb-2 block">Record ID</Label>
              <Input
                placeholder="Search record ID..."
                value={recordIdFilter}
                onChange={(e) => setRecordIdFilter(e.target.value)}
              />
            </div>
          </div>
        </div>

        <AuditLogTable logs={filteredLogs} />
      </div>
    </div>
  );
}
