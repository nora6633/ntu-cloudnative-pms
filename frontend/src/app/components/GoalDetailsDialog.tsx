import { Dialog, DialogContent, DialogHeader, DialogTitle } from './ui/dialog';
import { Badge } from './ui/badge';
import { ScrollArea } from './ui/scroll-area';
import { Calendar, Clock } from 'lucide-react';
import type { GoalDTO } from '../../api';

interface GoalDetailsDialogProps {
  open: boolean;
  onClose: () => void;
  goal: GoalDTO | null;
}

export function GoalDetailsDialog({ open, onClose, goal }: GoalDetailsDialogProps) {
  if (!goal) return null;

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[600px] max-h-[80vh]">
        <DialogHeader>
          <DialogTitle>{goal.definition}</DialogTitle>
        </DialogHeader>
        <ScrollArea className="max-h-[60vh] pr-4">
          <div className="space-y-6 mt-4">
            <p className="text-gray-600 text-sm leading-relaxed">{goal.relevance}</p>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <div className="text-xs text-gray-500 mb-1">Metric</div>
                <p className="text-sm font-medium">{goal.metric}</p>
              </div>
              <div>
                <div className="text-xs text-gray-500 mb-1 flex items-center gap-1">
                  <Calendar className="w-3 h-3" />Deadline
                </div>
                <p className="text-sm font-medium">{goal.deadline ?? '—'}</p>
              </div>
              <div className="col-span-2">
                <div className="text-xs text-gray-500 mb-1">Required Resources</div>
                <p className="text-sm font-medium">{goal.resource}</p>
              </div>
            </div>

            {goal.criteria && goal.criteria.length > 0 && (
              <div>
                <div className="text-xs text-gray-500 mb-2">Evaluation Criteria</div>
                <div className="flex flex-wrap gap-1.5">
                  {goal.criteria.map((c) => (
                    <Badge key={c} variant="outline" className="text-xs">{c}</Badge>
                  ))}
                </div>
              </div>
            )}

            {goal.progresses && goal.progresses.length > 0 && (
              <div>
                <h4 className="font-semibold mb-4">Progress Log</h4>
                <div className="space-y-3">
                  {[...goal.progresses].reverse().map((entry, i) => (
                    <div key={i} className="border-l-2 border-blue-200 pl-4 pb-3">
                      <div className="flex items-center gap-2 mb-1">
                        <Clock className="w-3.5 h-3.5 text-gray-400" />
                        <span className="text-xs text-gray-500">{entry.timestamp ?? ''}</span>
                      </div>
                      <p className="text-sm text-gray-700">{entry.description}</p>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </ScrollArea>
      </DialogContent>
    </Dialog>
  );
}
