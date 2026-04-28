import { useState, useMemo } from "react";
import { Eye } from "lucide-react";
import { Button } from "../components/ui/button";
import { Label } from "../components/ui/label";
import { ScrollArea } from "../components/ui/scroll-area";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "../components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "../components/ui/dialog";
import { JOB_TITLES } from "../data";
import type { Template } from "../types";

const EVALUATION_CYCLES = [
  "Annual Review",
  "Semi-Annual Review",
  "Quarterly Review",
  "Monthly Review",
  "Project-Based Review",
];

// ── Template preview dialog ────────────────────────────────────────────────
function TemplatePreviewDialog({
  template,
  open,
  onClose,
}: {
  template: Template | null;
  open: boolean;
  onClose: () => void;
}) {
  if (!template) return null;
  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[560px]">
        <DialogHeader>
          <DialogTitle>{template.name}</DialogTitle>
          <p className="text-sm text-gray-500 mt-1">
            {template.jobTitle} · {template.evaluationCycle}
          </p>
        </DialogHeader>
        <ScrollArea className="max-h-[60vh] pr-2">
          <div className="space-y-4 mt-2">
            {template.criteria.map((criterion, i) => (
              <div key={criterion.id} className="border rounded-lg p-4 bg-gray-50">
                <p className="text-sm font-semibold text-gray-900">
                  {i + 1}. {criterion.title}
                </p>
                {criterion.description && (
                  <p className="text-sm text-gray-600 mt-1 leading-relaxed">
                    {criterion.description}
                  </p>
                )}
              </div>
            ))}
          </div>
        </ScrollArea>
      </DialogContent>
    </Dialog>
  );
}

// ── Main section ───────────────────────────────────────────────────────────
interface StartEvaluationSectionProps {
  templates: Template[];
  onStart: (selections: { jobTitle: string; template: Template }[], cycle: string) => void;
}

export function StartEvaluationSection({ templates, onStart }: StartEvaluationSectionProps) {
  const [cycle, setCycle] = useState("");
  const [previewTemplate, setPreviewTemplate] = useState<Template | null>(null);
  const [previewOpen, setPreviewOpen] = useState(false);

  // Always show all canonical job titles; dropdowns are empty when no templates exist yet.
  const jobsWithTemplates = JOB_TITLES;

  // Templates grouped by job title, each sorted highest id first.
  const templatesByJob = useMemo(() => {
    const map: Record<string, Template[]> = {};
    for (const job of jobsWithTemplates) {
      map[job] = templates
        .filter((t) => t.jobTitle === job)
        .sort((a, b) => Number(b.id) - Number(a.id));
    }
    return map;
  }, [templates, jobsWithTemplates]);

  // Selected template id per job — default to the highest-id template for each job.
  const [selectedIds, setSelectedIds] = useState<Record<string, string>>(() => {
    const defaults: Record<string, string> = {};
    for (const job of JOB_TITLES) {
      const sorted = templates
        .filter((t) => t.jobTitle === job)
        .sort((a, b) => Number(b.id) - Number(a.id));
      if (sorted[0]) defaults[job] = sorted[0].id;
    }
    return defaults;
  });

  const getTemplate = (id: string) => templates.find((t) => t.id === id) ?? null;

  const handleSelect = (job: string, id: string) =>
    setSelectedIds((prev) => ({ ...prev, [job]: id }));

  const handleViewTemplate = (job: string) => {
    const t = getTemplate(selectedIds[job]);
    if (t) { setPreviewTemplate(t); setPreviewOpen(true); }
  };

  const isSubmittable =
    cycle !== "" &&
    JOB_TITLES
      .filter((job) => (templatesByJob[job]?.length ?? 0) > 0)
      .every((job) => !!selectedIds[job]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!isSubmittable) return;
    const selections = jobsWithTemplates.map((job) => ({
      jobTitle: job,
      template: getTemplate(selectedIds[job])!,
    }));
    onStart(selections, cycle);
    alert(`Evaluation started for cycle: ${cycle}`);
  };

  return (
    <div className="p-8">
      <div className="max-w-2xl mx-auto">
        <div className="mb-8">
          <h2 className="text-2xl font-bold text-gray-900">Start Evaluation</h2>
          <p className="text-gray-600 mt-1">
            Select evaluation form for each job to start evaluation
          </p>
        </div>

        <div className="bg-white rounded-lg border p-8">
          <form onSubmit={handleSubmit} className="space-y-6">

            {/* Evaluation Cycle */}
            <div className="space-y-2">
              <Label>Evaluation Cycle</Label>
              <Select value={cycle} onValueChange={setCycle}>
                <SelectTrigger className="w-72">
                  <SelectValue placeholder="Select cycle" />
                </SelectTrigger>
                <SelectContent>
                  {EVALUATION_CYCLES.map((c) => (
                    <SelectItem key={c} value={c}>{c}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Per-job rows — only jobs that have at least one template */}
            <div className="space-y-5 pt-2">
              {jobsWithTemplates
                .filter((job) => (templatesByJob[job]?.length ?? 0) > 0)
                .map((job) => {
                const options = templatesByJob[job];
                const selectedId = selectedIds[job] ?? "";
                return (
                  <div key={job} className="space-y-1.5">
                    <Label className="text-gray-700">{job}</Label>
                    <div className="flex items-center gap-3">
                      <Select
                        value={selectedId}
                        onValueChange={(id) => handleSelect(job, id)}
                      >
                        <SelectTrigger className="w-72">
                          <SelectValue placeholder="Select template..." />
                        </SelectTrigger>
                        <SelectContent>
                          {options.map((t) => (
                            <SelectItem key={t.id} value={t.id}>
                              {t.name}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>

                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        disabled={!selectedId}
                        onClick={() => handleViewTemplate(job)}
                        className="shrink-0 gap-2"
                      >
                        <Eye className="w-4 h-4" />
                        View template
                      </Button>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Submit */}
            <div className="pt-6 flex justify-center">
              <Button
                type="submit"
                disabled={!isSubmittable}
                size="lg"
                className="px-12"
              >
                Start
              </Button>
            </div>
          </form>
        </div>
      </div>

      <TemplatePreviewDialog
        template={previewTemplate}
        open={previewOpen}
        onClose={() => setPreviewOpen(false)}
      />
    </div>
  );
}
