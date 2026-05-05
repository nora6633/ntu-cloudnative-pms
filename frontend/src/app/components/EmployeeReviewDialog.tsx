import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from './ui/dialog';
import { Button } from './ui/button';
import { Textarea } from './ui/textarea';
import { ScrollArea } from './ui/scroll-area';
import { Avatar, AvatarFallback, AvatarImage } from './ui/avatar';
import { Star, Target, Calendar, Edit } from 'lucide-react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from './ui/tabs';
import { Badge } from './ui/badge';
import type { EvaluationDTO, EvaluationItemDTO } from '../../api';

function getInitials(name: string) {
  return name.split(' ').map((n) => n[0]).join('').toUpperCase();
}

interface EmployeeReviewDialogProps {
  open: boolean;
  onClose: () => void;
  evaluation: EvaluationDTO | null;
  onSave: (id: number, items: EvaluationItemDTO[]) => void;
  onSubmit: (id: number, items: EvaluationItemDTO[]) => void;
}

export function EmployeeReviewDialog({
  open,
  onClose,
  evaluation,
  onSave,
  onSubmit,
}: EmployeeReviewDialogProps) {
  const [items, setItems] = useState<EvaluationItemDTO[]>([]);
  const [isEditing, setIsEditing] = useState(false);

  useEffect(() => {
    if (evaluation) {
      setItems(evaluation.evaluationItems ?? []);
    }
    setIsEditing(false);
  }, [evaluation, open]);

  if (!evaluation || evaluation.id == null) return null;

  const name = evaluation.employeeName ?? '—';
  const goals = evaluation.goals ?? [];
  const isSubmitted = evaluation.status === 'PENDING_REVIEW_CONFIRMATION' || evaluation.status === 'PENDING_CLOSURE' || evaluation.status === 'CLOSED';
  const isReadOnly = isSubmitted && !isEditing;
  const allRated = items.length > 0 && items.every((it) => (it.rating ?? 0) > 0);

  const setRating = (id: number, rating: number) =>
    setItems((prev) => prev.map((it) => it.id === id ? { ...it, rating } : it));

  const setFeedback = (id: number, feedback: string) =>
    setItems((prev) => prev.map((it) => it.id === id ? { ...it, feedback } : it));

  const handleSave = () => onSave(evaluation.id!, items);
  const handleSubmit = () => {
    if (allRated) { onSubmit(evaluation.id!, items); onClose(); }
  };

  const StarRating = ({ item, readOnly }: { item: EvaluationItemDTO; readOnly: boolean }) => (
    <div className="flex gap-1">
      {[1, 2, 3, 4, 5].map((star) => (
        <button
          key={star}
          type="button"
          disabled={readOnly}
          onClick={() => !readOnly && setRating(item.id, star)}
          className={readOnly ? 'cursor-default' : 'cursor-pointer hover:scale-110 transition-transform'}
        >
          <Star className={`w-6 h-6 ${star <= (item.rating ?? 0) ? 'fill-yellow-400 text-yellow-400' : 'fill-none text-gray-300'}`} />
        </button>
      ))}
    </div>
  );

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[900px] max-h-[90vh]">
        <DialogHeader>
          <div className="flex items-center justify-between">
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
            {isSubmitted && !isEditing && (
              <Button variant="outline" size="sm" onClick={() => setIsEditing(true)}>
                <Edit className="w-4 h-4 mr-2" />Edit
              </Button>
            )}
          </div>
        </DialogHeader>

        <ScrollArea className="max-h-[60vh] pr-4">
          <Tabs defaultValue="feedback" className="w-full">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="feedback">Feedback</TabsTrigger>
              <TabsTrigger value="record">Goal Record</TabsTrigger>
            </TabsList>

            <TabsContent value="feedback" className="space-y-6 mt-6">
              {items.length === 0 ? (
                <p className="text-sm text-gray-500 text-center py-4">
                  No evaluation criteria available for this evaluation.
                </p>
              ) : (
                items.map((item) => (
                  <div key={item.id} className="border rounded-lg p-4 bg-gray-50">
                    <div className="flex items-start justify-between mb-3">
                      <div className="flex-1">
                        <h4 className="font-semibold text-gray-900 mb-1">{item.name}</h4>
                        <p className="text-sm text-gray-600">{item.description}</p>
                      </div>
                      <div className="ml-4">
                        <StarRating item={item} readOnly={isReadOnly} />
                      </div>
                    </div>
                    <Textarea
                      placeholder="Add your comments..."
                      value={item.feedback ?? ''}
                      onChange={(e) => setFeedback(item.id, e.target.value)}
                      disabled={isReadOnly}
                      rows={2}
                      className="mt-2"
                    />
                  </div>
                ))
              )}
            </TabsContent>

            <TabsContent value="record" className="space-y-4 mt-6">
              {goals.map((goal, i) => (
                <div key={goal.id ?? i} className="border rounded-lg p-4 bg-gray-50">
                  <div className="flex items-start gap-3 mb-2">
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
        </ScrollArea>

        <div className="flex justify-end gap-3 pt-4 border-t">
          <Button variant="outline" onClick={onClose}>Cancel</Button>
          {!isReadOnly && (
            <>
              <Button variant="outline" onClick={handleSave}>Save</Button>
              <Button onClick={handleSubmit} disabled={!allRated}>Submit</Button>
            </>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
