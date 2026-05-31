// Same probe, but with noCookiesReset: true to see if it's the iteration boundary.
import http from 'k6/http';

const BASE_URL = __ENV.BASE_URL || 'https://pms-frontend-production-f2a8.up.railway.app';
const USER = __ENV.PMS_USER || 'employee';
const PASS = __ENV.PMS_PASS || 'employee123';

export const options = {
  vus: 1,
  iterations: 5,
  noCookiesReset: true,
};

let loggedIn = false;

export default function () {
  if (!loggedIn) {
    const r = http.post(`${BASE_URL}/api/auth/login`,
      JSON.stringify({ username: USER, password: PASS }),
      { headers: { 'Content-Type': 'application/json' } });
    console.log(`LOGIN status=${r.status}`);
    loggedIn = true;
  }

  const jar = http.cookieJar();
  const cookies = jar.cookiesForURL(`${BASE_URL}/api/auth/me`);
  const cookieNames = Object.keys(cookies).join(',') || '(empty)';

  const r = http.get(`${BASE_URL}/api/auth/me`);
  console.log(`/me status=${r.status} jar_before=[${cookieNames}]`);
}
