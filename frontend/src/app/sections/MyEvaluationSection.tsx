import { useState, useEffect, useCallback } from 'react';
import { ListTodo, Plus, Target, Trophy, Star } from 'lucide-react';
import { Button } from '../components/ui/button';
import { GoalCard } from '../components/GoalCard';
import { UpdateProgressDialog } from '../components/UpdateProgressDialog';
import { GoalDetailsDialog } from '../components/GoalDetailsDialog';
import { EvaluationGoalCard } from '../components/EvaluationGoalCard';
import { EvaluationCriteriaDialog } from '../components/EvaluationCriteriaDialog';
import { EvaluationGoalDialog } from '../components/EvaluationGoalDialog';
import { NotificationDialog } from '../components/NotificationDialog';
import type { EvalCycleTab, MyEvalStatus } from '../types';
import type { EvaluationDTO, GoalDTO } from '../../api';
import {
  getMyEvaluations,
  draftGoals,
  submitForGoalApproval,
  submitForProgressReview,
  approveReview,
  rejectReview,
  addProgress,
} from '../../api';

// ── helpers ───────────────────────────────────────────────────────────────

const MESSAGES = {
  draftGoals: {
    successTitle: 'Success',
    successMsg: 'Goals saved as draft.',
    errorMsg: 'Failed to save draft. Please try again.',
  },
  submitGoals: {
    successTitle: 'Submitted',
    successMsg: 'Your goals have been submitted for approval.',
    errorMsg: 'Failed to submit goals. Please try again.',
  },
  submitReview: {
    successTitle: 'Submitted for Review',
    successMsg: 'Your evaluation has been submitted for manager review.',
    errorMsg: 'Failed to submit for review. Please try again.',
  },
  confirmReview: {
    successTitle: 'Confirmed',
    successMsg: 'You have confirmed the review.',
    errorMsg: 'Failed to confirm review. Please try again.',
  },
  rejectReview: {
    successTitle: 'Revision Requested',
    successMsg: 'You have requested a revision. Your manager will be notified.',
    errorMsg: 'Failed to request revision. Please try again.',
  },
  addProgress: {
    successTitle: 'Added',
    successMsg: 'Progress is added.',
    errorMsg: 'Failed to add progress. Please try again.',
  },
};

const TYPE_MAP: Record<EvalCycleTab, string> = {
  Annual: 'ANNUAL',
  Quarter: 'QUARTER',
  Probation: 'PROBATION',
};

function mapStatus(dto: EvaluationDTO): MyEvalStatus {
  switch (dto.status) {
    case 'INITIAL':                    return 'Initial';
    case 'PENDING_GOAL_APPROVAL':      return 'Pending_goal_approval';
    case 'WORKING':                    return 'Working';
    case 'REVIEW':                     return 'Review';
    case 'PENDING_REVIEW_CONFIRMATION': return 'Confirming';
    case 'PENDING_CLOSURE':            return 'Pending_Closure';
    case 'CLOSED':                     return 'Closed';
    default:                           return 'Initial';
  }
}

const STATUS_LABELS: Record<MyEvalStatus, string> = {
  Initial:               'Initial',
  Pending_goal_approval: 'Pending Goal Approval',
  Working:               'Working',
  Review:                'Awaiting Review',
  Confirming:            'Confirming',
  Pending_Closure:       'Pending Closure',
  Closed:                'Closed',
};

const STATUS_COLORS: Record<MyEvalStatus, string> = {
  Initial:               'text-gray-500',
  Pending_goal_approval: 'text-yellow-600',
  Working:               'text-blue-600',
  Review:                'text-purple-600',
  Confirming:            'text-orange-500',
  Pending_Closure:       'text-orange-600',
  Closed:                'text-green-600',
};

