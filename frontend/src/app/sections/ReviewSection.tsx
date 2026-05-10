import { useState, useEffect, useCallback } from 'react';
import { EmployeeTable } from '../components/EmployeeTable';
import { EmployeeReviewDialog } from '../components/EmployeeReviewDialog';
import type { BaseEmployee } from '../components/EmployeeTable';
import type { EvaluationDTO, EvaluationItemDTO } from '../../api';
import { getEvaluationsForManager, draftReview, submitReview } from '../../api';


const STATUS_OPTIONS = ['Review Drafting'];

const STATUS_COLOR_MAP: Record<string, string> = {
  'Review Drafting': 'bg-gray-100 text-gray-800',
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
    status: "Review Drafting",
    _evaluation: e,
  };
}

export function ReviewSection() {
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
      const res = await getEvaluationsForManager({ pageable: { page: 0, size: 100 } });
      const inReview = (res.data.content ?? []).filter((e) =>
        e.status === 'REVIEW',
      );
      setRows(inReview.map(toRow));
    } catch {
      setError('Failed to load evaluations.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  const handleSave = async (id: number, items: EvaluationItemDTO[]) => {
    try {      await draftReview(id, items);
      alert('Draft saved successfully.');
    } catch {
      alert('Failed to save draft.');
    }
  };

  const handleSubmit = async (id: number, items: EvaluationItemDTO[]) => {
    try {
      await draftReview(id, items);
      await submitReview(id);
      await load();

      alert('Review submitted successfully.');
    } catch {
      alert('Failed to submit review.');
    }
};

  if (loading) return <div className="flex items-center justify-center min-h-screen"><p className="text-gray-500">Loading…</p></div>;
  if (error)   return <div className="flex items-center justify-center min-h-screen"><p className="text-red-500">{error}</p></div>;

  return (
    <>
      <EmployeeTable
        title="Review Performance"
        description="Review subordinates' performance for this evaluation cycle"
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

      <EmployeeReviewDialog
        open={dialogOpen}
        onClose={() => setDialog(false)}
        evaluation={selected?._evaluation ?? null}
        onSave={handleSave}
        onSubmit={handleSubmit}
      />
    </>
  );
}
