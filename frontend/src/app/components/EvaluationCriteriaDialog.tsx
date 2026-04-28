import { Dialog, DialogContent, DialogHeader, DialogTitle } from "./ui/dialog";
import { ScrollArea } from "./ui/scroll-area";

interface EvaluationCriteriaDialogProps {
  open: boolean;
  onClose: () => void;
  jobTitle: string;
}

export function EvaluationCriteriaDialog({ open, onClose, jobTitle }: EvaluationCriteriaDialogProps) {
  const criteria = [
    {
      name: "Business Impact",
      description: "Demonstrates measurable contribution to business outcomes, revenue growth, cost savings, or strategic initiatives. Shows understanding of how work aligns with company objectives.",
    },
    {
      name: "Delivery",
      description: "Consistently delivers high-quality work on time. Manages priorities effectively, meets deadlines, and proactively communicates risks or blockers.",
    },
    {
      name: "Quality",
      description: "Produces work that meets or exceeds standards. Demonstrates attention to detail, thoroughness, and commitment to excellence in all deliverables.",
    },
    {
      name: "Innovation",
      description: "Brings creative solutions to problems. Challenges the status quo constructively and contributes new ideas that improve processes, products, or team effectiveness.",
    },
    {
      name: "Collaboration",
      description: "Works effectively with others across teams and functions. Communicates clearly, supports teammates, shares knowledge, and contributes to a positive team culture.",
    },
  ];

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

            <div className="space-y-4">
              {criteria.map((criterion, index) => (
                <div key={index} className="border rounded-lg p-4 bg-gray-50">
                  <h4 className="font-semibold text-gray-900 mb-2">{criterion.name}</h4>
                  <p className="text-sm text-gray-700 leading-relaxed">{criterion.description}</p>
                </div>
              ))}
            </div>
          </div>
        </ScrollArea>
      </DialogContent>
    </Dialog>
  );
}
