import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from './ui/dialog';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Textarea } from './ui/textarea';
import { Label } from './ui/label';
import type { GoalDTO, EvaluationItemDTO } from '../../api';

interface EvaluationGoalDialogProps {
  open: boolean;
  onClose: () => void;
  onSave: (goal: Omit<GoalDTO, 'id' | 'progresses'>) => void;
  existingGoal?: GoalDTO | null;
  criteria: EvaluationItemDTO[];
  mode: 'create' | 'edit';
}

export function EvaluationGoalDialog({
  open,
  onClose,
  onSave,
  existingGoal,
  criteria,
  mode,
}: EvaluationGoalDialogProps) {
  const [definition, setDefinition] = useState('');
  const [metric, setMetric] = useState('');
  const [deadline, setDeadline] = useState('');
  const [selectedCriteria, setSelectedCriteria] = useState<string[]>([]);
  const [relevance, setRelevance] = useState('');
  const [resource, setResource] = useState('');

  const today = new Date().toISOString().split('T')[0];
  const options = criteria.map((item) => item.name);

  const toggleCriteria = (item: string) => {
    setSelectedCriteria((prev) =>
      prev.includes(item)
        ? prev.filter((i) => i !== item) // Remove if already there
        : [...prev, item]                // Add if not there
    );
  };

  useEffect(() => {
    if (existingGoal && mode === 'edit') {
      setDefinition(existingGoal.definition);
      setMetric(existingGoal.metric);
      setDeadline(existingGoal.deadline ?? '');
      setSelectedCriteria(existingGoal.criteria ?? []);
      setRelevance(existingGoal.relevance);
      setResource(existingGoal.resource);
    } else if (mode === 'create') {
      setDefinition('');
      setMetric('');
      setDeadline('');
      setSelectedCriteria([]);
      setRelevance('');
      setResource('');
    }
  }, [existingGoal, mode, open]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!definition.trim() || !metric.trim() || !relevance.trim() || !resource.trim() || !deadline.trim() || selectedCriteria.length===0 ) return;
    onSave({
      definition: definition.trim(),
      metric: metric.trim(),
      deadline: deadline || undefined,
      criteria: selectedCriteria,
      relevance: relevance.trim(),
      resource: resource.trim(),
    });
    onClose();
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[650px] flex flex-col max-h-[90vh]">
        <DialogHeader>
          <DialogTitle>{mode === 'create' ? 'New Goal' : 'Update Goal'}</DialogTitle>
        </DialogHeader>
        <div className="flex-1 overflow-y-auto">
        <form onSubmit={handleSubmit} className="space-y-4 mt-4">
          <div className="space-y-2">
            <Label htmlFor="definition">Goal Statement <span className="text-red-500">*</span></Label>
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
            <Label htmlFor="metric">Metric <span className="text-red-500">*</span></Label>
            <Input
              id="metric"
              placeholder="e.g. Course completion, Review count, Projects delivered"
              value={metric}
              onChange={(e) => setMetric(e.target.value)}
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="deadline">Deadline <span className="text-red-500">*</span></Label>
            <Input
              id="deadline"
              type="date"
              min={today}
              value={deadline}
              onChange={(e) => setDeadline(e.target.value)}
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="criteria">
              Evaluation Criteria <span className="text-red-500">*</span>
            </Label>
            {options.map((option) => (
              <button
                key={option}
                type="button"
                onClick={() => toggleCriteria(option)}
                className={`px-3 py-1 text-sm rounded-md border transition-colors text-left ${
                  selectedCriteria.includes(option)
                    ? "bg-primary text-primary-foreground border-primary"
                    : "bg-background border-input hover:bg-accent"
                }`}
              >
                {option}
                </button>
            ))}
          </div>

          <div className="space-y-2">
            <Label htmlFor="relevance">Relevance to Criteria <span className="text-red-500">*</span></Label>
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
            <Label htmlFor="resource">Required Resources <span className="text-red-500">*</span></Label>
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
            <Button type="submit" disabled={!definition.trim() || !metric.trim() || !relevance.trim() || !resource.trim() || !deadline.trim()|| selectedCriteria.length===0 }>{mode === 'create' ? 'Add Goal' : 'Save Changes'}</Button>
          </div>
        </form>
        </div>
      </DialogContent>
    </Dialog>
  );
}
