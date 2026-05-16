import { useState, useEffect } from 'react';
import { UserPlus, Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '../components/ui/select';
import { Checkbox } from '../components/ui/checkbox';
import {
  registration,
  getAllJobs,
  getDepartments,
  getSupervisors,
  getAllTemplateByJobId,
  type UserDTO,
  type JobSummaryDTO,
  type DepartmentDTO,
  type UserSummaryDTO,
  type TemplateDTO,
} from '../../api';

type RoleValue = 'ADMIN' | 'EMPLOYEE' | 'MANAGER' | 'HR';

const ROLES: { value: RoleValue; label: string }[] = [
  { value: 'ADMIN', label: 'Admin' },
  { value: 'EMPLOYEE', label: 'Employee' },
  { value: 'MANAGER', label: 'Manager' },
  { value: 'HR', label: 'HR' },
];

const INITIAL_FORM = {
  username: '',
  password: '',
  role: 'EMPLOYEE' as RoleValue,
  jobId: 0,
  departmentId: 0,
  supervisorId: undefined as number | undefined,
  overseenDepartmentId: undefined as number | undefined,
  requireProbation: false,
  probationTemplateId: undefined as number | undefined,
};

export function RegisterSection() {
  const [form, setForm] = useState(INITIAL_FORM);
  const [jobs, setJobs] = useState<JobSummaryDTO[]>([]);
  const [departments, setDepartments] = useState<DepartmentDTO[]>([]);
  const [supervisors, setSupervisors] = useState<UserSummaryDTO[]>([]);
  const [probationTemplates, setProbationTemplates] = useState<TemplateDTO[]>([]);
  const [submitting, setSubmitting] = useState(false);

  // Fetch static lookup data on mount
  useEffect(() => {
    const controller = new AbortController();
    
    getAllJobs({ signal: controller.signal })
      .then((r) => setJobs(r.data ?? []))
      .catch((err) => {
        if (err.name !== 'AbortError') toast.error('Failed to load jobs list.');
      });
      
    getDepartments({ signal: controller.signal })
      .then((r) => setDepartments(r.data ?? []))
      .catch((err) => {
        if (err.name !== 'AbortError') toast.error('Failed to load departments.');
      });
      
    getSupervisors({ signal: controller.signal })
      .then((r) => setSupervisors(r.data ?? []))
      .catch((err) => {
        if (err.name !== 'AbortError') toast.error('Failed to load supervisors list.');
      });

    return () => controller.abort();
  }, []);

  // Fetch probation templates when job changes and probation is toggled
  useEffect(() => {
    const controller = new AbortController();

    if (form.requireProbation && form.jobId) {
      getAllTemplateByJobId(form.jobId, { signal: controller.signal })
        .then((r) => {
          const probation = (r.data ?? []).filter(
            (t) => t.evaluationType === 'PROBATION',
          );
          setProbationTemplates(probation);
        })
        .catch((err) => {
          if (err.name !== 'AbortError') {
            setProbationTemplates([]);
            toast.error('Failed to load probation templates.');
          }
        });
    } else {
      setProbationTemplates([]);
    }

    return () => controller.abort();
  }, [form.requireProbation, form.jobId]);

  const set = <K extends keyof typeof form>(key: K, value: (typeof form)[K]) =>
    setForm((prev) => ({ ...prev, [key]: value }));

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);

    // Build the payload, omitting zero IDs and undefined optional fields
    const payload: UserDTO = {
      username: form.username,
      password: form.password,
      role: form.role,
      jobId: form.jobId,
      departmentId: form.departmentId,
      ...(form.supervisorId ? { supervisorId: form.supervisorId } : {}),
      ...(form.overseenDepartmentId ? { overseenDepartmentId: form.overseenDepartmentId } : {}),
      ...(form.requireProbation ? { requireProbation: true, probationTemplateId: form.probationTemplateId } : {}),
    };

    try {
      await registration(payload);
      toast.success(`Account "${form.username}" registered successfully!`);
      setForm(INITIAL_FORM);
    } catch (err: unknown) {
      const errorMessage = err instanceof Error ? err.message : 'Registration failed. Please try again.';
      toast.error(errorMessage);
    } finally {
      setSubmitting(false);
    }
  };

  const isEmployee = form.role === 'EMPLOYEE';
  const isHr = form.role === 'HR';
  
  // Show supervisor for everyone except ADMIN by default (since Managers/HR report to others)
  // or if probation is required (as a supervisor must evaluate probation)
  const needsSupervisor = form.role !== 'ADMIN' || form.requireProbation;

  // Validation logic:
  // - Basic fields: username, password(8+), jobId, departmentId
  // - Role specific: EMPLOYEE always needs supervisor, HR needs overseen dept
  // - Probation: Needs BOTH template and supervisor (to do the evaluation)
  const canSubmit =
    form.username.trim().length > 0 &&
    form.password.trim().length >= 8 &&
    form.jobId > 0 &&
    form.departmentId > 0 &&
    (!isEmployee || !!form.supervisorId) &&
    (!isHr || !!form.overseenDepartmentId) &&
    (!form.requireProbation || (!!form.probationTemplateId && !!form.supervisorId));


  return (
    <div className="p-8">
      <div className="max-w-2xl mx-auto">
        <div className="mb-8">
          <h2 className="text-2xl font-bold text-gray-900">Register New Account</h2>
          <p className="text-gray-600 mt-1">Add a new user account to the system</p>
        </div>

        <div className="bg-white rounded-lg border p-8">
          <form onSubmit={handleSubmit} className="space-y-5">

            {/* Username */}
            <div className="space-y-1.5">
              <Label htmlFor="reg-username">Username <span className="text-red-500">*</span></Label>
              <Input
                id="reg-username"
                placeholder="e.g. john.doe"
                value={form.username}
                onChange={(e) => set('username', e.target.value)}
                required
              />
            </div>

            {/* Password */}
            <div className="space-y-1.5">
              <Label htmlFor="reg-password">Password <span className="text-red-500">*</span></Label>
              <Input
                id="reg-password"
                type="password"
                placeholder="Min. 8 characters"
                value={form.password}
                onChange={(e) => set('password', e.target.value)}
                required
                minLength={8}
              />
            </div>

            {/* Role */}
            <div className="space-y-1.5">
              <Label>Role <span className="text-red-500">*</span></Label>
              <Select
                value={form.role}
                onValueChange={(v) => {
                  set('role', v as RoleValue);
                  set('supervisorId', undefined);
                  set('overseenDepartmentId', undefined);
                }}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select role" />
                </SelectTrigger>
                <SelectContent>
                  {ROLES.map((r) => (
                    <SelectItem key={r.value} value={r.value}>{r.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Job */}
            <div className="space-y-1.5">
              <Label>Job Title <span className="text-red-500">*</span></Label>
              <Select
                value={form.jobId ? String(form.jobId) : ''}
                onValueChange={(v) => set('jobId', Number(v))}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select job title" />
                </SelectTrigger>
                <SelectContent>
                  {jobs.map((j) => (
                    <SelectItem key={j.id} value={String(j.id)}>{j.title}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Department */}
            <div className="space-y-1.5">
              <Label>Department <span className="text-red-500">*</span></Label>
              <Select
                value={form.departmentId ? String(form.departmentId) : ''}
                onValueChange={(v) => set('departmentId', Number(v))}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select department" />
                </SelectTrigger>
                <SelectContent>
                  {departments.map((d) => (
                    <SelectItem key={d.id} value={String(d.id)}>{d.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Supervisor (EMPLOYEE required, HR optional) */}
            {needsSupervisor && (
              <div className="space-y-1.5">
                <Label>Supervisor {(isEmployee || form.requireProbation) && <span className="text-red-500">*</span>}</Label>
                <Select
                  value={form.supervisorId ? String(form.supervisorId) : ''}
                  onValueChange={(v) => set('supervisorId', Number(v))}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select supervisor" />
                  </SelectTrigger>
                  <SelectContent>
                    {supervisors.map((s) => (
                      <SelectItem key={s.id} value={String(s.id)}>
                        {s.username} ({s.role})
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}

            {/* Overseen Department (HR only) */}
            {isHr && (
              <div className="space-y-1.5">
                <Label>Overseen Department <span className="text-red-500">*</span></Label>
                <Select
                  value={form.overseenDepartmentId ? String(form.overseenDepartmentId) : ''}
                  onValueChange={(v) => set('overseenDepartmentId', Number(v))}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select overseen department" />
                  </SelectTrigger>
                  <SelectContent>
                    {departments.map((d) => (
                      <SelectItem key={d.id} value={String(d.id)}>{d.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}

            {/* Probation toggle */}
            <div className="flex items-center gap-3 pt-1">
              <Checkbox
                id="reg-probation"
                checked={!!form.requireProbation}
                onCheckedChange={(checked) => {
                  set('requireProbation', !!checked);
                  set('probationTemplateId', undefined);
                }}
              />
              <Label htmlFor="reg-probation" className="cursor-pointer font-normal">
                Requires probation evaluation
              </Label>
            </div>

            {/* Probation template */}
            {form.requireProbation && (
              <div className="space-y-1.5 pl-6 border-l-2 border-blue-100">
                <Label>Probation Template <span className="text-red-500">*</span></Label>
                {!form.jobId ? (
                  <p className="text-sm text-gray-500">Select a job title first to load available templates.</p>
                ) : probationTemplates.length === 0 ? (
                  <p className="text-sm text-gray-500">No probation templates found for this job.</p>
                ) : (
                  <Select
                    value={form.probationTemplateId ? String(form.probationTemplateId) : ''}
                    onValueChange={(v) => set('probationTemplateId', Number(v))}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select probation template" />
                    </SelectTrigger>
                    <SelectContent>
                      {probationTemplates.map((t) => (
                        <SelectItem key={t.id} value={String(t.id)}>
                          {t.evaluationType} — Template #{t.id}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                )}
              </div>
            )}

            <div className="pt-4 border-t">
              <Button
                type="submit"
                className="w-full"
                size="lg"
                disabled={!canSubmit || submitting}
              >
                {submitting
                  ? <><Loader2 className="w-4 h-4 mr-2 animate-spin" /> Registering…</>
                  : <><UserPlus className="w-4 h-4 mr-2" /> Register Account</>
                }
              </Button>
            </div>

          </form>
        </div>
      </div>
    </div>
  );
}
