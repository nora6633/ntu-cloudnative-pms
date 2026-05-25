import { useState, useEffect, useCallback } from 'react';
import { EmployeeTable } from '../components/EmployeeTable';
import { ViewAllDialog } from '../components/ViewAllDialog';
import type { BaseEmployee } from '../components/EmployeeTable';
import type { EvaluationDTO } from '../../api';
import { getEvaluationsForHr } from '../../api';

function displayStatus(status: string | undefined): string {
  switch (status) {
    case 'INITIAL':                      return 'Initial';
    case 'PENDING_GOAL_APPROVAL':        return 'Pending Goal Approval';
    case 'WORKING':                      return 'Working';
    case 'REVIEW':                       return 'Review';
    case 'PENDING_REVIEW_CONFIRMATION':  return 'Pending Review Confirmation';
    case 'PENDING_CLOSURE':              return 'Pending Closure';
    case 'CLOSED':                       return 'Closed';
    default:                             return status ?? '—';
  }
}


const STATUS_COLOR_MAP: Record<string, string> = {
  'Initial':                      'bg-gray-100 text-gray-700',
  'Pending Goal Approval':        'bg-yellow-100 text-yellow-800',
  'Working':                      'bg-blue-100 text-blue-800',
  'Review':                       'bg-purple-100 text-purple-800',
  'Pending Review Confirmation':  'bg-orange-100 text-orange-700',
  'Pending Closure':              'bg-orange-100 text-orange-800',
  'Closed':                       'bg-green-100 text-green-800',
};

interface EvalRow extends BaseEmployee {
  _evaluation: EvaluationDTO;
}

function toRow(e: EvaluationDTO): EvalRow {
  return {
    id: String(e.id),
    name: e.employeeName ?? '—',
    avatar: '',
    jobTitle: e.employeeJobTitle ?? '—',
    typeTitle: e.type ?? '—',
    status: displayStatus(e.status),
    cycle: e.cycle ?? '—',
    _evaluation: e,
  };
}

const DEFAULT_PAGE_SIZE = 10;

export function ViewAllSection() {
  const [rows, setRows]           = useState<EvalRow[]>([]);
  const [loading, setLoading]     = useState(true);
  const [initialLoading, setInitialLoading] = useState(true);
  const [error, setError]         = useState<string | null>(null);
  const [search, setSearch]       = useState('');
  const [jobFilter, setJob]       = useState('all');
  const [cycleTypeFilter, setCycleType]   = useState('all');
  const [statusFilter, setStatus] = useState('all');
  const [selected, setSelected]   = useState<EvalRow | null>(null);
  const [dialogOpen, setDialog]   = useState(false);
  const [page, setPage]           = useState(0);
  const [isFirst, setIsFirst]     = useState(true);
  const [isLast, setIsLast]       = useState(true);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await getEvaluationsForHr({
        pageable: {
          page: page,
          size: DEFAULT_PAGE_SIZE,
          sort: ['id,desc']
        }
      });
      setRows((res.data.content ?? []).map(toRow));
      setIsFirst(res.data.first ?? true);
      setIsLast(res.data.last ?? true);
    } catch {
      setError('Failed to load evaluations.');
    } finally {
      setLoading(false);
      setInitialLoading(false);
    }
  }, [page]);

  useEffect(() => { load(); }, [load]);

  if (initialLoading) return <div className="flex items-center justify-center min-h-screen"><p className="text-gray-500">Loading…</p></div>;
  if (error)   return <div className="flex items-center justify-center min-h-screen"><p className="text-red-500">{error}</p></div>;

  return (
    <>
      <EmployeeTable
        title="View All"
        description="Overview of all employees and their evaluation status"
        employees={rows}
        searchQuery={search}
        setSearchQuery={setSearch}
        jobFilter={jobFilter}
        setJobFilter={setJob}
        cycleTypeFilter={cycleTypeFilter}
        setCycleTypeFilter={setCycleType}
        statusFilter={statusFilter}
        setStatusFilter={setStatus}
        hideStatus={false}
        showCycle={true}
        statusColorMap={STATUS_COLOR_MAP}
        onEmployeeClick={(row) => { setSelected(row); setDialog(true); }}
        currentPage={page}
        isFirstPage={isFirst}
        isLastPage={isLast}
        onPageChange={setPage}
        isLoading={loading}
      />

      <ViewAllDialog
        open={dialogOpen}
        onClose={() => setDialog(false)}
        evaluation={selected?._evaluation ?? null}
      />
    </>
  );
}
