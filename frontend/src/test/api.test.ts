import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import {
  ApiError,
  adminOnly,
  getAllJobs,
  login,
} from '../api';

describe('api error handling', () => {
  const originalFetch = global.fetch;
  const originalEnv = (window as Window & { __ENV__?: { VITE_API_URL?: string } }).__ENV__;

  beforeEach(() => {
    vi.restoreAllMocks();
    (window as Window & { __ENV__?: { VITE_API_URL?: string } }).__ENV__ = {
      VITE_API_URL: 'http://api.test',
    };
  });

  afterEach(() => {
    global.fetch = originalFetch;
    (window as Window & { __ENV__?: { VITE_API_URL?: string } }).__ENV__ = originalEnv;
  });

  it('maps unauthorized responses to a safe public message', async () => {
    global.fetch = vi.fn().mockResolvedValue(
      new Response(JSON.stringify({ detail: 'Invalid credentials' }), {
        status: 401,
        headers: { 'Content-Type': 'application/problem+json' },
      }),
    );

    await expect(login({ username: 'demo', password: 'bad-password' })).rejects.toMatchObject({
      name: 'ApiError',
      kind: 'http',
      status: 401,
      message: 'Authentication failed.',
    } satisfies Partial<ApiError>);
  });

  it('maps conflict responses to a safe public message even when backend includes raw detail', async () => {
    global.fetch = vi.fn().mockResolvedValue(
      new Response(JSON.stringify({ detail: "Template with name 'Annual 2025' already exists" }), {
        status: 409,
        headers: { 'Content-Type': 'application/problem+json' },
      }),
    );

    await expect(adminOnly()).rejects.toMatchObject({
      name: 'ApiError',
      kind: 'http',
      status: 409,
      message: 'The request conflicts with existing data.',
    } satisfies Partial<ApiError>);
  });

  it('preserves validation errors metadata without exposing raw detail as the main message', async () => {
    global.fetch = vi.fn().mockResolvedValue(
      new Response(JSON.stringify({
        detail: 'jobId: Job ID not found: 99',
        errors: ['jobId: must be a valid job'],
      }), {
        status: 400,
        headers: { 'Content-Type': 'application/problem+json' },
      }),
    );

    await expect(getAllJobs()).rejects.toMatchObject({
      name: 'ApiError',
      kind: 'http',
      status: 400,
      message: 'The request could not be completed. Please review your input and try again.',
      errors: ['jobId: must be a valid job'],
    } satisfies Partial<ApiError>);
  });

  it('maps fetch failures to a generic network error', async () => {
    global.fetch = vi.fn().mockRejectedValue(new TypeError('Failed to fetch'));

    await expect(getAllJobs()).rejects.toMatchObject({
      name: 'ApiError',
      kind: 'network',
      message: 'Network error. Please try again later.',
    } satisfies Partial<ApiError>);
  });
});
