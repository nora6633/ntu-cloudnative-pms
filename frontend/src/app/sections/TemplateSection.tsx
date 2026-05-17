import { useEffect, useMemo, useState } from "react";
import { CheckCircle2, FileText, PencilLine, Plus, RefreshCw, Trash2 } from "lucide-react";
import {
  createTemplate,
  getAllJobs,
  getAllTemplateByJobId,
  updateTemplate,
  type CreateTemplateRequest,
  type CriterionDTO,
  type JobSummaryDTO,
  type TemplateDTO,
  type TemplateDTOEvaluationType,
  type UpdateTemplateRequest,
} from "../../api";
import { Alert, AlertDescription, AlertTitle } from "../components/ui/alert";
import { Badge } from "../components/ui/badge";
import { Button } from "../components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "../components/ui/card";
import { Input } from "../components/ui/input";
import { Label } from "../components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "../components/ui/select";
import { Textarea } from "../components/ui/textarea";

type FormCriterion = {
  id: string;
  title: string;
  description: string;
};

type FormErrors = {
  jobId?: string;
  name?: string;
  evaluationType?: string;
  criteria?: string;
};

const EVALUATION_TYPE_OPTIONS: { label: string; value: TemplateDTOEvaluationType }[] = [
  { label: "Annual", value: "ANNUAL" },
  { label: "Quarter", value: "QUARTER" },
  { label: "Probation", value: "PROBATION" },
];

function createCriterion(): FormCriterion {
  return {
    id: crypto.randomUUID(),
    title: "",
    description: "",
  };
}

function evaluationTypeLabel(type?: TemplateDTOEvaluationType) {
  return EVALUATION_TYPE_OPTIONS.find((option) => option.value === type)?.label ?? type ?? "Unknown";
}

function buildEmptyForm(jobId: number | null) {
  return {
    jobId,
    name: "",
    evaluationType: "" as "" | TemplateDTOEvaluationType,
    criteria: [createCriterion()],
  };
}

