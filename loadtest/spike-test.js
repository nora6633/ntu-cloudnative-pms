// k6 SPIKE TEST — sustain a small steady-state load, then slam a sudden burst
// of traffic onto the system and watch how it copes (and how fast it recovers).
//
// Unlike the stress test (which ramps slowly to find a ceiling), a spike test
// answers: "what happens when 200 users show up in 10 seconds?"
//
// Usage:
//   set -a; source loadtest/.env; set +a
//   k6 run loadtest/spike-test.js
//
// Env overrides:
//   BASE_URL   — defaults to the Railway production frontend
//   PMS_USER   — required (employee-level account)
//   PMS_PASS   — required

import http from 'k6/http';
import { check, fail } from 'k6';
import { Trend } from 'k6/metrics';
import { textSummary } from 'https://jslib.k6.io/k6-summary/0.0.2/index.js';

const BASE_URL = __ENV.BASE_URL || 'https://pms-frontend-production-f2a8.up.railway.app';
const USER = __ENV.PMS_USER || 'employee';
const PASS = __ENV.PMS_PASS || 'employee123';

const meTrend = new Trend('endpoint_me_duration', true);
const myEvalsTrend = new Trend('endpoint_my_evaluations_duration', true);

// Spike profile — short and sharp:
//   20s baseline at 5 VUs        → measure normal behavior
//   5s  ramp from 5 → 200 VUs    → the spike itself
//   30s hold at 200 VUs          → sustained spike (does it crash? queue? recover?)
//   5s  drop back to 5 VUs       → recovery
//   20s settle at 5 VUs          → measure post-spike latency
//   10s ramp down to 0           → graceful shutdown
//
// Total ≈ 1m 30s (short run).
export const options = {
  stages: [
    { duration: '20s', target: 5 },
    { duration: '5s', target: 200 },
    { duration: '30s', target: 200 },
    { duration: '5s', target: 5 },
    { duration: '20s', target: 5 },
    { duration: '10s', target: 0 },
  ],
  thresholds: {
    // Spike thresholds are looser than stress — we *expect* a temporary p95
    // bump during the burst. The real signal is whether the system recovers
    // and whether http_req_failed stays bounded.
    endpoint_me_duration: ['p(95)<5000'],
    endpoint_my_evaluations_duration: ['p(95)<8000'],
    http_req_failed: ['rate<0.10'],
  },
  // CRITICAL: k6 wipes the per-VU cookie jar at the start of each iteration
  // by default. Without this flag, only iteration 1 of each VU has the auth
  // cookie — every subsequent iteration's /api/* call gets a 401.
  noCookiesReset: true,
};

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

  // No sleep — during a spike we want VUs to fire as fast as the server
  // responds, so the burst actually pressures the system.
}

export function handleSummary(data) {
  return {
    stdout: textSummary(data, { indent: ' ', enableColors: true }),
    'loadtest/summary.json': JSON.stringify(data, null, 2),
  };
}
