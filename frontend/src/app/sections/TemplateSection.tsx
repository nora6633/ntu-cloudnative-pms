import { useState } from "react";
import { Plus, Trash2 } from "lucide-react";
import { Button } from "../components/ui/button";
import { Input } from "../components/ui/input";
import { Textarea } from "../components/ui/textarea";
import { Label } from "../components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "../components/ui/select";
import { JOB_TITLES } from "../data";
import type { Template, TemplateCriterion } from "../types";

const EVALUATION_CYCLES = [
  "Annual Review",
  "Semi-Annual Review",
  "Quarterly Review",
  "Monthly Review",
  "Project-Based Review",
];

function createCriterion(): TemplateCriterion {
  return { id: Date.now().toString() + Math.random(), title: "", description: "" };
}

interface TemplateSectionProps {
  onCreateTemplate: (template: Omit<Template, "id">) => void;
}

export function TemplateSection({ onCreateTemplate }: TemplateSectionProps) {
  const [templateName, setTemplateName] = useState("");
  const [jobTitle, setJobTitle] = useState("");
  const [evaluationCycle, setEvaluationCycle] = useState("");
  const [criteria, setCriteria] = useState<TemplateCriterion[]>([createCriterion()]);

  const updateCriterion = (id: string, field: "title" | "description", value: string) => {
    setCriteria((prev) => prev.map((c) => (c.id === id ? { ...c, [field]: value } : c)));
  };

  const addCriterion = () => setCriteria((prev) => [...prev, createCriterion()]);

  const removeCriterion = (id: string) => {
    if (criteria.length === 1) return;
    setCriteria((prev) => prev.filter((c) => c.id !== id));
  };

  const isSubmittable =
    templateName.trim() !== "" &&
    jobTitle.trim() !== "" &&
    evaluationCycle.trim() !== "" &&
    criteria[0].title.trim() !== "";

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!isSubmittable) return;
    onCreateTemplate({ name: templateName, jobTitle, evaluationCycle, criteria });
    alert("Template created successfully!");
    setTemplateName("");
    setJobTitle("");
    setEvaluationCycle("");
    setCriteria([createCriterion()]);
  };

  return (
    <div className="p-8">
      <div className="max-w-2xl mx-auto">
        <div className="mb-8">
          <h2 className="text-2xl font-bold text-gray-900">Template</h2>
          <p className="text-gray-600 mt-1">Create new template</p>
        </div>

        <div className="bg-white rounded-lg border p-8">
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="space-y-2">
              <Label>Template Name</Label>
              <Input
                placeholder="Select of type name"
                value={templateName}
                onChange={(e) => setTemplateName(e.target.value)}
              />
            </div>

            <div className="space-y-2">
              <Label>Job Title</Label>
              <Select value={jobTitle} onValueChange={setJobTitle}>
                <SelectTrigger>
                  <SelectValue placeholder="Select job title" />
                </SelectTrigger>
                <SelectContent>
                  {JOB_TITLES.map((t) => (
                    <SelectItem key={t} value={t}>{t}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>Evaluation Cycle</Label>
              <Select value={evaluationCycle} onValueChange={setEvaluationCycle}>
                <SelectTrigger>
                  <SelectValue placeholder="Select evaluation cycle" />
                </SelectTrigger>
                <SelectContent>
                  {EVALUATION_CYCLES.map((c) => (
                    <SelectItem key={c} value={c}>{c}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-3">
              <Label>Criteria</Label>
              <div className="space-y-4">
                {criteria.map((criterion, index) => (
                  <div key={criterion.id} className="flex gap-3">
                    <span className="text-sm text-gray-500 pt-2 min-w-[1.25rem] text-right">
                      {index + 1}.
                    </span>
                    <div className="flex-1 space-y-2">
                      <Input
                        placeholder="Enter Criteria Title"
                        value={criterion.title}
                        onChange={(e) => updateCriterion(criterion.id, "title", e.target.value)}
                      />
                      <Textarea
                        placeholder="Enter Criteria Description"
                        value={criterion.description}
                        onChange={(e) => updateCriterion(criterion.id, "description", e.target.value)}
                        rows={3}
                      />
                    </div>
                    {criteria.length > 1 && (
                      <button
                        type="button"
                        onClick={() => removeCriterion(criterion.id)}
                        className="mt-2 text-gray-400 hover:text-red-500 transition-colors self-start"
                        aria-label="Remove criteria"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    )}
                  </div>
                ))}
              </div>
              <Button type="button" variant="outline" onClick={addCriterion} className="mt-1">
                <Plus className="w-4 h-4 mr-2" />
                New Criteria
              </Button>
            </div>

            <div className="pt-4 border-t flex justify-end">
              <Button type="submit" disabled={!isSubmittable} size="lg">
                Submit
              </Button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
