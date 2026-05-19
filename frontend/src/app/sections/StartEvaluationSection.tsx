import { useState, useMemo, useEffect } from 'react';
import { Eye } from 'lucide-react';
import { Button } from '../components/ui/button';
import { Label } from '../components/ui/label';
import { Input } from '../components/ui/input';
import { ScrollArea } from '../components/ui/scroll-area';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '../components/ui/select';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '../components/ui/dialog';
import { NotificationDialog } from '../components/NotificationDialog';
import type { EvaluationCycleDTOEvaluationType } from '../../api/generated/orvalClient';
import { startEvaluationCycle, getAllJobsWithTemplates } from '../../api';
import type { JobTemplatesDTO, TemplateDTO } from '../../api';
//import responseData from '../data/response.json';

const MESSAGES = {
  startEvaluation:{
    successTitle: 'Start',
    successMsg: 'Evaluation cycle started successfully.',
    errorMsg: 'Failed to start evaluation. Please try again.',
  }
}

const EVALUATION_TYPES: { label: string; value: EvaluationCycleDTOEvaluationType }[] = [
  { label: 'Annual',    value: 'ANNUAL'    },
  { label: 'Quarter',   value: 'QUARTER'   },
];

// ── Template preview dialog ────────────────────────────────────────────────
function TemplatePreviewDialog({
  template,
  jobTitle,
  open,
  onClose,
}: {
  template: TemplateDTO | null;
  jobTitle: string;
  open: boolean;
  onClose: () => void;
}) {
  if (!template) return null;
  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[560px]">
        <DialogHeader>
          <DialogTitle>{jobTitle} · {template.evaluationType}</DialogTitle>
        </DialogHeader>
        <ScrollArea className="max-h-[60vh] pr-2">
          <div className="space-y-4 mt-2">
            {(template.criteria?.length ?? 0) === 0 ? (
              <p className="text-sm text-gray-500 text-center py-4">
                No evaluation criteria available for this cycle yet.
              </p>
            ) : (
              <div className="space-y-4">
                {template.criteria?.map((item, idx) => (
                  <div key={idx} className="border rounded-lg p-4 bg-gray-50">
                    <h4 className="font-semibold text-gray-900 mb-2">{item.title}</h4>
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

// ── Main section ───────────────────────────────────────────────────────────
export function StartEvaluationSection() {
  const [jobTemplates, setJobTemplates] = useState<JobTemplatesDTO[]>([]);
  const [cycleName, setCycleName]       = useState('');
  const [evalType, setEvalType]         = useState<EvaluationCycleDTOEvaluationType | null>(null);
  const [previewTemplate, setPreview]   = useState<TemplateDTO | null>(null);
  const [previewJobTitle, setPreviewJobTitle] = useState('');
  const [previewOpen, setPreviewOpen]   = useState(false);
  const [selectedIds, setSelectedIds]   = useState<Record<number, string>>({});
  const [submitting, setSubmitting]     = useState(false);
  const [loading, setLoading]         = useState(true);
  const [error, setError]             = useState<string | null>(null);

  const [notificationOpen, setNotificationOpen] = useState(false);
  const [notificationTitle, setNotificationTitle] = useState('');
  const [notificationMessage, setNotificationMessage] = useState('');
  const [notificationType, setNotificationType] = useState<'success'|'error'>('success');

  const showNotification = (title: string, message: string, type: 'success' | 'error') => {
    setNotificationTitle(title);
    setNotificationMessage(message);
    setNotificationType(type);
    setNotificationOpen(true);
  };


  useEffect(() => {
    let mounted = true;

    async function loadJobs() {
      setLoading(true);
      setError(null);
      try {
        if (!mounted) return;
        const response = await getAllJobsWithTemplates();
        const jobs = response.data ?? [];
        //const jobs = responseData as JobTemplatesDTO[];
        
        setJobTemplates(jobs);

        const defaults: Record<number, string> = {};
        jobs.forEach((job) => {
          const templates = (job.templates ?? []).slice().sort(
            (a, b) => Number(b.id ?? 0) - Number(a.id ?? 0),
          );
          if (job.id != null && templates[0]?.id != null) {
            defaults[job.id] = String(templates[0].id);
          }
        });

        setSelectedIds(defaults);
      } catch (error) {
        console.error(error);
        setError('Failed to load page. Please try again.');
      } finally {
        setLoading(false);
      }
    }

    loadJobs();
    return () => {
      mounted = false;
    };
  }, []);
  
  const visibleTemplates = (templates: TemplateDTO[] | undefined) =>
    (templates ?? []).filter((t) => t.evaluationType !== 'PROBATION');

  const templatesByJob = useMemo(() => {
    const map: Record<number, TemplateDTO[]> = {};
    for (const job of jobTemplates) {
      map[job.id ?? 0] = visibleTemplates(job.templates)
        .slice()
        .sort((a, b) => Number(b.id ?? 0) - Number(a.id ?? 0));
    }
    return map;
  }, [jobTemplates]);

  // Ensure selectedIds stay valid when evaluation type or available templates change.
  useEffect(() => {
    if (!jobTemplates?.length) return;
    setSelectedIds((prev) => {
      const next = { ...prev } as Record<number, string>;
      for (const job of jobTemplates) {
        const jobId = job.id;
        if (jobId == null) continue;
        const opts = visibleTemplates(job.templates)
          .slice()
          .sort((a, b) => Number(b.id ?? 0) - Number(a.id ?? 0))
          .filter((t) => evalType == null || t.evaluationType === evalType);
        if (opts[0]?.id != null) {
          const idStr = String(opts[0].id);
          if (next[jobId] !== idStr) next[jobId] = idStr;
        } else {
          // remove selection if no matching templates
          if (jobId in next) delete next[jobId];
        }
      }
      return next;
    });
  }, [jobTemplates, evalType]);

  const getTemplate = (id: string) =>
    jobTemplates
      .flatMap((job) => job.templates ?? [])
      .find((t) => String(t.id) === id) ?? null;

  const jobsWithTemplates = jobTemplates.filter(
    (job) => (job.templates?.length ?? 0) > 0,
  );

  const isSubmittable =
    cycleName.trim() !== '' &&
    evalType !== null &&
    jobsWithTemplates.every((job) => job.id != null && !!selectedIds[job.id]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!isSubmittable || evalType === null) return;

    const jobToTemplateIdMap: Record<string, number> = {};
    for (const job of jobsWithTemplates) {
      if (job.id == null) continue;
      const selectedId = selectedIds[job.id];
      if (selectedId) {
        jobToTemplateIdMap[String(job.id)] = Number(selectedId);
      }
    }

    setSubmitting(true);
    try {
      await startEvaluationCycle({
        cycleName: cycleName.trim(),
        evaluationType: evalType,
        jobToTemplateIdMap: jobToTemplateIdMap,
      });
      showNotification(MESSAGES.startEvaluation.successTitle, MESSAGES.startEvaluation.successMsg, 'success')
      setCycleName('');
      setEvalType(null)
    } catch (error) {
      console.log(error);
      showNotification('Error', MESSAGES.startEvaluation.errorMsg, 'error');
    } finally {
      setSubmitting(false);
    }
  };
  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <p className="text-gray-500">Loading…</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <p className="text-red-500">{error}</p>
      </div>
    );
  }
  return (
    <div className="p-8">
      <div className="max-w-2xl mx-auto">
        <div className="mb-8">
          <h2 className="text-2xl font-bold text-gray-900">Start Evaluation</h2>
          <p className="text-gray-600 mt-1">
            Configure and launch a new evaluation cycle for all employees
          </p>
        </div>

        <div className="bg-white rounded-lg border p-8">
          <form onSubmit={handleSubmit} className="space-y-6">

            {/* Cycle name */}
            <div className="space-y-2">
              <Label htmlFor="cycleName">Cycle Name</Label>
              <Input
                id="cycleName"
                placeholder="e.g. 2026"
                value={cycleName}
                onChange={(e) => setCycleName(e.target.value)}
                required
              />
            </div>

            {/* Evaluation type */}
            <div className="space-y-2">
              <Label>Evaluation Type</Label>
              <Select
                value={evalType ?? ''}
                onValueChange={(v) => setEvalType(v as EvaluationCycleDTOEvaluationType)}
              >
                <SelectTrigger className="w-72">
                  <SelectValue placeholder="Select type" />
                </SelectTrigger>
                <SelectContent>
                  {EVALUATION_TYPES.map((t) => (
                    <SelectItem key={t.value} value={t.value}>{t.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Per-job template selection */}
            <div className="space-y-5 pt-2">
              {jobsWithTemplates.map((job) => {
                const options = (templatesByJob[job.id ?? 0] ?? []).filter((t) =>
                  evalType == null ? true : t.evaluationType === evalType,
                );
                const selectedId = job.id != null ? selectedIds[job.id] ?? '' : '';
                return (
                  <div key={job.id ?? job.title} className="space-y-1.5">
                    <Label className="text-gray-700">{job.title}</Label>
                    <div className="flex items-center gap-3">
                      <Select
                        value={selectedId}
                        onValueChange={(id) => {
                          const jobId = job.id;
                          if (jobId != null) {
                            setSelectedIds((prev) => ({ ...prev, [jobId]: id }));
                          }
                        }}
                      >
                        <SelectTrigger className="w-72">
                          <SelectValue placeholder="Select template…" />
                        </SelectTrigger>
                        <SelectContent>
                          {options.map((t) => (
                            <SelectItem key={t.id ?? String(t.evaluationType)} value={String(t.id)}>
                              {t.evaluationType ? `${t.evaluationType} #${t.id}` : `Template #${t.id}`}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>

                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        disabled={!selectedId}
                        onClick={() => {
                          const t = getTemplate(selectedId);
                          if (t) {
                            setPreview(t);
                            setPreviewJobTitle(job.title ?? 'Unknown');
                            setPreviewOpen(true);
                          }
                        }}
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

            <div className="pt-6 flex justify-center">
              <Button
                type="submit"
                disabled={!isSubmittable || submitting}
                size="lg"
                className="px-12"
              >
                {submitting ? 'Starting…' : 'Start'}
              </Button>
            </div>
          </form>
        </div>
      </div>

      <TemplatePreviewDialog
        template={previewTemplate}
        jobTitle={previewJobTitle}
        open={previewOpen}
        onClose={() => setPreviewOpen(false)}
      />

      <NotificationDialog
        open={notificationOpen}
        onOpenChange={setNotificationOpen}
        type={notificationType}
        title={notificationTitle}
        message={notificationMessage}
        onConfirm={()=>{}}
      />
    </div>
  );
}
