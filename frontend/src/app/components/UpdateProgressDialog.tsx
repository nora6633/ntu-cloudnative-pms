import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "./ui/dialog";
import { Button } from "./ui/button";
import { Label } from "./ui/label";
import { Slider } from "./ui/slider";
import { Textarea } from "./ui/textarea";

interface UpdateProgressDialogProps {
  open: boolean;
  onClose: () => void;
  currentProgress: number;
  onUpdateProgress: (progress: number, note: string) => void;
}

export function UpdateProgressDialog({
  open,
  onClose,
  currentProgress,
  onUpdateProgress,
}: UpdateProgressDialogProps) {
  const [progress, setProgress] = useState(currentProgress);
  const [note, setNote] = useState("");

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onUpdateProgress(progress, note);
    setNote("");
    onClose();
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Update Progress</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-6 mt-4">
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <Label>Progress</Label>
              <span className="text-2xl font-semibold">{progress}%</span>
            </div>
            <Slider
              value={[progress]}
              onValueChange={(value) => setProgress(value[0])}
              min={0}
              max={100}
              step={5}
              className="w-full"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="note">Progress Note (Optional)</Label>
            <Textarea
              id="note"
              placeholder="Add a note about your progress, achievements, or blockers..."
              value={note}
              onChange={(e) => setNote(e.target.value)}
              rows={3}
            />
          </div>

          <div className="flex justify-end gap-3 pt-4">
            <Button type="button" variant="outline" onClick={onClose}>
              Cancel
            </Button>
            <Button type="submit">Update Progress</Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
