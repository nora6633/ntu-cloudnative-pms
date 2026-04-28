import { useState } from "react";
import { Star, Eye, ChevronDown, ChevronUp } from "lucide-react";
import { Button } from "../components/ui/button";
import { Badge } from "../components/ui/badge";
import { ScrollArea } from "../components/ui/scroll-area";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle,
} from "../components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "../components/ui/tabs";
import type { EvalCycleState, EvalCycleTab, Goal, HistoryRecord } from "../types";
import {
  INITIAL_ANNUAL_HISTORY,
  INITIAL_QUARTER_HISTORY,
} from "../data";

// ── shared helpers ────────────────────────────────────────────────────────
const CRITERIA = [
  { name: "Business Impact", description: "Measurable contribution to business outcomes." },
  { name: "Delivery",        description: "Delivers high-quality work on time." },
  { name: "Quality",         description: "Work meets or exceeds standards." },
  { name: "Innovation",      description: "Brings creative solutions to problems." },
  { name: "Collaboration",   description: "Works effectively with others." },
];

function StarDisplay({ rating }: { rating: number }) {
  return (
    <div className="flex gap-1">
      {[1, 2, 3, 4, 5].map((star) => (
        <Star
          key={star}
          className={`w-4 h-4 ${star <= rating ? "fill-yellow-400 text-yellow-400" : "fill-none text-gray-300"}`}
        />
      ))}
    </div>
  );
}

function avgOf(ratings: Record<string, number>) {
  const vals = Object.values(ratings);
  return vals.length ? vals.reduce((a, b) => a + b, 0) / vals.length : 0;
}

// ── Progress history sub-dialog ───────────────────────────────────────────
function ProgressHistoryDialog({ goal, onClose }: { goal: Goal | null; onClose: () => void }) {
  return (
    <Dialog open={!!goal} onOpenChange={(o) => { if (!o) onClose(); }}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader><DialogTitle>{goal?.title}</DialogTitle></DialogHeader>
        <ScrollArea className="max-h-[55vh] pr-4">
          <div className="space-y-4 mt-4">
            {goal?.progressHistory?.map((entry, i) => (
              <div key={i} className="border-l-2 border-blue-200 pl-4 pb-4">
                <div className="flex items-center gap-2 mb-1">
                  <span className="text-sm text-gray-500">{entry.date}</span>
                  <Badge variant="outline" className="ml-auto">{entry.progress}%</Badge>
                </div>
                {entry.note && <p className="text-sm text-gray-700 mt-1">{entry.note}</p>}
              </div>
            ))}
          </div>
        </ScrollArea>
      </DialogContent>
    </Dialog>
  );
}

