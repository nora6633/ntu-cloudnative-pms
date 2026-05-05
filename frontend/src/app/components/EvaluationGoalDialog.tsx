import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from './ui/dialog';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Textarea } from './ui/textarea';
import { Label } from './ui/label';
import type { GoalDTO } from '../../api';

interface EvaluationGoalDialogProps {
  open: boolean;
  onClose: () => void;
  onSave: (goal: Omit<GoalDTO, 'id' | 'progresses'>) => void;
  existingGoal?: GoalDTO | null;
  mode: 'create' | 'edit';
}

export function EvaluationGoalDialog({
  open,
  onClose,
  onSave,
  existingGoal,
  mode,
}: EvaluationGoalDialogProps) {
  const [definition, setDefinition] = useState('');
  const [metric, setMetric] = useState('');
  const [deadline, setDeadline] = useState('');
  const [criteria, setCriteria] = useState('');
  const [relevance, setRelevance] = useState('');
  const [resource, setResource] = useState('');

  useEffect(() => {
    if (existingGoal && mode === 'edit') {
      setDefinition(existingGoal.definition);
      setMetric(existingGoal.metric);
      setDeadline(existingGoal.deadline ?? '');
      setCriteria((existingGoal.criteria ?? []).join(', '));
      setRelevance(existingGoal.relevance);
      setResource(existingGoal.resource);
    } else if (mode === 'create') {
      setDefinition('');
      setMetric('');
      setDeadline('');
      setCriteria('');
      setRelevance('');
      setResource('');
    }
  }, [existingGoal, mode, open]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!definition.trim() || !metric.trim() || !relevance.trim() || !resource.trim()) return;
    onSave({
      definition: definition.trim(),
      metric: metric.trim(),
      deadline: deadline || undefined,
      criteria: criteria.split(',').map((s) => s.trim()).filter(Boolean),
      relevance: relevance.trim(),
      resource: resource.trim(),
    });
    onClose();
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[520px]">
        <DialogHeader>
          <DialogTitle>{mode === 'create' ? 'New Goal' : 'Update Goal'}</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4 mt-4">
          <div className="space-y-2">
            <Label htmlFor="definition">Goal Statement</Label>
            <Textarea
              id="definition"
              placeholder="A clear and concise statement of what you want to achieve..."
              value={definition}
              onChange={(e) => setDefinition(e.target.value)}
              required
              rows={2}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="metric">Metric</Label>
            <Input
              id="metric"
              placeholder="e.g. Course completion, Review count, Projects delivered"
              value={metric}
              onChange={(e) => setMetric(e.target.value)}
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="deadline">Deadline</Label>
            <Input
              id="deadline"
              type="date"
              value={deadline}
              onChange={(e) => setDeadline(e.target.value)}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="criteria">
              Evaluation Criteria
              <span className="text-xs text-gray-400 ml-2">(comma-separated)</span>
            </Label>
            <Input
              id="criteria"
              placeholder="e.g. Technical Proficiency, Delivery, Collaboration"
              value={criteria}
              onChange={(e) => setCriteria(e.target.value)}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="relevance">Relevance to Criteria</Label>
            <Textarea
              id="relevance"
              placeholder="Explain how this goal relates to your evaluation criteria..."
              value={relevance}
              onChange={(e) => setRelevance(e.target.value)}
              required
              rows={2}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="resource">Required Resources</Label>
            <Input
              id="resource"
              placeholder="e.g. Online course license, Manager support, Budget approval"
              value={resource}
              onChange={(e) => setResource(e.target.value)}
              required
            />
          </div>

          <div className="flex justify-end gap-3 pt-4">
            <Button type="button" variant="outline" onClick={onClose}>
              Cancel
            </Button>
            <Button type="submit">{mode === 'create' ? 'Add Goal' : 'Save Changes'}</Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
