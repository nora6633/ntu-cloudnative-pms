import { Dialog, DialogContent, DialogHeader, DialogTitle } from './ui/dialog';
import { Button } from './ui/button';
import { ScrollArea } from './ui/scroll-area';
import type { GoalDTO } from '../../api';

interface ViewProgressDialogProps {
  open: boolean;
  onClose: () => void;
  goal: GoalDTO | null;
}

export function ViewProgressDialog({ open, onClose, goal }: ViewProgressDialogProps) {
  if (!goal) return null;

  const progresses = goal.progresses ?? [];

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[600px] max-h-[90vh]">
        <DialogHeader>
          <DialogTitle className="text-xl">{goal.definition}</DialogTitle>
        </DialogHeader>

        <ScrollArea className="max-h-[50vh] pr-4">
          <div className="space-y-3 mt-4">
            <h4 className="font-semibold text-gray-900 text-sm">Progress History</h4>
            {progresses.length === 0 ? (
              <p className="text-sm text-gray-500 italic">No progress entries yet</p>
            ) : (
              progresses.map((progress, idx) => (
                <div key={idx} className="border-l-4 border-blue-400 bg-blue-50 p-3 rounded">
                  {progress.timestamp && (
                    <p className="text-xs text-gray-500 font-medium mb-1">{progress.timestamp}</p>
                  )}
                  <p className="text-sm text-gray-700">{progress.description}</p>
                </div>
              ))
            )}
          </div>
        </ScrollArea>

        <div className="flex justify-end pt-4 border-t">
          <Button variant="outline" onClick={onClose}>Close</Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
