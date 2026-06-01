# Load test metrics — for team review

Stress test on the PMS frontend (Railway-hosted nginx → backend internal network → Spring Boot).
We hit two authenticated read endpoints repeatedly under a modest staged ramp; goal is to
measure response time and error rate under concurrent load, not to overload prod.

## What we collect (k6 → summary.json)

| Metric | Source | Purpose |
|---|---|---|
| `endpoint_me_duration` (Trend) | manual `.add()` in `script.js` | Per-endpoint p50/p95/p99 latency for `GET /api/auth/me` |
| `endpoint_my_evaluations_duration` (Trend) | manual `.add()` in `script.js` | Per-endpoint p50/p95/p99 latency for `GET /api/evaluations/my-evaluations` |
| `http_req_failed` (Rate) | k6 built-in | Global error rate (non-2xx) |
| `http_reqs` (Counter) | k6 built-in | Total request count |
| `iterations` (Counter) | k6 built-in | Total VU iterations completed |
| `vus_max` | k6 built-in | Max concurrent VUs |
| `data_received` / `data_sent` | k6 built-in | Network bytes — sanity check, not a perf metric |

## Thresholds (will fail the run if violated)

- `endpoint_me_duration` — p95 < 2000ms
- `endpoint_my_evaluations_duration` — p95 < 2000ms
- `http_req_failed` — rate < 0.05 (5%)

## Topology context (so the numbers mean something)

**Browser → nginx (frontend service) → Spring Boot (backend service) → MySQL (db service)**

- The frontend nginx container does **two jobs**: serves the React SPA static files, AND proxies `/api/*` to the backend.
- `/api/*` proxying is a **single `proxy_pass ${BACKEND_URL}`** (not a multi-upstream pool) — see `frontend/nginx.conf.template:11-17`. `BACKEND_URL` is injected at container startup from Railway's internal networking URL (something like `http://backend.railway.internal:8080`).
- Load balancing across backend replicas (if any) happens via **Railway's internal DNS**, not by nginx. nginx itself is unaware of replica count.
- Backend Spring Boot has **no public domain** in this repo's configuration — only internal networking. The nginx proxy is the only public entry to the API.

## Open questions — answers from code/config audit

### Q1. Where does the nginx proxy point, and how many backend replicas?

- **Proxy target**: single `proxy_pass ${BACKEND_URL}` (injected at runtime). See `frontend/nginx.conf.template:11-17`.
- **There is no nginx `upstream { ... }` block** — earlier draft used "backend_pool", that term doesn't reflect reality. The backend is reached via Railway internal DNS.
- **Replica count**: not in repo. Configured per-service in the Railway dashboard. **TBD — check Railway → backend service → Settings → Replicas and fill in here.**
  - Current value: _TBD_
  - Recommended for demo: ≥ 2 (to show horizontal scaling effect)

### Q2. Are the "replica metrics" we want to show on the frontend or backend service?

- The frontend nginx is mostly static-file serving + a thin proxy. Under our k6 workload, it's **not** the bottleneck.
- Real CPU/memory/throughput pressure lands on the **backend service** because every k6 request is `/api/*` → proxied → backend.
- **→ Capture replica scaling metrics on the backend service.** Show: replica count × throughput, replica count × CPU, replica count × p95.

### Q3. Is the backend really internal-only (no public URL)?

- `frontend/nginx.conf.template:10` comment: "BACKEND_URL is injected at runtime (e.g. Railway internal networking URL)"
- `backend/Dockerfile` only `EXPOSE ${SERVER_PORT}` — no public domain configured in repo
- `WebSecurityConfig` does not have any "public bypass" path beyond `/auth/login` + Swagger (and Swagger is disabled in prod via `application-prod.yaml`)
- **Final verification needed**: Railway → backend service → Settings → Networking. Confirm there is no public domain, only a private one. **Screenshot for the report.**
  - Status: _TBD — verify in Railway dashboard_

## Things this test deliberately does NOT cover

- Write endpoints — we don't want to pollute prod data or mess with the audit log.
- Login throughput — each VU logs in once, so login isn't a stressed path. If we want to test login itself, that's a separate scenario.
- Auth-failure / unauthorized paths — out of scope for this round.
- Long-lived sessions / token expiry — JWT is 60min, run is short enough that this doesn't matter.

## Open decisions for the team

- [ ] Are the two endpoints representative enough, or should we add a third (e.g. a heavier list query)?
- [ ] Is p95 < 2000ms the right SLO, or should it be tighter (e.g. 1000ms) given these are read-only cached queries?
- [ ] Should we add a Trend for login latency too, even though it's only called once per VU?
- [ ] What VU profile do we want for the actual run? Current draft: 5 → 10 VUs over 2min. Final number TBD.
