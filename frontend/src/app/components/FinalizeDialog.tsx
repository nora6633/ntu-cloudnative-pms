import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from './ui/dialog';
import { Button } from './ui/button';
import { ScrollArea } from './ui/scroll-area';
import { Avatar, AvatarFallback, AvatarImage } from './ui/avatar';
import { Tabs, TabsContent, TabsList, TabsTrigger } from './ui/tabs';
import { Star, Calendar, Eye } from 'lucide-react';
import { Badge } from './ui/badge';
import type { EvaluationDTO, GoalDTO } from '../../api';
import { ViewProgressDialog } from './ViewProgressDialog';

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

interface FinalizeDialogProps {
  open: boolean;
  onClose: () => void;
  evaluation: EvaluationDTO | null;
  onApprove: (id: number) => void;
  onReject: (id: number) => void;
}

export function FinalizeDialog({ open, onClose, evaluation, onApprove, onReject }: FinalizeDialogProps) {
  const [activeTab, setActiveTab] = useState('ratings');
  const [selectedGoal, setSelectedGoal] = useState<GoalDTO | null>(null);
  const [progressDialogOpen, setProgressDialogOpen] = useState(false);

  useEffect(() => { setActiveTab('ratings'); }, [evaluation?.id]);

  if (!evaluation || evaluation.id == null) return null;

  const name = evaluation.employeeName ?? '—';
  const items = evaluation.evaluationItems ?? [];
  const goals = evaluation.goals ?? [];
  const rated = items.filter((it) => (it.rating ?? 0) > 0);
  const avgRating = rated.length ? rated.reduce((s, it) => s + (it.rating ?? 0), 0) / rated.length : 0;

  const handleApprove = () => { onApprove(evaluation.id!); onClose(); };
  const handleReject  = () => { onReject(evaluation.id!);  onClose(); };

  return (
    <>
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
              {avgRating > 0 && (
                <div className="flex items-center gap-2 mt-2">
                  <StarDisplay rating={Math.round(avgRating)} />
                  <span className="text-sm text-gray-500">{avgRating.toFixed(1)} overall</span>
                </div>
              )}
            </div>
          </div>
        </DialogHeader>

        <ScrollArea className="max-h-[55vh] pr-4">
          <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="ratings">Ratings</TabsTrigger>
              <TabsTrigger value="goals">Goals & Progress</TabsTrigger>
            </TabsList>

            <TabsContent value="ratings" className="space-y-4 mt-6">
              {items.length === 0 ? (
                <p className="text-sm text-gray-500 text-center py-4">No ratings available.</p>
              ) : (
                items.map((item) => (
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
                ))
              )}
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
                  {goal.criteria && goal.criteria.length > 0 && (
                    <div className="mt-3 flex flex-wrap gap-1.5">
                      {goal.criteria.map((c) => (
                        <Badge key={c} variant="outline" className="text-xs">{c}</Badge>
                      ))}
                    </div>
                  )}
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
        </ScrollArea>

        <div className="flex justify-end gap-3 pt-4 border-t">
          <Button variant="outline" onClick={onClose}>Cancel</Button>
          <Button variant="destructive" onClick={handleReject}>Reject</Button>
          <Button onClick={handleApprove}>Approve</Button>
        </div>
      </DialogContent>
    </Dialog>
    <ViewProgressDialog open={progressDialogOpen} onClose={() => setProgressDialogOpen(false)} goal={selectedGoal} />
    </>
  );
}