export function TemplateSection() {
  const [jobs, setJobs] = useState<JobSummaryDTO[]>([]);
  const [jobsLoading, setJobsLoading] = useState(true);
  const [jobsError, setJobsError] = useState("");
  const [templatesLoading, setTemplatesLoading] = useState(false);
  const [templatesError, setTemplatesError] = useState("");
  const [saving, setSaving] = useState(false);
  const [successMessage, setSuccessMessage] = useState("");
  const [selectedJobId, setSelectedJobId] = useState<number | null>(null);
  const [templates, setTemplates] = useState<TemplateDTO[]>([]);
  const [selectedTemplateId, setSelectedTemplateId] = useState<number | null>(null);
  const [formErrors, setFormErrors] = useState<FormErrors>({});
  const [form, setForm] = useState(() => buildEmptyForm(null));

  const isEditMode = selectedTemplateId !== null;

  const validationErrors = useMemo<FormErrors>(() => {
    const nextErrors: FormErrors = {};

    if (!form.jobId) nextErrors.jobId = "Please select a job.";
    if (!form.name.trim()) nextErrors.name = "Template name is required.";
    if (!form.evaluationType) nextErrors.evaluationType = "Evaluation type is required.";
    if (!form.criteria.some((criterion) => criterion.title.trim())) {
      nextErrors.criteria = "Add at least one criterion title.";
    }

    return nextErrors;
  }, [form]);

  const isSubmittable = Object.keys(validationErrors).length === 0;

  useEffect(() => {
    let cancelled = false;

    async function loadJobs() {
      setJobsLoading(true);
      setJobsError("");
      try {
        const response = await getAllJobs();
        if (cancelled) return;
        setJobs(response.data);
        setSelectedJobId(null);
        setForm(buildEmptyForm(null));
      } catch {
        if (!cancelled) {
          setJobsError("Failed to load jobs.");
        }
      } finally {
        if (!cancelled) {
          setJobsLoading(false);
        }
      }
    }

    loadJobs();
    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    if (!selectedJobId) {
      setTemplates([]);
      setTemplatesLoading(false);
      setTemplatesError("");
      return;
    }

    let cancelled = false;

    async function loadTemplates() {
      setTemplatesLoading(true);
      setTemplatesError("");
      try {
        const response = await getAllTemplateByJobId(selectedJobId);
        if (cancelled) return;
        setTemplates(response.data);
      } catch {
        if (!cancelled) {
          setTemplatesError("Failed to load templates for the selected job.");
          setTemplates([]);
        }
      } finally {
        if (!cancelled) {
          setTemplatesLoading(false);
        }
      }
    }

    loadTemplates();
    return () => {
      cancelled = true;
    };
  }, [selectedJobId]);

  const resetToCreateMode = (jobId = selectedJobId) => {
    setSelectedTemplateId(null);
    setForm(buildEmptyForm(jobId));
    setFormErrors({});
  };

  const syncJobSelection = (jobId: number) => {
    setSelectedJobId(jobId);
    setTemplates([]);
    setTemplatesError("");
    resetToCreateMode(jobId);
  };

  const hydrateFromTemplate = (template: TemplateDTO) => {
    const nextJobId = template.jobId ?? selectedJobId;
    setSelectedTemplateId(template.id ?? null);
    setSelectedJobId(nextJobId ?? null);
    setForm({
      jobId: nextJobId ?? null,
      name: template.name ?? "",
      evaluationType: template.evaluationType ?? "",
      criteria: (template.criteria?.length ? template.criteria : [{ title: "", description: "" }]).map((criterion) => ({
        id: crypto.randomUUID(),
        title: criterion.title ?? "",
        description: criterion.description ?? "",
      })),
    });
    setFormErrors({});
    setSuccessMessage("");
  };

  const handleCriterionChange = (
    criterionId: string,
    field: "title" | "description",
    value: string,
  ) => {
    setForm((current) => ({
      ...current,
      criteria: current.criteria.map((criterion) =>
        criterion.id === criterionId ? { ...criterion, [field]: value } : criterion,
      ),
    }));
  };

  const addCriterion = () => {
    setForm((current) => ({
      ...current,
      criteria: [...current.criteria, createCriterion()],
    }));
  };

  const removeCriterion = (criterionId: string) => {
    setForm((current) => ({
      ...current,
      criteria: current.criteria.length === 1
        ? current.criteria
        : current.criteria.filter((criterion) => criterion.id !== criterionId),
    }));
  };

  const refreshTemplates = async (jobId: number, focusTemplateId?: number | null) => {
    const response = await getAllTemplateByJobId(jobId);
    setTemplates(response.data);
    if (focusTemplateId !== undefined && focusTemplateId !== null) {
      const matchingTemplate = response.data.find((template) => template.id === focusTemplateId);
      if (matchingTemplate) {
        hydrateFromTemplate(matchingTemplate);
      }
    }
  };

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    setFormErrors(validationErrors);
    setSuccessMessage("");

    if (!isSubmittable || !form.jobId || !form.evaluationType) {
      return;
    }

    const criteria: CriterionDTO[] = form.criteria
      .filter((criterion) => criterion.title.trim())
      .map((criterion) => ({
        title: criterion.title.trim(),
        description: criterion.description.trim(),
      }));

    setSaving(true);
    try {
      if (selectedTemplateId) {
        const payload: UpdateTemplateRequest = {
          name: form.name.trim(),
          evaluationType: form.evaluationType,
          criteria,
        };
        const response = await updateTemplate(selectedTemplateId, payload);
        await refreshTemplates(form.jobId, response.data.id ?? selectedTemplateId);
        setSuccessMessage("Template updated successfully.");
      } else {
        const payload: CreateTemplateRequest = {
          jobId: form.jobId,
          name: form.name.trim(),
          evaluationType: form.evaluationType,
          criteria,
        };
        const response = await createTemplate(payload);
        await refreshTemplates(form.jobId, response.data.id ?? null);
        setSuccessMessage("Template published successfully.");
      }
      setFormErrors({});
    } catch (error) {
      const message = error instanceof Error ? error.message : "Unable to save template.";
      if (message.includes("already exists")) {
        setFormErrors((current) => ({
          ...current,
          name: "A template with this name already exists for the selected job.",
        }));
      } else {
        setTemplatesError(message);
      }
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="p-8">
      <div className="max-w-6xl mx-auto space-y-8">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Template</h2>
          <p className="text-gray-600 mt-1">Create and manage goal templates</p>
        </div>

        {successMessage && (
          <Alert className="border-green-200 bg-green-50 text-green-900">
            <CheckCircle2 className="h-4 w-4" />
            <AlertTitle>Saved</AlertTitle>
            <AlertDescription>{successMessage}</AlertDescription>
          </Alert>
        )}

        {(jobsError || templatesError) && (
          <Alert variant="destructive">
            <AlertTitle>Something went wrong</AlertTitle>
            <AlertDescription>{jobsError || templatesError}</AlertDescription>
          </Alert>
        )}

        <div className="grid gap-6 lg:grid-cols-[minmax(0,0.95fr)_minmax(0,1.35fr)]">
          <Card className="rounded-lg">
            <CardHeader className="border-b">
              <CardTitle>Templates</CardTitle>
              <CardDescription>Choose a job to browse or edit its templates.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-5 pt-6">
              <div className="space-y-2">
                <Label htmlFor="template-job-filter">Job Title</Label>
                <Select
                  value={selectedJobId ? String(selectedJobId) : ""}
                  onValueChange={(value) => syncJobSelection(Number(value))}
                  disabled={jobsLoading || jobs.length === 0}
                >
                  <SelectTrigger id="template-job-filter">
                    <SelectValue placeholder={jobsLoading ? "Loading jobs..." : "Select job title"} />
                  </SelectTrigger>
                  <SelectContent>
                    {jobs.map((job) => (
                      <SelectItem key={job.id} value={String(job.id)}>
                        {job.title}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="flex items-center justify-between">
                <p className="text-sm text-gray-600">
                  {!selectedJobId
                    ? "Select a job to view templates."
                    : templatesLoading
                      ? "Loading templates..."
                      : `${templates.length} template${templates.length === 1 ? "" : "s"}`}
                </p>
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={() => selectedJobId && refreshTemplates(selectedJobId, selectedTemplateId)}
                  disabled={!selectedJobId || templatesLoading}
                  className="gap-2"
                >
                  <RefreshCw className={`h-4 w-4 ${templatesLoading ? "animate-spin" : ""}`} />
                  Refresh
                </Button>
              </div>

              <div className="space-y-3">
                {templates.map((template) => {
                  const isSelected = template.id === selectedTemplateId;
                  return (
                    <button
                      key={template.id}
                      type="button"
                      onClick={() => hydrateFromTemplate(template)}
                      className={`w-full rounded-lg border px-4 py-4 text-left transition-colors ${
                        isSelected
                          ? "border-gray-900 bg-gray-50"
                          : "border-gray-200 bg-white hover:border-gray-300 hover:bg-gray-50"
                      }`}
                    >
                      <div className="flex items-start justify-between gap-3">
                        <div className="min-w-0">
                          <p className="font-semibold text-gray-900 truncate">{template.name ?? "Untitled Template"}</p>
                          <p className="mt-1 text-sm text-gray-500">
                            {(template.criteria?.length ?? 0)} criteria
                          </p>
                        </div>
                        <Badge variant="outline" className="shrink-0">
                          {evaluationTypeLabel(template.evaluationType)}
                        </Badge>
                      </div>
                    </button>
                  );
                })}

                {!selectedJobId && !templatesLoading && (
                  <div className="rounded-lg border border-dashed border-gray-200 bg-gray-50 px-6 py-10 text-center">
                    <FileText className="mx-auto h-10 w-10 text-gray-300" />
                    <p className="mt-4 font-medium text-gray-900">No job selected</p>
                    <p className="mt-1 text-sm text-gray-500">
                      Choose a job title above to load its templates.
                    </p>
                  </div>
                )}

                {selectedJobId && !templatesLoading && templates.length === 0 && (
                  <div className="rounded-lg border border-dashed border-gray-200 bg-gray-50 px-6 py-10 text-center">
                    <FileText className="mx-auto h-10 w-10 text-gray-300" />
                    <p className="mt-4 font-medium text-gray-900">No templates yet</p>
                    <p className="mt-1 text-sm text-gray-500">
                      Select a job and publish its first evaluation template.
                    </p>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          <Card className="rounded-lg">
            <CardHeader className="border-b">
              <CardTitle>{isEditMode ? "Edit Template" : "Create Template"}</CardTitle>
              <CardDescription>
                {isEditMode
                  ? "Update the selected template while keeping its job assignment."
                  : "Publish a new template for the selected job."}
              </CardDescription>
            </CardHeader>
            <CardContent className="pt-6">
              <form onSubmit={handleSubmit} className="space-y-6">
                <div className="space-y-2">
                  <Label htmlFor="template-job">Job Title</Label>
                  <Select
                    value={form.jobId ? String(form.jobId) : ""}
                    onValueChange={(value) => syncJobSelection(Number(value))}
                    disabled={jobsLoading || jobs.length === 0 || isEditMode}
                  >
                    <SelectTrigger id="template-job" aria-invalid={!!formErrors.jobId}>
                      <SelectValue placeholder="Select job title" />
                    </SelectTrigger>
                    <SelectContent>
                      {jobs.map((job) => (
                        <SelectItem key={job.id} value={String(job.id)}>
                          {job.title}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  {formErrors.jobId && <p className="text-sm text-red-600">{formErrors.jobId}</p>}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="template-name">Template Name</Label>
                  <Input
                    id="template-name"
                    placeholder="e.g. Engineering Annual Review"
                    value={form.name}
                    aria-invalid={!!formErrors.name}
                    onChange={(event) => {
                      const name = event.target.value;
                      setForm((current) => ({ ...current, name }));
                      if (formErrors.name) {
                        setFormErrors((current) => ({ ...current, name: undefined }));
                      }
                    }}
                  />
                  {formErrors.name && <p className="text-sm text-red-600">{formErrors.name}</p>}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="template-type">Evaluation Type</Label>
                  <Select
                    value={form.evaluationType}
                    onValueChange={(value) =>
                      setForm((current) => ({
                        ...current,
                        evaluationType: value as TemplateDTOEvaluationType,
                      }))
                    }
                  >
                    <SelectTrigger id="template-type" aria-invalid={!!formErrors.evaluationType}>
                      <SelectValue placeholder="Select evaluation type" />
                    </SelectTrigger>
                    <SelectContent>
                      {EVALUATION_TYPE_OPTIONS.map((option) => (
                        <SelectItem key={option.value} value={option.value}>
                          {option.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  {formErrors.evaluationType && (
                    <p className="text-sm text-red-600">{formErrors.evaluationType}</p>
                  )}
                </div>

                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <Label>Criteria</Label>
                      <p className="text-sm text-gray-500 mt-1">Define the ordered criteria used during review.</p>
                    </div>
                    <Button type="button" variant="outline" size="sm" onClick={addCriterion} className="gap-2">
                      <Plus className="h-4 w-4" />
                      Add Criterion
                    </Button>
                  </div>

                  <div className="space-y-4">
                    {form.criteria.map((criterion, index) => (
                      <div key={criterion.id} className="rounded-lg border border-gray-200 p-4">
                        <div className="mb-4 flex items-center justify-between gap-3">
                          <div className="flex items-center gap-2 text-sm font-medium text-gray-700">
                            <PencilLine className="h-4 w-4 text-gray-400" />
                            Criterion {index + 1}
                          </div>
                          <Button
                            type="button"
                            variant="ghost"
                            size="icon"
                            onClick={() => removeCriterion(criterion.id)}
                            disabled={form.criteria.length === 1}
                            aria-label={`Remove criterion ${index + 1}`}
                          >
                            <Trash2 className="h-4 w-4 text-gray-500" />
                          </Button>
                        </div>

                        <div className="space-y-4">
                          <div className="space-y-2">
                            <Label htmlFor={`criterion-title-${criterion.id}`}>Title</Label>
                            <Input
                              id={`criterion-title-${criterion.id}`}
                              placeholder="Enter criterion title"
                              value={criterion.title}
                              onChange={(event) =>
                                handleCriterionChange(criterion.id, "title", event.target.value)
                              }
                            />
                          </div>
                          <div className="space-y-2">
                            <Label htmlFor={`criterion-description-${criterion.id}`}>Description</Label>
                            <Textarea
                              id={`criterion-description-${criterion.id}`}
                              placeholder="Enter criterion description"
                              rows={3}
                              value={criterion.description}
                              onChange={(event) =>
                                handleCriterionChange(criterion.id, "description", event.target.value)
                              }
                            />
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                  {formErrors.criteria && <p className="text-sm text-red-600">{formErrors.criteria}</p>}
                </div>

                <div className="flex flex-col gap-3 border-t pt-6 sm:flex-row sm:justify-end">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => resetToCreateMode(form.jobId)}
                    disabled={saving}
                  >
                    Cancel
                  </Button>
                  <Button type="submit" disabled={!isSubmittable || saving}>
                    {saving ? "Saving..." : isEditMode ? "Save Changes" : "Publish"}
                  </Button>
                </div>
              </form>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
