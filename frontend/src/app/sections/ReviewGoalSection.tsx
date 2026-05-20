import { useState, useEffect, useCallback } from 'react';
import { EmployeeTable } from '../components/EmployeeTable';
import { ReviewDialog } from '../components/ReviewDialog';
import type { BaseEmployee } from '../components/EmployeeTable';
import { NotificationDialog } from '../components/NotificationDialog';
import type { EvaluationDTO } from '../../api';
import { getEvaluationsForManager, approveGoals, rejectGoals } from '../../api';

const MESSAGES = {
  rejectGoals:{
    successTitle: 'Rejected goals',
    successMsg: 'You have rejected the goals',
    errorMsg: 'Failed to reject the goals. Please try again.',
  },
  approveGoals:{
    successTitle: 'Approved goals',
    successMsg: 'You have approved the goals',
    errorMsg: 'Failed to approve the goals. Please try again.',
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
    try{
      await approveGoals(id);
      showNotification(MESSAGES.approveGoals.successTitle, MESSAGES.approveGoals.successMsg, 'success')
    }catch{
      showNotification('Error', MESSAGES.approveGoals.errorMsg, 'error')
    }
  };

  const handleReject = async (id: number) => {
    try{
      await rejectGoals(id);
      showNotification(MESSAGES.rejectGoals.successTitle, MESSAGES.rejectGoals.successMsg, 'success')
    }catch{
      showNotification('Error', MESSAGES.rejectGoals.errorMsg, 'error')
    }
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
        //statusOptions={[]}
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
