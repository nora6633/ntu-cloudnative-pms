import { Dialog, DialogContent, DialogHeader, DialogTitle } from './ui/dialog';
import { ScrollArea } from './ui/scroll-area';
import type { EvaluationItemDTO } from '../../api';

interface EvaluationCriteriaDialogProps {
  open: boolean;
  onClose: () => void;
  jobTitle: string;
  items: EvaluationItemDTO[];
}

export function EvaluationCriteriaDialog({
  open,
  onClose,
  jobTitle,
  items,
}: EvaluationCriteriaDialogProps) {
  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[600px] max-h-[80vh]">
        <DialogHeader>
          <DialogTitle>Evaluation Criteria</DialogTitle>
        </DialogHeader>
        <ScrollArea className="max-h-[65vh] pr-4">
          <div className="space-y-6 mt-4">
            <div className="bg-blue-50 rounded-lg p-4 border border-blue-200">
              <p className="text-sm text-blue-600 font-medium">Job Title</p>
              <p className="text-lg font-semibold text-blue-900 mt-1">{jobTitle}</p>
            </div>

            {items.length === 0 ? (
              <p className="text-sm text-gray-500 text-center py-4">
                No evaluation criteria available for this cycle yet.
              </p>
            ) : (
              <div className="space-y-4">
                {items.map((item) => (
                  <div key={item.id} className="border rounded-lg p-4 bg-gray-50">
                    <h4 className="font-semibold text-gray-900 mb-2">{item.name}</h4>
                    <p className="text-sm text-gray-700 leading-relaxed">{item.description}</p>
                  </div>
                ))}
              </div>
            )}
          </div>
        </ScrollArea>
      </DialogContent>
    </Dialog>
  );
}
