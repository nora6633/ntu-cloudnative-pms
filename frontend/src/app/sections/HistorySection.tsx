import { useState, useEffect, useCallback } from 'react';
import { Star, Eye, ChevronDown, ChevronUp } from 'lucide-react';
import { Badge } from '../components/ui/badge';
import { Button } from '../components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../components/ui/tabs';
import type { EvalCycleTab } from '../types';
import type { EvaluationDTO, GoalDTO } from '../../api';
import { getMyEvaluations } from '../../api';
import { ViewProgressDialog } from '../components/ViewProgressDialog';

// ── helpers ────────────────────────────────────────────────────────────────

function StarDisplay({ rating }: { rating: number }) {
  return (
    <div className="flex gap-1">
      {[1, 2, 3, 4, 5].map((s) => (
        <Star key={s} className={`w-4 h-4 ${s <= rating ? 'fill-yellow-400 text-yellow-400' : 'fill-none text-gray-300'}`} />
      ))}
    </div>
  );
}

function avgRating(evaluation: EvaluationDTO): number {
  const rated = (evaluation.evaluationItems ?? []).filter((it) => (it.rating ?? 0) > 0);
  return rated.length
    ? rated.reduce((s, it) => s + (it.rating ?? 0), 0) / rated.length
    : 0;
}

function cycleLabel(e: EvaluationDTO): string {
  const typeLabel = e.type === 'ANNUAL' ? 'Annual' : e.type === 'QUARTER' ? 'Quarter' : 'Probation';
  return `${e.cycle ?? ''} ${typeLabel}`.trim();
}


// ── Single record card ─────────────────────────────────────────────────────

function RecordCard({ evaluation }: { evaluation: EvaluationDTO }) {
  const [expanded, setExpanded]     = useState(false);
  const [activeTab, setActiveTab]   = useState('ratings');
  const [progressDialogOpen, setProgressDialogOpen] = useState(false);
  const [selectedGoal, setSelectedGoal] = useState<GoalDTO | null>(null);

  const avg   = avgRating(evaluation);
  const items = evaluation.evaluationItems ?? [];
  const goals = evaluation.goals ?? [];

  return (
    <>
      <div className="border rounded-xl bg-white overflow-hidden">
        <button
          className="w-full flex items-center justify-between px-5 py-4 hover:bg-gray-50 transition-colors"
          onClick={() => setExpanded((v) => !v)}
        >
          <div className="flex items-center gap-4">
            <div className="text-left">
              <p className="font-semibold text-gray-900">{cycleLabel(evaluation)}</p>
            </div>
            {avg > 0 && (
              <>
                <StarDisplay rating={Math.round(avg)} />
                <span className="text-sm text-gray-500">{avg.toFixed(1)}</span>
              </>
            )}
          </div>
          <div className="flex items-center gap-3">
            <Badge variant="outline" className="text-xs">
              {goals.length} goal{goals.length !== 1 ? 's' : ''}
            </Badge>
            {expanded ? <ChevronUp className="w-4 h-4 text-gray-400" /> : <ChevronDown className="w-4 h-4 text-gray-400" />}
          </div>
        </button>

        {expanded && (
          <div className="border-t px-5 pb-5 pt-4">
            <Tabs value={activeTab} onValueChange={setActiveTab}>
              <TabsList className="grid w-full grid-cols-2">
                <TabsTrigger value="ratings">Ratings</TabsTrigger>
                <TabsTrigger value="goals">Goals & Progress</TabsTrigger>
              </TabsList>

              <TabsContent value="ratings" className="space-y-3 mt-5">
                {items.length === 0 ? (
                  <p className="text-sm text-gray-500">No ratings recorded.</p>
                ) : (
                  items.map((item) => (
                    <div key={item.id} className="border rounded-lg p-4 bg-gray-50">
                      <div className="flex items-start justify-between mb-1">
                        <div className="flex-1">
                          <h4 className="font-semibold text-sm text-gray-900">{item.name}</h4>
                          <p className="text-xs text-gray-500 mt-0.5">{item.description}</p>
                        </div>
                        <div className="ml-4 shrink-0">
                          <StarDisplay rating={item.rating ?? 0} />
                        </div>
                      </div>
                      {item.feedback && (
                        <p className="text-sm text-gray-700 mt-2 pt-2 border-t leading-relaxed">
                          {item.feedback}
                        </p>
                      )}
                    </div>
                  ))
                )}
              </TabsContent>

              <TabsContent value="goals" className="space-y-3 mt-5">
                {goals.map((goal) => (
                  <div key={goal.id ?? goal.definition} className="border rounded-lg p-4 bg-gray-50">
                    <h4 className="font-semibold text-sm text-gray-900">{goal.definition}</h4>
                    <p className="text-sm text-gray-600 mt-1">{goal.relevance}</p>
                    <div className="grid grid-cols-3 gap-3 mt-3 pt-3 border-t">
                      <div><div className="text-xs text-gray-400 mb-1">Metric</div><p className="text-sm font-medium">{goal.metric}</p></div>
                      <div><div className="text-xs text-gray-400 mb-1">Resources</div><p className="text-sm font-medium">{goal.resource}</p></div>
                      <div><div className="text-xs text-gray-400 mb-1">Deadline</div><p className="text-sm font-medium">{goal.deadline ?? '—'}</p></div>
                    </div>
                    {goal.progresses && goal.progresses.length > 0 && (
                        <div className="mt-3 flex justify-end mb-3">
                          <Button
                            variant="outline"
                            size="sm"
                            className="gap-2"
                            onClick={() => {
                              setSelectedGoal(goal);
                              setProgressDialogOpen(true);
                            }}
                          >
                            <Eye className="w-4 h-4" />
                            View Progress
                          </Button>
                        </div>
                      )}
                  </div>
                ))}
              </TabsContent>
            </Tabs>
          </div>
        )}
      </div>
      <ViewProgressDialog open={progressDialogOpen} onClose={() => setProgressDialogOpen(false)} goal={selectedGoal} />
    </>
  );
}

