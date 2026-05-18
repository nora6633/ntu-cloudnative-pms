import { useState, useEffect, useCallback } from 'react';
import { EmployeeTable } from '../components/EmployeeTable';
import { FinalizeDialog } from '../components/FinalizeDialog';
import type { BaseEmployee } from '../components/EmployeeTable';
import { NotificationDialog } from '../components/NotificationDialog';
import type { EvaluationDTO } from '../../api';
import { getEvaluationsForHr, approveEvaluation, rejectEvaluation } from '../../api';

const MESSAGES = {
  rejectFeedback:{
    successTitle: 'Rejected',
    successMsg: 'You have rejected the feedback',
    errorMsg: 'Failed to reject the feedback. Please try again.',
  },
  approveFeedback:{
    successTitle: 'Approved',
    successMsg: 'You have approved the feedback',
    errorMsg: 'Failed to approve the feedback. Please try again.',
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
      showNotification(MESSAGES.approveFeedback.successTitle, MESSAGES.approveFeedback.successMsg, 'success')
    } catch {
      showNotification('Error', MESSAGES.approveFeedback.errorMsg, 'error')
    } finally {
      await load();
    }
  };

  const handleReject = async (id: number) => {
    try {
      await rejectEvaluation(id);
      showNotification(MESSAGES.rejectFeedback.successTitle, MESSAGES.rejectFeedback.successMsg, 'success')
    } catch {
      showNotification('Error', MESSAGES.rejectFeedback.errorMsg, 'error')
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
        //statusOptions={[]}
        statusColorMap={{}}
        onEmployeeClick={(row) => { setSelected(row); setDialog(true); }}
      />

      <FinalizeDialog
        open={dialogOpen}
        onClose={() => setDialog(false)}
        evaluation={selected?._evaluation ?? null}
        onApprove={handleApprove}
        onReject={handleReject}
      />

      <NotificationDialog
        open={notificationOpen}
        onOpenChange={setNotificationOpen}
        type={notificationType}
        title={notificationTitle}
        message={notificationMessage}
        onConfirm={load}
      />
    </>
  );
}
