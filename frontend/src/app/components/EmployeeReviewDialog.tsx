import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "./ui/dialog";
import { Button } from "./ui/button";
import { Textarea } from "./ui/textarea";
import { ScrollArea } from "./ui/scroll-area";
import { Badge } from "./ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "./ui/avatar";
import { Star, Eye, Edit } from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "./ui/tabs";

interface EmployeeGoal {
  title: string;
  description: string;
  metric: string;
  targetValue: string;
  dueDate: string;
  progressHistory?: Array<{
    date: string;
    progress: number;
    note?: string;
  }>;
}

interface EmployeeReview {
  id: string;
  name: string;
  avatar: string;
  jobTitle: string;
  submitDate: string;
  status: "Not Started" | "In Progress" | "Submitted" | "Closed";
  goals: EmployeeGoal[];
}

interface CriteriaRating {
  name: string;
  description: string;
  rating: number;
}

interface ReviewProgress {
  ratings: { [key: string]: number };
  comments: { [key: string]: string };
}

interface EmployeeReviewDialogProps {
  open: boolean;
  onClose: () => void;
  employee: EmployeeReview | null;
  onSave: (employeeId: string, progress: ReviewProgress) => void;
  onSubmit: (employeeId: string, progress: ReviewProgress) => void;
  savedProgress?: ReviewProgress;
}

const criteria = [
  {
    name: "Business Impact",
    description: "Demonstrates measurable contribution to business outcomes, revenue growth, cost savings, or strategic initiatives.",
  },
  {
    name: "Delivery",
    description: "Consistently delivers high-quality work on time. Manages priorities effectively and meets deadlines.",
  },
  {
    name: "Quality",
    description: "Produces work that meets or exceeds standards with attention to detail and commitment to excellence.",
  },
  {
    name: "Innovation",
    description: "Brings creative solutions to problems and contributes new ideas that improve processes or products.",
  },
  {
    name: "Collaboration",
    description: "Works effectively with others, communicates clearly, and contributes to a positive team culture.",
  },
];

