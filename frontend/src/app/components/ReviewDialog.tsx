import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "./ui/dialog";
import { Button } from "./ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "./ui/avatar";
import { Badge } from "./ui/badge";
import { ScrollArea } from "./ui/scroll-area";
import { Target, Calendar, TrendingUp } from "lucide-react";

interface EmployeeGoal {
  title: string;
  description: string;
  metric: string;
  targetValue: string;
  dueDate: string;
}

interface Employee {
  id: string;
  name: string;
  avatar: string;
  jobTitle: string;
  submitDate: string;
  status: "Pending" | "Approved" | "Rejected";
  goals: EmployeeGoal[];
}

interface ReviewDialogProps {
  open: boolean;
  onClose: () => void;
  employee: Employee | null;
  onApprove: (id: string) => void;
  onReject: (id: string) => void;
}

export function ReviewDialog({ open, onClose, employee, onApprove, onReject }: ReviewDialogProps) {
  if (!employee) return null;

  const getInitials = (name: string) => {
    return name
      .split(" ")
      .map((n) => n[0])
      .join("")
      .toUpperCase();
  };

  const handleApprove = () => {
    onApprove(employee.id);
    onClose();
  };

  const handleReject = () => {
    onReject(employee.id);
    onClose();
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[700px] max-h-[85vh]">
        <DialogHeader>
          <div className="flex items-center gap-4">
            <Avatar className="h-16 w-16">
              <AvatarImage src={employee.avatar} alt={employee.name} />
              <AvatarFallback>{getInitials(employee.name)}</AvatarFallback>
            </Avatar>
            <div>
              <DialogTitle className="text-xl">{employee.name}</DialogTitle>
              <p className="text-sm text-gray-600 mt-1">{employee.jobTitle}</p>
            </div>
          </div>
        </DialogHeader>

        <ScrollArea className="max-h-[50vh] pr-4">
          <div className="space-y-6 mt-4">
            <div>
              <h3 className="font-semibold text-lg mb-4">Goals for Review</h3>
              <div className="space-y-4">
                {employee.goals.map((goal, index) => (
                  <div
                    key={index}
                    className="border rounded-lg p-4 bg-gray-50 hover:bg-gray-100 transition-colors"
                  >
                    <div className="flex items-start gap-3 mb-3">
                      <div className="p-2 bg-blue-50 rounded-lg">
                        <Target className="w-4 h-4 text-blue-600" />
                      </div>
                      <div className="flex-1">
                        <h4 className="font-semibold text-gray-900">{goal.title}</h4>
                        <p className="text-sm text-gray-600 mt-1">{goal.description}</p>
                      </div>
                    </div>

                    <div className="grid grid-cols-3 gap-4 mt-4 pt-4 border-t">
                      <div>
                        <div className="flex items-center gap-1 text-xs text-gray-500 mb-1">
                          <TrendingUp className="w-3 h-3" />
                          <span>Metric</span>
                        </div>
                        <p className="text-sm font-medium text-gray-900">{goal.metric}</p>
                      </div>
                      <div>
                        <div className="text-xs text-gray-500 mb-1">Target Value</div>
                        <p className="text-sm font-medium text-gray-900">{goal.targetValue}</p>
                      </div>
                      <div>
                        <div className="flex items-center gap-1 text-xs text-gray-500 mb-1">
                          <Calendar className="w-3 h-3" />
                          <span>Due Date</span>
                        </div>
                        <p className="text-sm font-medium text-gray-900">{goal.dueDate}</p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </ScrollArea>

        <DialogFooter className="gap-2 sm:gap-0">
          <Button variant="outline" onClick={onClose}>
            Cancel
          </Button>
          <Button variant="destructive" onClick={handleReject}>
            Reject
          </Button>
          <Button onClick={handleApprove}>Approve</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
