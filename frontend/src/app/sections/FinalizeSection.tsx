import { useState, useEffect, useCallback } from 'react';
import { EmployeeTable } from '../components/EmployeeTable';
import { FinalizeDialog } from '../components/FinalizeDialog';
import type { BaseEmployee } from '../components/EmployeeTable';
import type { EvaluationDTO } from '../../api';
import { getEvaluationsForHr, approveEvaluation, rejectEvaluation } from '../../api';


const STATUS_OPTIONS = ['Pending'];

const STATUS_COLOR_MAP: Record<string, string> = {
  Pending:  'bg-yellow-100 text-yellow-800',
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
    status: "Pending",
    _evaluation: e,
  };
}

export function FinalizeSection() {
  const [rows, setRows]           = useState<EvalRow[]>([]);
  const [loading, setLoading]     = useState(true);
  const [error, setError]         = useState<string | null>(null);
  const [search, setSearch]       = useState('');
  const [jobFilter, setJob]       = useState('all');
  const [cycleTypeFilter, setCycleType]   = useState('all');
  const [selected, setSelected]   = useState<EvalRow | null>(null);
  const [dialogOpen, setDialog]   = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await getEvaluationsForHr({ pageable: { page: 0, size: 10 } });
      const closeable = (res.data.content ?? []).filter(
        (e) => e.status === 'PENDING_CLOSURE',
      );
      setRows(closeable.map(toRow));
    } catch {
      setError('Failed to load evaluations.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  const handleApprove = async (id: number) => {
    try {
      await approveEvaluation(id);
    } catch {
      alert('Failed to approve evaluation.');
    } finally {
      await load();
    }
  };

  const handleReject = async (id: number) => {
    try {
      await rejectEvaluation(id);
    } catch {
      alert('Failed to reject evaluation.');
    } finally {
      await load();
    }
  };

  if (loading) return <div className="flex items-center justify-center min-h-screen"><p className="text-gray-500">Loading…</p></div>;
  if (error)   return <div className="flex items-center justify-center min-h-screen"><p className="text-red-500">{error}</p></div>;

  return (
    <>
      <EmployeeTable
        title="Finalize"
        description="Review evaluation results and finalize employee appraisals"
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
        statusOptions={STATUS_OPTIONS}
        statusColorMap={STATUS_COLOR_MAP}
        onEmployeeClick={(row) => { setSelected(row); setDialog(true); }}
      />

      <FinalizeDialog
        open={dialogOpen}
        onClose={() => setDialog(false)}
        evaluation={selected?._evaluation ?? null}
        onApprove={handleApprove}
        onReject={handleReject}
      />
    </>
  );
}
