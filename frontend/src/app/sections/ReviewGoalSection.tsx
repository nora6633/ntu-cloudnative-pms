import { useState, useEffect, useCallback } from 'react';
import { EmployeeTable } from '../components/EmployeeTable';
import { ReviewDialog } from '../components/ReviewDialog';
import type { BaseEmployee } from '../components/EmployeeTable';
import type { EvaluationDTO } from '../../api';
import { getEvaluationsForManager, approveGoals, rejectGoals } from '../../api';


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
    status: 'Pending Goal Approval',
    _evaluation: e,
  };
}

export function ReviewGoalSection() {
  const [rows, setRows]         = useState<EvalRow[]>([]);
  const [loading, setLoading]   = useState(true);
  const [error, setError]       = useState<string | null>(null);
  const [search, setSearch]     = useState('');
  const [jobFilter, setJob]     = useState('all');
  const [cycleTypeFilter, setCycleType]   = useState('all');
  const [selected, setSelected] = useState<EvalRow | null>(null);
  const [dialogOpen, setDialog] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await getEvaluationsForManager({ pageable: { page: 0, size: 100 } });
      const pending = (res.data.content ?? []).filter(
        (e) => e.status === 'PENDING_GOAL_APPROVAL',
      );
      setRows(pending.map(toRow));
    } catch {
      setError('Failed to load evaluations.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  const handleApprove = async (id: number) => {
    await approveGoals(id);
    await load();
  };

  const handleReject = async (id: number) => {
    await rejectGoals(id);
    await load();
  };

  if (loading) return <div className="flex items-center justify-center min-h-screen"><p className="text-gray-500">Loading…</p></div>;
  if (error)   return <div className="flex items-center justify-center min-h-screen"><p className="text-red-500">{error}</p></div>;

  return (
    <>
      <EmployeeTable
        title="Review Goals"
        description="Review and approve employee goal submissions"
        employees={rows}
        searchQuery={search}
        setSearchQuery={setSearch}
        jobFilter={jobFilter}
        setJobFilter={setJob}
        cycleTypeFilter={cycleTypeFilter}
        setCycleTypeFilter={setCycleType}
        statusFilter="all"
        setStatusFilter={() => {}}
        hideStatus={true}
        statusOptions={[]}
        statusColorMap={{}}
        onEmployeeClick={(row) => { setSelected(row); setDialog(true); }}
      />
      <ReviewDialog
        open={dialogOpen}
        onClose={() => setDialog(false)}
        evaluation={selected?._evaluation ?? null}
        onApprove={handleApprove}
        onReject={handleReject}
      />
    </>
  );
}
