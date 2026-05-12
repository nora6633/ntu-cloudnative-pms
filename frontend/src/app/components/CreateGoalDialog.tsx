import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "./ui/dialog";
import { Button } from "./ui/button";
import { Input } from "./ui/input";
import { Textarea } from "./ui/textarea";
import { Label } from "./ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "./ui/select";

interface CreateGoalDialogProps {
  open: boolean;
  onClose: () => void;
  onCreateGoal: (goal: {
    title: string;
    description: string;
    category: string;
    deadline: string;
  }) => void;
}

export function CreateGoalDialog({ open, onClose, onCreateGoal }: CreateGoalDialogProps) {
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [category, setCategory] = useState("");
  const [deadline, setDeadline] = useState("");

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (title && description && category && deadline) {
      onCreateGoal({ title, description, category, deadline });
      setTitle("");
      setDescription("");
      setCategory("");
      setDeadline("");
      onClose();
    }
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Create New Goal</DialogTitle>
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
            <Label htmlFor="category">Category</Label>
            <Select value={category} onValueChange={setCategory} required>
              <SelectTrigger>
                <SelectValue placeholder="Select a category" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="Professional Development">Professional Development</SelectItem>
                <SelectItem value="Technical Skills">Technical Skills</SelectItem>
                <SelectItem value="Leadership">Leadership</SelectItem>
                <SelectItem value="Team Collaboration">Team Collaboration</SelectItem>
                <SelectItem value="Personal Growth">Personal Growth</SelectItem>
              </SelectContent>
            </Select>
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
            <Button type="submit">Create Goal</Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