function StarDisplay({ rating }: { rating: number }) {
  return (
    <div className="flex gap-1">
      {[1, 2, 3, 4, 5].map((s) => (
        <Star key={s} className={`w-5 h-5 ${s <= rating ? 'fill-yellow-400 text-yellow-400' : 'fill-none text-gray-300'}`} />
      ))}
    </div>
  );
}

// ── per-cycle inner view ──────────────────────────────────────────────────

interface CycleViewProps {
  evaluation: EvaluationDTO | null;
  onRefresh: () => void;
}

function CycleView({ evaluation, onRefresh }: CycleViewProps) {
  const [criteriaOpen,    setCriteriaOpen]    = useState(false);
  const [goalDialogOpen,  setGoalDialogOpen]  = useState(false);
  const [goalDialogMode,  setGoalDialogMode]  = useState<'create' | 'edit'>('create');
  const [editingGoal,     setEditingGoal]     = useState<GoalDTO | null>(null);
  const [progressOpen,    setProgressOpen]    = useState(false);
  const [detailsOpen,     setDetailsOpen]     = useState(false);
  const [activeGoal,      setActiveGoal]      = useState<GoalDTO | null>(null);
  const [draftList,       setDraftList]       = useState<GoalDTO[]>([]);
  const [draftingGoals,   setDraftingGoals]   = useState(false);
  const [submitting,      setSubmitting]      = useState(false);
  const [addingProgress,  setAddingProgress]  = useState(false);
  const [rejectReviewing, setRejectReviewing] = useState(false);

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

  const handleAsync = async <T,>(
    apiCall: () => Promise<T>,
    messages: typeof MESSAGES.draftGoals,
    setLoading?: (loading: boolean) => void,
  ) => {
    setLoading?.(true);
    try {
      await apiCall();
      showNotification(messages.successTitle, messages.successMsg, 'success');
    } catch {
      showNotification('Error', messages.errorMsg, 'error');
    } finally {
      setLoading?.(false);
    }
  };

  useEffect(() => {
    setDraftList(evaluation?.goals ?? []);
  }, [evaluation?.goals, evaluation?.id, evaluation?.status]);

  if (!evaluation) {
    return (
      <div className="flex flex-col items-center justify-center py-24 text-center text-gray-400">
        <Target className="w-12 h-12 mb-4 opacity-30" />
        <p className="font-medium">No active evaluation for this cycle.</p>
        <p className="text-sm mt-1">Your HR team will create one when the cycle starts.</p>
      </div>
    );
  }

  const evalId = evaluation.id!;
  const status = mapStatus(evaluation);
  const items  = evaluation.evaluationItems ?? [];

  const rated    = items.filter((it) => (it.rating ?? 0) > 0);
  const avgRating = rated.length ? rated.reduce((s, it) => s + (it.rating ?? 0), 0) / rated.length : 0;

  // ── Initial phase handlers ──────────────────────────────────────────────

  const handleCreateGoal = (partial: Omit<GoalDTO, 'id' | 'progresses'>) => {
    setDraftList((prev) => [...prev, { ...partial, progresses: [] }]);
  };

  const handleUpdateGoal = (partial: Omit<GoalDTO, 'id' | 'progresses'>) => {
    if (!editingGoal) return;
    setDraftList((prev) =>
      prev.map((g) => g === editingGoal ? { ...g, ...partial } : g),
    );
    setEditingGoal(null);
  };

  const handleDeleteGoal = (goal: GoalDTO) =>
    setDraftList((prev) => prev.filter((g) => g !== goal));

  const openEditGoal = (goal: GoalDTO) => {
    setEditingGoal(goal);
    setGoalDialogMode('edit');
    setGoalDialogOpen(true);
  };

  const handleDraftGoals = () => {
    handleAsync(() => draftGoals(evalId, draftList), MESSAGES.draftGoals, setDraftingGoals);
  };

  const handleInitSubmit = () => {
    setDraftingGoals(true);
    draftGoals(evalId, draftList)
      .then(() => {
        setSubmitting(true);
        submitForGoalApproval(evalId);
        showNotification(MESSAGES.submitGoals.successTitle, MESSAGES.submitGoals.successMsg, 'success');
      })
      .catch(() => {
        showNotification('Error', MESSAGES.submitGoals.errorMsg, 'error');
      })
      .finally(() => {
        setDraftingGoals(false);
        setSubmitting(false);
      });
  };
  
  // ── Working phase handlers ──────────────────────────────────────────────

  const openAddProgress = (goal: GoalDTO) => {
    setActiveGoal(goal);
    setProgressOpen(true);
  };

  const openDetails = (goal: GoalDTO) => {
    setActiveGoal(goal);
    setDetailsOpen(true);
  };

  const handleAddProgress = async (description: string) => {
    if (!activeGoal || activeGoal.id == null) return;
    const now = new Date().toISOString();
    const updated = draftList.map((g) =>
      g === activeGoal
        ? { ...g, progresses: [...(g.progresses ?? []), { description, timestamp: now }] }
        : g,
    );
    setDraftList(updated);
    await handleAsync(
      () => addProgress(activeGoal.id!, { description }),
      MESSAGES.addProgress,
      setAddingProgress,
    );
  };

  const handleWorkingSubmit = () => {
    handleAsync(() => submitForProgressReview(evalId), MESSAGES.submitReview, setSubmitting);
  };

  // ── Confirming phase handlers ───────────────────────────────────────────

  const handleConfirm = () => {
    handleAsync(() => approveReview(evalId), MESSAGES.confirmReview, setSubmitting);
  };

  const handleRejectReview = () => {
    handleAsync(() => rejectReview(evalId), MESSAGES.rejectReview, setRejectReviewing);
  };

  // ── stats ───────────────────────────────────────────────────────────────
  const activeGoals    = draftList.filter((g) => (g.progresses ?? []).length < 1 ||
    (g.progresses ?? []).length > 0);  // all with no "completed" concept
  const completedCount = 0; // backend has no completion flag
  const stats = { total: draftList.length, completed: completedCount };

  return (
    <>
      {/* Header */}
      <div className="bg-white border-b">
        <div className="max-w-7xl mx-auto px-6 py-8">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">My Evaluation</h1>
              <p className={`mt-1 font-medium ${STATUS_COLORS[status]}`}>
                Status: {STATUS_LABELS[status]}
              </p>
            </div>
            <div className="flex items-center gap-3">
              <Button variant="outline" size="icon" onClick={() => setCriteriaOpen(true)}>
                <ListTodo className="w-5 h-5" />
              </Button>
              {status === 'Initial' && (
                <div className="flex gap-2">
                  <Button variant="outline" size="lg" onClick={handleDraftGoals} disabled={submitting}>
                    {draftingGoals ? 'Saving…' : 'Draft Goals'}
                  </Button>
                  <Button size="lg" onClick={handleInitSubmit} disabled={submitting}>
                    {submitting ? 'Submitting…' : 'Submit'}
                  </Button>
                </div>
              )}
              {status === 'Working' && (
                <Button size="lg" onClick={handleWorkingSubmit} disabled={submitting}>
                  {submitting ? 'Submitting…' : 'Submit for Review'}
                </Button>
              )}
            </div>
          </div>

          {status === 'Working' && (
            <div className="grid grid-cols-2 gap-4 mt-8">
              <div className="bg-blue-50 rounded-lg p-4">
                <div className="flex items-center gap-2 text-blue-600 mb-1">
                  <Target className="w-5 h-5" /><span className="text-sm font-medium">Total Goals</span>
                </div>
                <p className="text-3xl font-bold text-blue-900">{stats.total}</p>
              </div>
              <div className="bg-green-50 rounded-lg p-4">
                <div className="flex items-center gap-2 text-green-600 mb-1">
                  <Trophy className="w-5 h-5" /><span className="text-sm font-medium">Progress Updates</span>
                </div>
                <p className="text-3xl font-bold text-green-900">
                  {draftList.reduce((n, g) => n + (g.progresses?.length ?? 0), 0)}
                </p>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Body */}
      <div className="max-w-7xl mx-auto px-6 py-8">

        {/* Initial — goal setting */}
        {status === 'Initial' && (
          <div className="space-y-4">
            {draftList.map((goal) => (
              <EvaluationGoalCard
                key={goal.id ?? goal.definition}
                status={status}
                goal={goal}
                onUpdate={openEditGoal}
                onDelete={handleDeleteGoal}
              />
            ))}
            <div className="flex justify-center pt-4">
              <Button
                variant="outline"
                size="lg"
                className="w-full max-w-md"
                onClick={() => { setEditingGoal(null); setGoalDialogMode('create'); setGoalDialogOpen(true); }}
              >
                <Plus className="w-5 h-5 mr-2" />New Goal
              </Button>
            </div>
          </div>
        )}

        {/* Pending approval — read-only */}
        {status === 'Pending_goal_approval' && (
          <div className="space-y-4">
            <p className="text-sm text-yellow-700 bg-yellow-50 border border-yellow-200 rounded-lg px-4 py-3">
              Your goals have been submitted and are awaiting approval.
            </p>
            {draftList.map((goal) => (
              <EvaluationGoalCard
                key={goal.id ?? goal.definition}
                status={status}
                goal={goal}
                onUpdate={() => {}}
                onDelete={() => {}}
              />
            ))}
          </div>
        )}

        {/* Working — progress tracking */}
        {status === 'Working' && (
          <div>
            {activeGoals.length === 0
                ? <div className="text-center py-12 text-gray-500">No goals yet.</div>
                : <div className="grid gap-4">
                    {activeGoals.map((g) => (
                      <GoalCard key={g.id ?? g.definition} status= {status} goal={g} onAddProgress={openAddProgress} onViewDetails={openDetails} />
                    ))}
                  </div>}
          </div>
        )}

        {/* Review — waiting for manager */}
        {status === 'Review' && (
          <div className="space-y-4">
            <p className="text-sm text-purple-700 bg-purple-100 border border-purple-200 rounded-lg px-4 py-3">
              Your manager is reviewing your goals and progress.
            </p>
            {draftList.length === 0
                ? <div className="text-center py-12 text-gray-500">No goals yet.</div>
                : <div className="grid gap-4">
                    {draftList.map((g) => (
                      <GoalCard key={g.id ?? g.definition} status= {status} goal={g} onAddProgress={() => {}} onViewDetails={openDetails} />
                    ))}
                  </div>}
          </div>
        )}

        {/* Confirming — review received, employee confirms or rejects */}
        {status === 'Confirming' && (
          <div className="space-y-4">
            <div className="flex items-center gap-3 mb-2">
              <StarDisplay rating={Math.round(avgRating)} />
              <span className="text-gray-600 text-sm">{avgRating.toFixed(1)} overall rating from your manager</span>
            </div>
            {items.map((item) => (
              <div key={item.id} className="border rounded-lg p-4 bg-gray-50">
                <div className="flex items-start justify-between mb-2">
                  <div className="flex-1">
                    <h4 className="font-semibold text-gray-900">{item.name}</h4>
                    <p className="text-sm text-gray-500 mt-0.5">{item.description}</p>
                  </div>
                  <div className="ml-4 shrink-0"><StarDisplay rating={item.rating ?? 0} /></div>
                </div>
                {item.feedback && (
                  <p className="text-sm text-gray-700 mt-3 pt-3 border-t leading-relaxed">{item.feedback}</p>
                )}
              </div>
            ))}
            <div className="flex justify-end gap-3 pt-4 border-t">
              <Button variant="outline" onClick={handleRejectReview} disabled={submitting || rejectReviewing}>
                {rejectReviewing ? 'Requesting…' : 'Request Revision'}
              </Button>
              <Button size="lg" onClick={handleConfirm} disabled={submitting || rejectReviewing}>
                {submitting ? 'Confirming…' : 'Confirm'}
              </Button>
            </div>
          </div>
        )}

        {/* Pending Closure / Closed — read-only */}
        {(status === 'Pending_Closure') && (
          <div className="space-y-4">
            <div className="flex items-center gap-3">
              <StarDisplay rating={Math.round(avgRating)} />
              <span className="text-gray-600 text-sm">{avgRating.toFixed(1)} overall</span>
            </div>
            {items.map((item) => (
              <div key={item.id} className="border rounded-lg p-4 bg-gray-50">
                <div className="flex items-start justify-between mb-2">
                  <div className="flex-1">
                    <h4 className="font-semibold text-gray-900">{item.name}</h4>
                    <p className="text-sm text-gray-500 mt-0.5">{item.description}</p>
                  </div>
                  <div className="ml-4 shrink-0"><StarDisplay rating={item.rating ?? 0} /></div>
                </div>
                {item.feedback && (
                  <p className="text-sm text-gray-700 mt-3 pt-3 border-t leading-relaxed">{item.feedback}</p>
                )}
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Dialogs */}
      <EvaluationCriteriaDialog
        open={criteriaOpen}
        onClose={() => setCriteriaOpen(false)}
        jobTitle={evaluation.employeeJobTitle ?? ''}
        items={items}
      />
      <EvaluationGoalDialog
        open={goalDialogOpen}
        onClose={() => setGoalDialogOpen(false)}
        onSave={goalDialogMode === 'create' ? handleCreateGoal : handleUpdateGoal}
        existingGoal={editingGoal}
        criteria={items}
        mode={goalDialogMode}
      />
      <UpdateProgressDialog
        open={progressOpen}
        onClose={() => setProgressOpen(false)}
        onAddProgress={handleAddProgress}
        loading={addingProgress}
      />
      <GoalDetailsDialog
        open={detailsOpen}
        onClose={() => setDetailsOpen(false)}
        goal={activeGoal}
      />
      <NotificationDialog
        open={notificationOpen}
        onOpenChange={setNotificationOpen}
        type={notificationType}
        title={notificationTitle}
        message={notificationMessage}
        onConfirm={onRefresh}
      />
    </>
  );
}

// ── exported section ──────────────────────────────────────────────────────

export function MyEvaluationSection() {
  const [evaluations, setEvaluations] = useState<EvaluationDTO[]>([]);
  const [loading, setLoading]         = useState(true);
  const [error, setError]             = useState<string | null>(null);
  const [activeTab, setActiveTab]     = useState<EvalCycleTab>('Annual');

  const fetch = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await getMyEvaluations({ pageable: { page: 0, size: 50 } });
      setEvaluations(res.data.content ?? []);
    } catch {
      setError('Failed to load evaluations. Please try again.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetch(); }, [fetch]);

  const currentEval = evaluations.find((e) => e.type === TYPE_MAP[activeTab] && e.status !== 'CLOSED') ?? null;

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <p className="text-gray-500">Loading…</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <p className="text-red-500">{error}</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="bg-white border-b px-6 pt-4">
        <div className="max-w-7xl mx-auto">
          <div className="flex gap-1">
            {(['Annual', 'Quarter', 'Probation'] as EvalCycleTab[]).map((tab) => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                className={`px-6 py-2.5 text-sm font-medium rounded-t-lg border-b-2 transition-colors ${
                  activeTab === tab
                    ? 'border-blue-600 text-blue-600 bg-blue-50'
                    : 'border-transparent text-gray-600 hover:text-gray-900'
                }`}
              >
                {tab}
              </button>
            ))}
          </div>
        </div>
      </div>

      <CycleView key={activeTab} evaluation={currentEval} onRefresh={fetch} />
    </div>
  );
}
