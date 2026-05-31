// Tiny diagnostic — count status codes per endpoint under brief load.
// Goal: prove whether stress-test failures were 401 (cookie/auth issue) or
// 5xx (backend / nginx saturation).

import http from 'k6/http';
import { Counter } from 'k6/metrics';

const BASE_URL = __ENV.BASE_URL || 'https://pms-frontend-production-f2a8.up.railway.app';
const USER = __ENV.PMS_USER || 'employee';
const PASS = __ENV.PMS_PASS || 'employee123';

// Pre-declared counters (k6 only allows metric creation in init context).
const C = {
  login_2xx: new Counter('login_2xx'),
  login_401: new Counter('login_401'),
  login_5xx: new Counter('login_5xx'),
  login_other: new Counter('login_other'),
  me_2xx: new Counter('me_2xx'),
  me_401: new Counter('me_401'),
  me_5xx: new Counter('me_5xx'),
  me_other: new Counter('me_other'),
  eval_2xx: new Counter('eval_2xx'),
  eval_401: new Counter('eval_401'),
  eval_5xx: new Counter('eval_5xx'),
  eval_other: new Counter('eval_other'),
};

function bump(endpoint, status) {
  const bucket = status === 200 ? '2xx'
              : status === 401 ? '401'
              : status >= 500 ? '5xx'
              : 'other';
  C[`${endpoint}_${bucket}`].add(1);
}

export const options = {
  stages: [
    { duration: '10s', target: 50 },
    { duration: '30s', target: 150 },
    { duration: '5s', target: 0 },
  ],
};

let loggedIn = false;

export default function () {
  if (!loggedIn) {
    const r = http.post(`${BASE_URL}/api/auth/login`,
      JSON.stringify({ username: USER, password: PASS }),
      { headers: { 'Content-Type': 'application/json' } });
    bump('login', r.status);
    if (r.status !== 200) return;
    loggedIn = true;
  }

  const meRes = http.get(`${BASE_URL}/api/auth/me`);
  bump('me', meRes.status);

  const evalRes = http.get(`${BASE_URL}/api/evaluations/my-evaluations`);
  bump('eval', evalRes.status);
}
