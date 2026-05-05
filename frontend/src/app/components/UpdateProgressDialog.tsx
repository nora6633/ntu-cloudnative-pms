import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from './ui/dialog';
import { Button } from './ui/button';
import { Label } from './ui/label';
import { Textarea } from './ui/textarea';

interface UpdateProgressDialogProps {
  open: boolean;
  onClose: () => void;
  onAddProgress: (description: string) => void;
}

export function UpdateProgressDialog({
  open,
  onClose,
  onAddProgress,
}: UpdateProgressDialogProps) {
  const [description, setDescription] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!description.trim()) return;
    onAddProgress(description.trim());
    setDescription('');
    onClose();
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[480px]">
        <DialogHeader>
          <DialogTitle>Add Progress Update</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4 mt-4">
          <div className="space-y-2">
            <Label htmlFor="description">Progress Description</Label>
            <Textarea
              id="description"
              placeholder="Describe what you accomplished, any blockers you encountered, or next steps..."
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={4}
              required
            />
          </div>

          <div className="flex justify-end gap-3 pt-2">
            <Button type="button" variant="outline" onClick={onClose}>
              Cancel
            </Button>
            <Button type="submit" disabled={!description.trim()}>
              Add Update
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