export function EmployeeReviewDialog({
  open,
  onClose,
  employee,
  onSave,
  onSubmit,
  savedProgress,
}: EmployeeReviewDialogProps) {
  const [ratings, setRatings] = useState<{ [key: string]: number }>({});
  const [comments, setComments] = useState<{ [key: string]: string }>({});
  const [isEditing, setIsEditing] = useState(false);
  const [selectedGoalForProgress, setSelectedGoalForProgress] = useState<EmployeeGoal | null>(null);

  useEffect(() => {
    if (savedProgress && employee) {
      setRatings(savedProgress.ratings || {});
      setComments(savedProgress.comments || {});
    } else {
      setRatings({});
      setComments({});
    }
    setIsEditing(false);
  }, [employee, savedProgress, open]);

  if (!employee) return null;

  const getInitials = (name: string) => {
    return name.split(" ").map((n) => n[0]).join("").toUpperCase();
  };

  const allCriteriaRated = criteria.every((c) => ratings[c.name] && ratings[c.name] > 0);
  const isReadOnly = employee.status === "Submitted" && !isEditing;

  const handleSave = () => {
    onSave(employee.id, { ratings, comments });
  };

  const handleSubmit = () => {
    if (allCriteriaRated) {
      onSubmit(employee.id, { ratings, comments });
      onClose();
    }
  };

  const StarRating = ({ criterionName, readOnly }: { criterionName: string; readOnly: boolean }) => {
    const currentRating = ratings[criterionName] || 0;

    return (
      <div className="flex gap-1">
        {[1, 2, 3, 4, 5].map((star) => (
          <button
            key={star}
            type="button"
            disabled={readOnly}
            onClick={() => {
              if (!readOnly) {
                setRatings({ ...ratings, [criterionName]: star });
              }
            }}
            className={`${readOnly ? "cursor-default" : "cursor-pointer hover:scale-110"} transition-transform`}
          >
            <Star
              className={`w-6 h-6 ${
                star <= currentRating
                  ? "fill-yellow-400 text-yellow-400"
                  : "fill-none text-gray-300"
              }`}
            />
          </button>
        ))}
      </div>
    );
  };

  return (
    <>
      <Dialog open={open && !selectedGoalForProgress} onOpenChange={onClose}>
        <DialogContent className="sm:max-w-[900px] max-h-[90vh]">
          <DialogHeader>
            <div className="flex items-center justify-between">
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
              {employee.status === "Submitted" && !isEditing && (
                <Button variant="outline" size="sm" onClick={() => setIsEditing(true)}>
                  <Edit className="w-4 h-4 mr-2" />
                  Edit
                </Button>
              )}
            </div>
          </DialogHeader>

          <ScrollArea className="max-h-[60vh] pr-4">
            <Tabs defaultValue="feedback" className="w-full">
              <TabsList className="grid w-full grid-cols-2">
                <TabsTrigger value="feedback">Feedback</TabsTrigger>
                <TabsTrigger value="record">Record</TabsTrigger>
              </TabsList>

              <TabsContent value="feedback" className="space-y-6 mt-6">
                {criteria.map((criterion, index) => (
                  <div key={index} className="border rounded-lg p-4 bg-gray-50">
                    <div className="flex items-start justify-between mb-3">
                      <div className="flex-1">
                        <h4 className="font-semibold text-gray-900 mb-1">{criterion.name}</h4>
                        <p className="text-sm text-gray-600">{criterion.description}</p>
                      </div>
                      <div className="ml-4">
                        <StarRating criterionName={criterion.name} readOnly={isReadOnly} />
                      </div>
                    </div>
                    <Textarea
                      placeholder="Add your comments..."
                      value={comments[criterion.name] || ""}
                      onChange={(e) =>
                        setComments({ ...comments, [criterion.name]: e.target.value })
                      }
                      disabled={isReadOnly}
                      rows={2}
                      className="mt-2"
                    />
                  </div>
                ))}
              </TabsContent>

              <TabsContent value="record" className="space-y-4 mt-6">
                {employee.goals.map((goal, index) => (
                  <div key={index} className="border rounded-lg p-4 bg-gray-50">
                    <div className="flex items-start justify-between mb-2">
                      <div className="flex-1">
                        <h4 className="font-semibold text-gray-900">{goal.title}</h4>
                        <p className="text-sm text-gray-600 mt-1">{goal.description}</p>
                      </div>
                    </div>
                    <div className="grid grid-cols-3 gap-4 mt-3 pt-3 border-t">
                      <div>
                        <div className="text-xs text-gray-500 mb-1">Metric</div>
                        <p className="text-sm font-medium">{goal.metric}</p>
                      </div>
                      <div>
                        <div className="text-xs text-gray-500 mb-1">Target Value</div>
                        <p className="text-sm font-medium">{goal.targetValue}</p>
                      </div>
                      <div>
                        <div className="text-xs text-gray-500 mb-1">Due Date</div>
                        <p className="text-sm font-medium">{goal.dueDate}</p>
                      </div>
                    </div>
                    {goal.progressHistory && goal.progressHistory.length > 0 && (
                      <div className="mt-3 pt-3 border-t">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => setSelectedGoalForProgress(goal)}
                        >
                          <Eye className="w-4 h-4 mr-2" />
                          View Progress
                        </Button>
                      </div>
                    )}
                  </div>
                ))}
              </TabsContent>
            </Tabs>
          </ScrollArea>

          <div className="flex justify-end gap-3 pt-4 border-t">
            <Button variant="outline" onClick={onClose}>
              Cancel
            </Button>
            {!isReadOnly && (
              <>
                <Button variant="outline" onClick={handleSave}>
                  Save
                </Button>
                <Button onClick={handleSubmit} disabled={!allCriteriaRated}>
                  Submit
                </Button>
              </>
            )}
          </div>
        </DialogContent>
      </Dialog>

      {/* Progress History Dialog */}
      <Dialog open={!!selectedGoalForProgress} onOpenChange={() => setSelectedGoalForProgress(null)}>
        <DialogContent className="sm:max-w-[600px]">
          <DialogHeader>
            <DialogTitle>{selectedGoalForProgress?.title}</DialogTitle>
          </DialogHeader>
          <ScrollArea className="max-h-[60vh] pr-4">
            <div className="space-y-4 mt-4">
              {selectedGoalForProgress?.progressHistory?.map((entry, index) => (
                <div key={index} className="border-l-2 border-blue-200 pl-4 pb-4">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-sm text-gray-600">{entry.date}</span>
                    <Badge variant="outline" className="ml-auto">
                      {entry.progress}%
                    </Badge>
                  </div>
                  {entry.note && <p className="text-sm text-gray-700 mt-2">{entry.note}</p>}
                </div>
              ))}
            </div>
          </ScrollArea>
        </DialogContent>
      </Dialog>
    </>
  );
}
