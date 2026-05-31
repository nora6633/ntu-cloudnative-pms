// k6 stress test for PMS — login once per VU (cookie reuse), then hammer two read endpoints.
//
// SAFE TO LOAD — `k6 inspect` only runs the init context (imports + options).
// The default function (which fires requests) only runs under `k6 run`.

import http from 'k6/http';
import { check, fail } from 'k6';
import { Trend } from 'k6/metrics';
import { textSummary } from 'https://jslib.k6.io/k6-summary/0.0.2/index.js';

// ── Config (env-overridable so we never commit real creds) ──────────────────
const BASE_URL = __ENV.BASE_URL || 'http://localhost:8080';
const USER = __ENV.PMS_USER || 'employee';
const PASS = __ENV.PMS_PASS || 'employee123';

// ── Per-endpoint Trends — populated explicitly so report.js can read by name
const meTrend = new Trend('endpoint_me_duration', true);
const myEvalsTrend = new Trend('endpoint_my_evaluations_duration', true);

// ── Options ─────────────────────────────────────────────────────────────────
// Modest staged ramp. Adjust after team agrees on metrics.
export const options = {
  stages: [
    { duration: '30s', target: 5 },
    { duration: '1m', target: 10 },
    { duration: '30s', target: 0 },
  ],
  thresholds: {
    endpoint_me_duration: ['p(95)<2000'],
    endpoint_my_evaluations_duration: ['p(95)<2000'],
    http_req_failed: ['rate<0.05'],
  },
  // Keep cookie jar per VU (k6 default) so login cookie persists across iterations.
};

// ── Per-VU state ────────────────────────────────────────────────────────────
let loggedIn = false;

function login() {
  const res = http.post(
    `${BASE_URL}/api/auth/login`,
    JSON.stringify({ username: USER, password: PASS }),
    {
      headers: { 'Content-Type': 'application/json' },
      tags: { endpoint: 'login' },
    },
  );
  const ok = check(res, {
    'login 200': (r) => r.status === 200,
    'login Set-Cookie present': (r) => !!r.headers['Set-Cookie'],
  });
  if (!ok) {
    fail(`login failed: status=${res.status} body=${res.body && res.body.slice(0, 200)}`);
  }
}

// ── Main loop (only runs under `k6 run`, NOT under `k6 inspect`) ────────────
export default function () {
  if (!loggedIn) {
    login();
    loggedIn = true;
  }

  const meRes = http.get(`${BASE_URL}/api/auth/me`, { tags: { endpoint: 'me' } });
  meTrend.add(meRes.timings.duration);
  check(meRes, { 'me 200': (r) => r.status === 200 });

  const evalRes = http.get(`${BASE_URL}/api/evaluations/my-evaluations`, {
    tags: { endpoint: 'my-evaluations' },
  });
  myEvalsTrend.add(evalRes.timings.duration);
  check(evalRes, { 'my-evaluations 200': (r) => r.status === 200 });
}

// ── Summary output ──────────────────────────────────────────────────────────
export function handleSummary(data) {
  return {
    stdout: textSummary(data, { indent: ' ', enableColors: true }),
    'loadtest/summary.json': JSON.stringify(data, null, 2),
  };
}