// ── Record list ────────────────────────────────────────────────────────────

function RecordList({ records }: { records: EvaluationDTO[] }) {
  if (records.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-16 text-center text-gray-400">
        <p className="font-medium">No history yet.</p>
        <p className="text-sm mt-1">Records will appear here once an evaluation cycle is closed.</p>
      </div>
    );
  }
  return (
    <div className="space-y-3">
      {records.map((e) => <RecordCard key={e.id} evaluation={e} />)}
    </div>
  );
}

// ── Exported section ───────────────────────────────────────────────────────

export function HistorySection() {
  const [evaluations, setEvaluations] = useState<EvaluationDTO[]>([]);
  const [loading, setLoading]         = useState(true);
  const [error, setError]             = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await getMyEvaluations({ pageable: { page: 0, size: 100 } });
      const closed = (res.data.content ?? []).filter((e) => e.status === 'CLOSED');
      setEvaluations(closed);
    } catch {
      setError('Failed to load history.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  if (loading) return <div className="flex items-center justify-center min-h-screen"><p className="text-gray-500">Loading…</p></div>;
  if (error)   return <div className="flex items-center justify-center min-h-screen"><p className="text-red-500">{error}</p></div>;

  const byType = (tab: EvalCycleTab) => {
    const dtoType = tab === 'Annual' ? 'ANNUAL' : tab === 'Quarter' ? 'QUARTER' : 'PROBATION';
    return evaluations.filter((e) => e.type === dtoType);
  };

  return (
    <div className="p-8">
      <div className="max-w-3xl mx-auto">
        <div className="mb-8">
          <h2 className="text-2xl font-bold text-gray-900">History</h2>
          <p className="text-gray-600 mt-1">Your past evaluation records — ratings, goals, and progress</p>
        </div>

        <Tabs defaultValue="Annual">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="Annual">Annual</TabsTrigger>
            <TabsTrigger value="Quarter">Quarter</TabsTrigger>
            <TabsTrigger value="Probation">Probation</TabsTrigger>
          </TabsList>

          {(['Annual', 'Quarter', 'Probation'] as EvalCycleTab[]).map((tab) => (
            <TabsContent key={tab} value={tab} className="mt-6">
              <RecordList records={byType(tab)} />
            </TabsContent>
          ))}
        </Tabs>
      </div>
    </div>
  );
}
