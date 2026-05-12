import {
  getGetMyEvaluationsUrl,
  getGetEvaluationsForManagerUrl,
  getGetEvaluationsForHrUrl,
  getStartEvaluationCycleUrl,
  getDraftGoalsUrl,
  getSubmitForGoalApprovalUrl,
  getApproveGoalsUrl,
  getRejectGoalsUrl,
  getSubmitForProgressReviewUrl,
  getDraftReviewUrl,
  getSubmitReviewUrl,
  getApproveReviewUrl,
  getRejectReviewUrl,
  getApproveEvaluationUrl,
  getRejectEvaluationUrl,
  getLoginUrl,
  getLogoutUrl,
  getMeUrl,
  getRegistrationUrl,
  getAddProgressUrl,
  getGetAllTemplateByJobIdUrl,
  getGetAllJobsUrl,
  getGetAllJobsWithTemplatesUrl,
  getGetAuditLogsUrl,
  getGetModulesUrl,
  getAdminOnlyUrl,
  type GetMyEvaluationsParams,
  type GetEvaluationsForManagerParams,
  type GetEvaluationsForHrParams,
  type GetAuditLogsParams,
  type SliceEvaluationDTO,
  type GoalDTO,
  type EvaluationItemDTO,
  type EvaluationCycleDTO,
  type UserResponse,
  type LoginRequest,
  type UserDTO,
  type CreateProgressDTO,
  type TemplateDTO,
  type JobSummaryDTO,
  type JobTemplatesDTO,
  type PageAuditLogDTO,
  type AdminOnly200,
} from './generated/orvalClient';

export type {
  EvaluationDTO,
  EvaluationDTOStatus,
  EvaluationDTOType,
  GoalDTO,
  ProgressDTO,
  EvaluationItemDTO,
  EvaluationCycleDTO,
  SliceEvaluationDTO,
  UserResponse,
  LoginRequest,
  UserDTO,
  CreateProgressDTO,
  TemplateDTO,
  JobSummaryDTO,
  JobTemplatesDTO,
  PageAuditLogDTO,
  AdminOnly200,
  AuditLogDTOActionType,
} from './generated/orvalClient';


const baseUrl = () => (import.meta.env.VITE_API_URL as string) ?? '';

async function apiFetch<T>(
  url: string,
  init?: RequestInit,
): Promise<{ status: number; data: T }> {
  const res = await fetch(baseUrl() + url, {
    credentials: 'include',
    headers: { 'Content-Type': 'application/json', ...(init?.headers ?? {}) },
    ...init,
  });

  const contentType = res.headers.get('content-type');
  let data: T;

  if (!res.ok) {
    let errorMessage = `API Error: ${res.status}`;
    if (contentType?.includes('application/json')) {
      try {
        const errorBody = await res.json();
        errorMessage = errorBody.detail || errorBody.message || errorMessage;
      } catch {
        const errorText = await res.text();
        errorMessage = errorText || errorMessage;
      }
    } else {
      const errorText = await res.text();
      errorMessage = errorText || errorMessage;
    }
    throw new Error(errorMessage);
  }

  if (contentType?.includes('application/json')) {
    data = (await res.json()) as T;
  } else {
    data = (await res.text()) as T;
  }

  return { status: res.status, data };
}

export const me = () => apiFetch<UserResponse>(getMeUrl());

export const login = (body: LoginRequest) =>
  apiFetch<UserResponse>(getLoginUrl(), { method: 'POST', body: JSON.stringify(body) });

export const logout = () => apiFetch<void>(getLogoutUrl(), { method: 'POST' });

export const registration = (body: UserDTO) =>
  apiFetch<UserDTO>(getRegistrationUrl(), { method: 'POST', body: JSON.stringify(body) });

export const getMyEvaluations = (params: GetMyEvaluationsParams) =>
  apiFetch<SliceEvaluationDTO>(getGetMyEvaluationsUrl(params));

export const getEvaluationsForManager = (params: GetEvaluationsForManagerParams) =>
  apiFetch<SliceEvaluationDTO>(getGetEvaluationsForManagerUrl(params));

export const getEvaluationsForHr = (params: GetEvaluationsForHrParams) =>
  apiFetch<SliceEvaluationDTO>(getGetEvaluationsForHrUrl(params));

export const startEvaluationCycle = (body: EvaluationCycleDTO) =>
  apiFetch<string>(getStartEvaluationCycleUrl(), {
    method: 'POST',
    body: JSON.stringify(body),
  });

export const draftGoals = (id: number, goals: GoalDTO[]) =>
  apiFetch<string>(getDraftGoalsUrl(id), { method: 'POST', body: JSON.stringify(goals) });

export const submitForGoalApproval = (id: number) =>
  apiFetch<string>(getSubmitForGoalApprovalUrl(id), { method: 'POST' });

export const approveGoals = (id: number) =>
  apiFetch<string>(getApproveGoalsUrl(id), { method: 'POST' });

export const rejectGoals = (id: number) =>
  apiFetch<string>(getRejectGoalsUrl(id), { method: 'POST' });

export const submitForProgressReview = (id: number) =>
  apiFetch<string>(getSubmitForProgressReviewUrl(id), { method: 'POST' });

export const addProgress = (id: number, body: CreateProgressDTO) =>
  apiFetch<GoalDTO>(getAddProgressUrl(id), { method: 'POST', body: JSON.stringify(body) });

export const draftReview = (id: number, items: EvaluationItemDTO[]) =>
  apiFetch<string>(getDraftReviewUrl(id), { method: 'POST', body: JSON.stringify(items) });

export const submitReview = (id: number) =>
  apiFetch<string>(getSubmitReviewUrl(id), { method: 'POST' });

export const approveReview = (id: number) =>
  apiFetch<string>(getApproveReviewUrl(id), { method: 'POST' });

export const rejectReview = (id: number) =>
  apiFetch<string>(getRejectReviewUrl(id), { method: 'POST' });

export const approveEvaluation = (id: number) =>
  apiFetch<string>(getApproveEvaluationUrl(id), { method: 'POST' });

export const rejectEvaluation = (id: number) =>
  apiFetch<string>(getRejectEvaluationUrl(id), { method: 'POST' });

export const getAllTemplateByJobId = (jobId: number) =>
  apiFetch<TemplateDTO[]>(getGetAllTemplateByJobIdUrl(jobId));

export const getAllJobs = () =>
  apiFetch<JobSummaryDTO[]>(getGetAllJobsUrl());

export const getAllJobsWithTemplates = () =>
  apiFetch<JobTemplatesDTO[]>(getGetAllJobsWithTemplatesUrl());

export const getAuditLogs = (params: GetAuditLogsParams) =>
  apiFetch<PageAuditLogDTO>(getGetAuditLogsUrl(params));

export const getModules = () =>
  apiFetch<string[]>(getGetModulesUrl());

export const adminOnly = () =>
  apiFetch<AdminOnly200>(getAdminOnlyUrl());