// ── Single record card (collapsed / expanded) ─────────────────────────────
function RecordCard({ record }: { record: HistoryRecord }) {
  const [expanded, setExpanded] = useState(false);
  const [activeTab, setActiveTab] = useState("ratings");
  const [progressGoal, setProgressGoal] = useState<Goal | null>(null);

  const avg = avgOf(record.ratings);

  return (
    <>
      <div className="border rounded-xl bg-white overflow-hidden">
        {/* Header row — always visible */}
        <button
          className="w-full flex items-center justify-between px-5 py-4 hover:bg-gray-50 transition-colors"
          onClick={() => setExpanded((v) => !v)}
        >
          <div className="flex items-center gap-4">
            <div className="text-left">
              <p className="font-semibold text-gray-900">{record.label}</p>
              <p className="text-xs text-gray-400 mt-0.5">Closed {record.closedDate}</p>
            </div>
            <StarDisplay rating={Math.round(avg)} />
            <span className="text-sm text-gray-500">{avg.toFixed(1)}</span>
          </div>
          <div className="flex items-center gap-3">
            <Badge variant="outline" className="text-xs">
              {record.goals.length} goal{record.goals.length !== 1 ? "s" : ""}
            </Badge>
            {expanded
              ? <ChevronUp className="w-4 h-4 text-gray-400" />
              : <ChevronDown className="w-4 h-4 text-gray-400" />}
          </div>
        </button>

        {/* Expanded detail */}
        {expanded && (
          <div className="border-t px-5 pb-5 pt-4">
            <Tabs value={activeTab} onValueChange={setActiveTab}>
              <TabsList className="grid w-full grid-cols-2">
                <TabsTrigger value="ratings">Ratings</TabsTrigger>
                <TabsTrigger value="goals">Goals & Progress</TabsTrigger>
              </TabsList>

              {/* Ratings */}
              <TabsContent value="ratings" className="space-y-3 mt-5">
                {CRITERIA.map((criterion) => {
                  const rating  = record.ratings[criterion.name]  ?? 0;
                  const comment = record.comments[criterion.name] ?? "";
                  return (
                    <div key={criterion.name} className="border rounded-lg p-4 bg-gray-50">
                      <div className="flex items-start justify-between mb-1">
                        <div className="flex-1">
                          <h4 className="font-semibold text-sm text-gray-900">{criterion.name}</h4>
                          <p className="text-xs text-gray-500 mt-0.5">{criterion.description}</p>
                        </div>
                        <div className="ml-4 shrink-0">
                          <StarDisplay rating={rating} />
                        </div>
                      </div>
                      {comment && (
                        <p className="text-sm text-gray-700 mt-2 pt-2 border-t leading-relaxed">{comment}</p>
                      )}
                    </div>
                  );
                })}
              </TabsContent>

              {/* Goals & Progress */}
              <TabsContent value="goals" className="space-y-3 mt-5">
                {record.goals.map((goal) => (
                  <div key={goal.id} className="border rounded-lg p-4 bg-gray-50">
                    <h4 className="font-semibold text-sm text-gray-900">{goal.title}</h4>
                    <p className="text-sm text-gray-600 mt-1">{goal.description}</p>
                    <div className="grid grid-cols-3 gap-3 mt-3 pt-3 border-t">
                      <div><div className="text-xs text-gray-400 mb-1">Metric</div><p className="text-sm font-medium">{goal.metric}</p></div>
                      <div><div className="text-xs text-gray-400 mb-1">Target</div><p className="text-sm font-medium">{goal.targetValue}</p></div>
                      <div><div className="text-xs text-gray-400 mb-1">Deadline</div><p className="text-sm font-medium">{goal.deadline}</p></div>
                    </div>
                    {goal.progressHistory && goal.progressHistory.length > 0 && (
                      <div className="mt-3 pt-3 border-t">
                        <div className="flex items-center gap-3 mb-3">
                          <div className="flex-1 bg-gray-200 rounded-full h-1.5">
                            <div
                              className="bg-blue-500 h-1.5 rounded-full"
                              style={{ width: `${goal.progressHistory[goal.progressHistory.length - 1].progress}%` }}
                            />
                          </div>
                          <span className="text-xs font-medium text-gray-600 w-8 text-right">
                            {goal.progressHistory[goal.progressHistory.length - 1].progress}%
                          </span>
                        </div>
                        <Button variant="outline" size="sm" onClick={() => setProgressGoal(goal)}>
                          <Eye className="w-4 h-4 mr-2" />View Progress History
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

      <ProgressHistoryDialog goal={progressGoal} onClose={() => setProgressGoal(null)} />
    </>
  );
}

// ── Tab panel (list of records) ───────────────────────────────────────────
function RecordList({ records }: { records: HistoryRecord[] }) {
  if (records.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-16 text-center text-gray-400">
        <p className="font-medium">No history yet.</p>
        <p className="text-sm mt-1">Records will appear here once an evaluation cycle is Closed.</p>
      </div>
    );
  }
  return (
    <div className="space-y-3">
      {records.map((record) => (
        <RecordCard key={record.id} record={record} />
      ))}
    </div>
  );
}

// ── main exported section ─────────────────────────────────────────────────
interface HistorySectionProps {
  cycleStates: Record<EvalCycleTab, EvalCycleState>;
}

export function HistorySection({ cycleStates }: HistorySectionProps) {
  // Build records for the current cycle states — only include if status === "Closed"
  const currentAnnual: HistoryRecord[] =
    cycleStates.Annual.status === "Closed"
      ? [{
          id: "annual-current",
          label: "2026 Annual",
          closedDate: new Date().toLocaleDateString(),
          goals: cycleStates.Annual.goals,
          ratings: cycleStates.Annual.ratings,
          comments: cycleStates.Annual.comments,
        }]
      : [];

  const currentQuarter: HistoryRecord[] =
    cycleStates.Quarter.status === "Closed"
      ? [{
          id: "quarter-current",
          label: "2026 Q1",
          closedDate: new Date().toLocaleDateString(),
          goals: cycleStates.Quarter.goals,
          ratings: cycleStates.Quarter.ratings,
          comments: cycleStates.Quarter.comments,
        }]
      : [];

  // Most-recent first: current cycle on top, then historical
  const annualRecords  = [...currentAnnual,  ...INITIAL_ANNUAL_HISTORY];
  const quarterRecords = [...currentQuarter, ...INITIAL_QUARTER_HISTORY];

  // Probation has no pre-seeded history — only show if closed
  const probationRecords: HistoryRecord[] =
    cycleStates.Probation.status === "Closed"
      ? [{
          id: "probation-current",
          label: "2026 Probation",
          closedDate: new Date().toLocaleDateString(),
          goals: cycleStates.Probation.goals,
          ratings: cycleStates.Probation.ratings,
          comments: cycleStates.Probation.comments,
        }]
      : [];

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

          <TabsContent value="Annual" className="mt-6">
            <RecordList records={annualRecords} />
          </TabsContent>

          <TabsContent value="Quarter" className="mt-6">
            <RecordList records={quarterRecords} />
          </TabsContent>

          <TabsContent value="Probation" className="mt-6">
            <RecordList records={probationRecords} />
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
