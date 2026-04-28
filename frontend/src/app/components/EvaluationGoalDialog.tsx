import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "./ui/dialog";
import { Button } from "./ui/button";
import { Input } from "./ui/input";
import { Textarea } from "./ui/textarea";
import { Label } from "./ui/label";

interface EvaluationGoal {
  id: string;
  title: string;
  description: string;
  metric: string;
  targetValue: string;
  deadline: string;
}

interface EvaluationGoalDialogProps {
  open: boolean;
  onClose: () => void;
  onSave: (goal: Omit<EvaluationGoal, "id">) => void;
  existingGoal?: EvaluationGoal | null;
  mode: "create" | "edit";
}

export function EvaluationGoalDialog({ open, onClose, onSave, existingGoal, mode }: EvaluationGoalDialogProps) {
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [metric, setMetric] = useState("");
  const [targetValue, setTargetValue] = useState("");
  const [deadline, setDeadline] = useState("");

  useEffect(() => {
    if (existingGoal && mode === "edit") {
      setTitle(existingGoal.title);
      setDescription(existingGoal.description);
      setMetric(existingGoal.metric);
      setTargetValue(existingGoal.targetValue);
      setDeadline(existingGoal.deadline);
    } else if (mode === "create") {
      setTitle("");
      setDescription("");
      setMetric("");
      setTargetValue("");
      setDeadline("");
    }
  }, [existingGoal, mode, open]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (title && description && metric && targetValue && deadline) {
      onSave({ title, description, metric, targetValue, deadline });
      setTitle("");
      setDescription("");
      setMetric("");
      setTargetValue("");
      setDeadline("");
      onClose();
    }
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>{mode === "create" ? "New Goal" : "Update Goal"}</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4 mt-4">
          <div className="space-y-2">
            <Label htmlFor="title">Goal Title</Label>
            <Input
              id="title"
              placeholder="e.g., Complete React certification"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="description">Description</Label>
            <Textarea
              id="description"
              placeholder="Describe your goal and what success looks like..."
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              required
              rows={3}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="metric">Metric</Label>
            <Input
              id="metric"
              placeholder="e.g., Course Completion, Code Reviews, Projects"
              value={metric}
              onChange={(e) => setMetric(e.target.value)}
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="targetValue">Target Value</Label>
            <Input
              id="targetValue"
              placeholder="e.g., 100%, 50 reviews, 3 projects"
              value={targetValue}
              onChange={(e) => setTargetValue(e.target.value)}
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
              required
            />
          </div>

          <div className="flex justify-end gap-3 pt-4">
            <Button type="button" variant="outline" onClick={onClose}>
              Cancel
            </Button>
            <Button type="submit">{mode === "create" ? "Add Goal" : "Save Changes"}</Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
