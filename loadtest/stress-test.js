// k6 STRESS TEST — gradually push the system past its comfort zone to find the
// breaking point (capacity ceiling). Each VU logs in once, then loops a light
// auth-check endpoint and a heavier DB-backed list endpoint.
//
// Usage:
//   set -a; source loadtest/.env; set +a
//   k6 run loadtest/stress-test.js
//
// Env overrides:
//   BASE_URL   — defaults to the Railway production frontend
//   PMS_USER   — required (employee-level account; never use admin/HR)
//   PMS_PASS   — required

import http from 'k6/http';
import { check, fail, sleep } from 'k6';
import { Trend } from 'k6/metrics';
import { textSummary } from 'https://jslib.k6.io/k6-summary/0.0.2/index.js';

const BASE_URL = __ENV.BASE_URL || 'https://pms-frontend-production-f2a8.up.railway.app';
const USER = __ENV.PMS_USER || 'employee';
const PASS = __ENV.PMS_PASS || 'employee123';

const meTrend = new Trend('endpoint_me_duration', true);
const myEvalsTrend = new Trend('endpoint_my_evaluations_duration', true);

// Stress profile: stepwise ramp so we can read p95 at each plateau and see
// where latency / error rate breaks down. Total ≈ 2 minutes (short run).
export const options = {
  stages: [
    { duration: '300s', target: 1000 },   // warm up
    //{ duration: '20s', target: 50 },   // light load
    //{ duration: '20s', target: 100 },   // moderate
    //{ duration: '20s', target: 200 },  // heavy
    //{ duration: '20s', target: 400 },  // stress — expect degradation here
  ],
  thresholds: {
    endpoint_me_duration: ['p(95)<2000'],
    endpoint_my_evaluations_duration: ['p(95)<2500'],
    http_req_failed: ['rate<0.05'],
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

  // Small think time — keeps the test from being a pure busy loop and gives
  // a more realistic request pattern.
  sleep(1);
}

export function handleSummary(data) {
  return {
    stdout: textSummary(data, { indent: ' ', enableColors: true }),
    'loadtest/summary.json': JSON.stringify(data, null, 2),
  };
}
