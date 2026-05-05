import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from './ui/dialog';
import { Button } from './ui/button';
import { ScrollArea } from './ui/scroll-area';
import { Badge } from './ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from './ui/avatar';
import { Tabs, TabsContent, TabsList, TabsTrigger } from './ui/tabs';
import { Star, Target, Calendar } from 'lucide-react';
import type { EvaluationDTO } from '../../api';

function getInitials(name: string) {
  return name.split(' ').map((n) => n[0]).join('').toUpperCase();
}

function StarDisplay({ rating }: { rating: number }) {
  return (
    <div className="flex gap-1">
      {[1, 2, 3, 4, 5].map((star) => (
        <Star key={star} className={`w-5 h-5 ${star <= rating ? 'fill-yellow-400 text-yellow-400' : 'fill-none text-gray-300'}`} />
      ))}
    </div>
  );
}

function statusLabel(status: string | undefined) {
  return (status ?? 'INITIAL').replace(/_/g, ' ');
}

interface ViewAllDialogProps {
  open: boolean;
  onClose: () => void;
  evaluation: EvaluationDTO | null;
}

export function ViewAllDialog({ open, onClose, evaluation }: ViewAllDialogProps) {
  const [activeTab, setActiveTab] = useState('ratings');

  useEffect(() => { setActiveTab('ratings'); }, [evaluation?.id]);

  if (!evaluation) return null;

  const name = evaluation.employeeName ?? '—';
  const status = evaluation.status;
  const goals = evaluation.goals ?? [];
  const items = evaluation.evaluationItems ?? [];
  const rated = items.filter((it) => (it.rating ?? 0) > 0);
  const avgRating = rated.length ? rated.reduce((s, it) => s + (it.rating ?? 0), 0) / rated.length : 0;

  const showEmpty    = status === 'INITIAL';
  const showGoals    = status === 'PENDING_GOAL_APPROVAL' || status === 'WORKING';
  const showProgress = status === 'REVIEW';
  const showFull     = status === 'PENDING_REVIEW_CONFIRMATION' || status === 'PENDING_CLOSURE' || status === 'CLOSED';

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[800px] max-h-[90vh]">
        <DialogHeader>
          <div className="flex items-center gap-4">
            <Avatar className="h-16 w-16">
              <AvatarImage src="" alt={name} />
              <AvatarFallback>{getInitials(name)}</AvatarFallback>
            </Avatar>
            <div className="flex-1">
              <DialogTitle className="text-xl">{name}</DialogTitle>
              <p className="text-sm text-gray-600 mt-0.5">{evaluation.employeeJobTitle}</p>
              <Badge className="mt-2 text-xs">{statusLabel(status)}</Badge>
            </div>
          </div>
        </DialogHeader>

        <ScrollArea className="max-h-[60vh] pr-4">
          {showEmpty && (
            <div className="flex flex-col items-center justify-center py-16 text-center">
              <div className="w-16 h-16 rounded-full bg-gray-100 flex items-center justify-center mb-4">
                <Target className="w-8 h-8 text-gray-400" />
              </div>
              <p className="text-gray-500 font-medium">No data yet</p>
              <p className="text-sm text-gray-400 mt-1">This employee has not started their evaluation.</p>
            </div>
          )}

          {(showGoals || showProgress) && (
            <div className="space-y-4 mt-4">
              <h3 className="font-semibold text-lg">
                {showGoals ? 'Submitted Goals' : 'Goals & Progress'}
              </h3>
              {goals.map((goal, i) => (
                <div key={goal.id ?? i} className="border rounded-lg p-4 bg-gray-50">
                  <div className="flex items-start gap-3 mb-3">
                    <div className="p-2 bg-blue-50 rounded-lg shrink-0">
                      <Target className="w-4 h-4 text-blue-600" />
                    </div>
                    <div className="flex-1">
                      <h4 className="font-semibold text-gray-900">{goal.definition}</h4>
                      <p className="text-sm text-gray-600 mt-1">{goal.relevance}</p>
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-4 mt-3 pt-3 border-t">
                    <div>
                      <div className="text-xs text-gray-500 mb-1">Metric</div>
                      <p className="text-sm font-medium">{goal.metric}</p>
                    </div>
                    <div>
                      <div className="flex items-center gap-1 text-xs text-gray-500 mb-1">
                        <Calendar className="w-3 h-3" />Deadline
                      </div>
                      <p className="text-sm font-medium">{goal.deadline ?? '—'}</p>
                    </div>
                  </div>
                  {goal.criteria && goal.criteria.length > 0 && (
                    <div className="mt-3 flex flex-wrap gap-1.5">
                      {goal.criteria.map((c) => (
                        <Badge key={c} variant="outline" className="text-xs">{c}</Badge>
                      ))}
                    </div>
                  )}
                  {showProgress && goal.progresses && goal.progresses.length > 0 && (
                    <div className="mt-3 pt-3 border-t space-y-2">
                      <p className="text-xs text-gray-500 font-medium">Progress log</p>
                      {goal.progresses.map((p, pi) => (
                        <div key={pi} className="border-l-2 border-blue-200 pl-3">
                          <p className="text-xs text-gray-400">{p.timestamp ?? ''}</p>
                          <p className="text-sm text-gray-700">{p.description}</p>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}

          {showFull && (
            <>
              {avgRating > 0 && (
                <div className="flex items-center gap-2 mt-1 mb-4">
                  <StarDisplay rating={Math.round(avgRating)} />
                  <span className="text-sm text-gray-500">{avgRating.toFixed(1)} overall</span>
                </div>
              )}
              <Tabs value={activeTab} onValueChange={setActiveTab}>
                <TabsList className="grid w-full grid-cols-2">
                  <TabsTrigger value="ratings">Ratings</TabsTrigger>
                  <TabsTrigger value="goals">Goals & Progress</TabsTrigger>
                </TabsList>

                <TabsContent value="ratings" className="space-y-4 mt-6">
                  {items.map((item) => (
                    <div key={item.id} className="border rounded-lg p-4 bg-gray-50">
                      <div className="flex items-start justify-between mb-2">
                        <div className="flex-1">
                          <h4 className="font-semibold text-gray-900">{item.name}</h4>
                          <p className="text-sm text-gray-500 mt-0.5">{item.description}</p>
                        </div>
                        <div className="ml-4 shrink-0">
                          <StarDisplay rating={item.rating ?? 0} />
                        </div>
                      </div>
                      {item.feedback && (
                        <p className="text-sm text-gray-700 mt-3 pt-3 border-t leading-relaxed">{item.feedback}</p>
                      )}
                    </div>
                  ))}
                </TabsContent>

                <TabsContent value="goals" className="space-y-4 mt-6">
                  {goals.map((goal, i) => (
                    <div key={goal.id ?? i} className="border rounded-lg p-4 bg-gray-50">
                      <h4 className="font-semibold text-gray-900">{goal.definition}</h4>
                      <p className="text-sm text-gray-600 mt-1">{goal.relevance}</p>
                      <div className="grid grid-cols-2 gap-4 mt-3 pt-3 border-t">
                        <div>
                          <div className="text-xs text-gray-500 mb-1">Metric</div>
                          <p className="text-sm font-medium">{goal.metric}</p>
                        </div>
                        <div>
                          <div className="flex items-center gap-1 text-xs text-gray-500 mb-1">
                            <Calendar className="w-3 h-3" />Deadline
                          </div>
                          <p className="text-sm font-medium">{goal.deadline ?? '—'}</p>
                        </div>
                      </div>
                      {goal.progresses && goal.progresses.length > 0 && (
                        <div className="mt-3 pt-3 border-t space-y-2">
                          <p className="text-xs text-gray-500 font-medium">Progress log</p>
                          {goal.progresses.map((p, pi) => (
                            <div key={pi} className="border-l-2 border-blue-200 pl-3">
                              <p className="text-xs text-gray-400">{p.timestamp ?? ''}</p>
                              <p className="text-sm text-gray-700">{p.description}</p>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  ))}
                </TabsContent>
              </Tabs>
            </>
          )}
        </ScrollArea>

        <div className="flex justify-end pt-4 border-t">
          <Button variant="outline" onClick={onClose}>Close</Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
