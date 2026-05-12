import { useState, useEffect, useCallback, useMemo } from 'react';
import { Label } from '../components/ui/label';
import { Input } from '../components/ui/input';
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '../components/ui/select';
import { AuditLogTable } from '../components/AuditLogTable';
import {
  getAuditLogs,
  getModules,
  type AuditLogDTOActionType,
  type PageAuditLogDTO,
} from '../../api';

const PAGE_SIZE = 10;

type TimeInterval = 'all' | '1h' | '24h' | '7d' | '30d';

const TIME_INTERVAL_HOURS: Record<Exclude<TimeInterval, 'all'>, number> = {
  '1h': 1,
  '24h': 24,
  '7d': 24 * 7,
  '30d': 24 * 30,
};

function fromForInterval(interval: TimeInterval): string | undefined {
  if (interval === 'all') return undefined;
  const hours = TIME_INTERVAL_HOURS[interval];
  return new Date(Date.now() - hours * 3600 * 1000).toISOString();
}

const EMPTY_PAGE: PageAuditLogDTO = {
  content: [],
  totalElements: 0,
  totalPages: 0,
  size: PAGE_SIZE,
  number: 0,
  first: true,
  last: true,
  numberOfElements: 0,
  empty: true,
};

export function AuditSection() {
  const [timeInterval, setTimeInterval] = useState<TimeInterval>('all');
  const [actorFilter, setActorFilter] = useState('');
  const [actionFilter, setActionFilter] = useState<'all' | AuditLogDTOActionType>('all');
  const [moduleFilter, setModuleFilter] = useState('all');
  const [recordIdFilter, setRecordIdFilter] = useState('');

  const [page, setPage] = useState(0);
  const [data, setData] = useState<PageAuditLogDTO>(EMPTY_PAGE);
  const [modules, setModules] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Reset to page 0 whenever filters change, otherwise paging into a
  // page that no longer exists for the new filter feels broken.
  useEffect(() => {
    setPage(0);
  }, [timeInterval, actorFilter, actionFilter, moduleFilter, recordIdFilter]);

  const params = useMemo(() => ({
    actor: actorFilter.trim() || undefined,
    actionType: actionFilter === 'all' ? undefined : actionFilter,
    module: moduleFilter === 'all' ? undefined : moduleFilter,
    recordId: recordIdFilter.trim() || undefined,
    from: fromForInterval(timeInterval),
    page,
    size: PAGE_SIZE,
    sort: 'rev,desc',
  }), [timeInterval, actorFilter, actionFilter, moduleFilter, recordIdFilter, page]);

  const fetchLogs = useCallback(() => {
    setLoading(true);
    setError(null);
    getAuditLogs(params)
      .then((res) => setData(res.data))
      .catch((e: Error) => {
        setError(e.message || 'Failed to load audit logs.');
        setData(EMPTY_PAGE);
      })
      .finally(() => setLoading(false));
  }, [params]);

  useEffect(() => { fetchLogs(); }, [fetchLogs]);

  useEffect(() => {
    getModules()
      .then((res) => setModules(res.data))
      .catch(() => setModules([]));
  }, []);

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
              <Select value={timeInterval} onValueChange={(v) => setTimeInterval(v as TimeInterval)}>
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
              <Label className="text-sm mb-2 block">Actor (username)</Label>
              <Input
                placeholder="Filter by username…"
                value={actorFilter}
                onChange={(e) => setActorFilter(e.target.value)}
              />
            </div>

            <div>
              <Label className="text-sm mb-2 block">Action Type</Label>
              <Select
                value={actionFilter}
                onValueChange={(v) => setActionFilter(v as 'all' | AuditLogDTOActionType)}
              >
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
                  {modules.map((m) => (
                    <SelectItem key={m} value={m}>{m}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label className="text-sm mb-2 block">Record ID</Label>
              <Input
                placeholder="Search record ID…"
                value={recordIdFilter}
                onChange={(e) => setRecordIdFilter(e.target.value)}
              />
            </div>
          </div>
        </div>

        {error && (
          <div className="mb-4 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
            {error}
          </div>
        )}

        <AuditLogTable
          page={data}
          loading={loading}
          onPageChange={setPage}
        />
      </div>
    </div>
  );
}