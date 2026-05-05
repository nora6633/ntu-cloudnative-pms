import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from './ui/dialog';
import { Button } from './ui/button';
import { Avatar, AvatarFallback, AvatarImage } from './ui/avatar';
import { Badge } from './ui/badge';
import { ScrollArea } from './ui/scroll-area';
import { Target, Calendar } from 'lucide-react';
import type { EvaluationDTO } from '../../api';

function getInitials(name: string) {
  return name.split(' ').map((n) => n[0]).join('').toUpperCase();
}

interface ReviewDialogProps {
  open: boolean;
  onClose: () => void;
  evaluation: EvaluationDTO | null;
  onApprove: (id: number) => void;
  onReject: (id: number) => void;
}

export function ReviewDialog({
  open,
  onClose,
  evaluation,
  onApprove,
  onReject,
}: ReviewDialogProps) {
  if (!evaluation || evaluation.id == null) return null;

  const name = evaluation.employeeName ?? '—';
  const goals = evaluation.goals ?? [];

  const handleApprove = () => { onApprove(evaluation.id!); onClose(); };
  const handleReject  = () => { onReject(evaluation.id!);  onClose(); };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[700px] max-h-[85vh]">
        <DialogHeader>
          <div className="flex items-center gap-4">
            <Avatar className="h-16 w-16">
              <AvatarImage src="" alt={name} />
              <AvatarFallback>{getInitials(name)}</AvatarFallback>
            </Avatar>
            <div>
              <DialogTitle className="text-xl">{name}</DialogTitle>
              <p className="text-sm text-gray-600 mt-1">{evaluation.employeeJobTitle}</p>
            </div>
          </div>
        </DialogHeader>

        <ScrollArea className="max-h-[50vh] pr-4">
          <div className="space-y-4 mt-4">
            <h3 className="font-semibold text-lg">Goals for Review</h3>
            {goals.length === 0 ? (
              <p className="text-sm text-gray-500">No goals submitted.</p>
            ) : (
              goals.map((goal, i) => (
                <div key={goal.id ?? i} className="border rounded-lg p-4 bg-gray-50">
                  <div className="flex items-start gap-3 mb-3">
                    <div className="p-2 bg-blue-50 rounded-lg">
                      <Target className="w-4 h-4 text-blue-600" />
                    </div>
                    <div className="flex-1">
                      <h4 className="font-semibold text-gray-900">{goal.definition}</h4>
                      <p className="text-sm text-gray-600 mt-1">{goal.relevance}</p>
                    </div>
                  </div>

                  <div className="grid grid-cols-3 gap-4 mt-4 pt-4 border-t">
                    <div>
                      <div className="text-xs text-gray-500 mb-1">Metric</div>
                      <p className="text-sm font-medium">{goal.metric}</p>
                    </div>
                    <div>
                      <div className="text-xs text-gray-500 mb-1">Resources</div>
                      <p className="text-sm font-medium">{goal.resource}</p>
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
                </div>
              ))
            )}
          </div>
        </ScrollArea>

        <DialogFooter className="gap-2 sm:gap-0">
          <Button variant="outline" onClick={onClose}>Cancel</Button>
          <Button variant="destructive" onClick={handleReject}>Reject</Button>
          <Button onClick={handleApprove}>Approve</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
