import { useState, useEffect, useCallback } from 'react';
import { EmployeeTable } from '../components/EmployeeTable';
import { EmployeeReviewDialog } from '../components/EmployeeReviewDialog';
import type { BaseEmployee } from '../components/EmployeeTable';
import { NotificationDialog } from '../components/NotificationDialog';
import type { EvaluationDTO, EvaluationItemDTO } from '../../api';
import { getEvaluationsForManager, draftReview, submitReview } from '../../api';

const MESSAGES = {
  saveFeedback:{
    successTitle: 'Saved',
    successMsg: 'You have saved the feedback.',
    errorMsg: 'Failed to save the feedback. Please try again.',
  },
  submitFeedback:{
    successTitle: 'Submitted',
    successMsg: 'You have submitted the feedback.',
    errorMsg: 'Failed to submit the feedback. Please try again.',
  },
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
  const [reloadOnConfirm, setReloadOnConfirm] = useState(false);

  const [notificationOpen, setNotificationOpen] = useState(false);
  const [notificationTitle, setNotificationTitle] = useState('');
  const [notificationMessage, setNotificationMessage] = useState('');
  const [notificationType, setNotificationType] = useState<'success'|'error'>('success');

  const showNotification = (title: string, message: string, type: 'success' | 'error') => {
    setNotificationTitle(title);
    setNotificationMessage(message);
    setNotificationType(type);
    setNotificationOpen(true);
  };

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

  const handleClose = () => {
    setDialog(false);
    load();
  };

  const handleSave = async (id: number, items: EvaluationItemDTO[]) => {
    try {
      await draftReview(id, items);
      setReloadOnConfirm(false);
      showNotification(MESSAGES.saveFeedback.successTitle, MESSAGES.saveFeedback.successMsg, 'success')
    } catch {
      setReloadOnConfirm(false);
      showNotification('Error', MESSAGES.saveFeedback.errorMsg, 'error')
    }
  };

  const handleSubmit = async (id: number, items: EvaluationItemDTO[]) => {
    try {
      await draftReview(id, items);
      await submitReview(id);
      setReloadOnConfirm(true);
      showNotification(MESSAGES.submitFeedback.successTitle, MESSAGES.submitFeedback.successMsg, 'success')
    } catch {
      setReloadOnConfirm(false);
      showNotification('Error', MESSAGES.submitFeedback.errorMsg, 'error')
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
        //statusOptions={[]}
        statusColorMap={{}}
        onEmployeeClick={(row) => { setSelected(row); setDialog(true); }}
      />

      <EmployeeReviewDialog
        open={dialogOpen}
        onClose={handleClose}
        evaluation={selected?._evaluation ?? null}
        onSave={handleSave}
        onSubmit={handleSubmit}
      />

      <NotificationDialog
        open={notificationOpen}
        onOpenChange={setNotificationOpen}
        type={notificationType}
        title={notificationTitle}
        message={notificationMessage}
        onConfirm={() => {
          if (reloadOnConfirm) {
            load();
            setReloadOnConfirm(false);
          }
        }}
      />
    </>
  );
}
