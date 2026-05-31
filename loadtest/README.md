# loadtest/

k6 load tests for the PMS — login once per VU, then repeatedly hit two read endpoints.

> **Status:** Team has signed off on the metric plan (`METRICS.md`). Both stress and spike
> tests have been run against Railway production; results are checked into `runs/` and as
> `summary-stress.json` / `summary-spike.json` for later inspection.

## Files

### Test scripts

| File | Profile |
|---|---|
| `stress-test.js` | **Stress test** — single warm-up stage `300s → 1000 VUs` (intermediate steps `50/100/200/400` left as commented hints for stepwise sweeps). p95 thresholds 2000ms (me) / 2500ms (my-evaluations), error rate < 5%. Sustain a smooth ramp to find the capacity ceiling. |
| `spike-test.js` | **Spike test** — `5 → 200 VUs over 5s` burst, hold 30s, drop back to 5, then 0. Total ≈ 90s. Looser thresholds (p95 5000/8000ms, err < 10%) — we expect a temporary bump and measure recovery. |
| `script.js` | **Local sanity check** — modest `5 → 10 VU` ramp. Defaults `BASE_URL` to `http://localhost:8080`, intended for running against a local backend before pushing real load at Railway. |
| `diagnose-status.js` | **Diagnostic** — count HTTP status codes per endpoint. Used to confirm whether stress failures are 401 (cookie/auth) or 5xx (backend/nginx saturation). |
| `diagnose-cookie.js` | **Diagnostic** — single VU + `noCookiesReset: true` probe that proved iteration boundaries were wiping the cookie jar. The fix (`noCookiesReset: true`) is now baked into the real scripts. |

### Tooling and config

| File | Purpose |
|---|---|
| `report.js` | Node script — read a summary JSON and print three screenshot-friendly tables (run summary, per-endpoint latency, threshold pass/fail). Defaults to `loadtest/summary.json`; can take a path argument. |
| `METRICS.md` | Metric plan + open questions / decisions reviewed by the team. |
| `.env.example` | Template for `BASE_URL`, `PMS_USER`, `PMS_PASS`. |
| `.env` | Real credentials — **gitignored, never commit**. |

### Result archive (checked in)

These are committed so the team can review results without re-running:

| File / dir | Contents |
|---|---|
| `summary-stress.json` | Last full stress run's `handleSummary` output. |
| `summary-spike.json` | Last full spike run's `handleSummary` output. |
| `summary.json` | Latest k6 run (most recent) — **gitignored**, just a transient file. |
| `runs/` | Per-VU-level run archive. Each `k6 run` is captured as `summary-vu<N>.json` + the raw `run-vu<N>.log`. |
| `runs/30min/` | Long-duration (30 minute) runs at the same VU levels. |

Convention: short-run summaries live at the top level, longer / experimental runs go under `runs/`.

## Prerequisites

- k6 ≥ 0.50
  ```bash
  # macOS
  brew install k6
  # Ubuntu
  sudo gpg -k
  sudo gpg --no-default-keyring --keyring /usr/share/keyrings/k6-archive-keyring.gpg \
       --keyserver hkp://keyserver.ubuntu.com:80 --recv-keys C5AD17C747E3415A3642D57D77C6C491D6AC1D69
  echo "deb [signed-by=/usr/share/keyrings/k6-archive-keyring.gpg] https://dl.k6.io/deb stable main" \
       | sudo tee /etc/apt/sources.list.d/k6.list
  sudo apt-get update && sudo apt-get install k6
  ```
- Node ≥ 18 (for `report.js`)

## Setup

```bash
cp loadtest/.env.example loadtest/.env
# edit loadtest/.env — fill in PMS_USER, PMS_PASS, BASE_URL (or rely on the script's default)
```

## Static validation (does NOT send requests)

`k6 inspect` only runs the init context — no requests fire — so this is safe to run anytime.

```bash
k6 inspect loadtest/stress-test.js
k6 inspect loadtest/spike-test.js
k6 inspect loadtest/script.js
```

You should see the parsed `options` (stages + thresholds) printed as JSON.

## Dry-run the report formatter (no k6 run needed)

```bash
node loadtest/report.js loadtest/summary-stress.json
node loadtest/report.js loadtest/summary-spike.json
```

## Actual run

```bash
set -a; source loadtest/.env; set +a

# Stress — find the capacity ceiling
k6 run loadtest/stress-test.js
mv loadtest/summary.json loadtest/summary-stress.json   # archive

# Spike — burst traffic, measure recovery
k6 run loadtest/spike-test.js
mv loadtest/summary.json loadtest/summary-spike.json    # archive

# Render tables from whichever summary you want
node loadtest/report.js loadtest/summary-stress.json
```

Each `k6 run` overwrites `loadtest/summary.json` (transient). Rename it to a stable filename (e.g. `summary-stress.json`, `runs/summary-vu500.json`) if you want to keep it. The archived filenames are what's checked into the repo.

`stress-test.js`, `spike-test.js`, and both diagnostics default `BASE_URL` to the Railway prod frontend; `script.js` defaults to `http://localhost:8080` for local sanity checks. Override via env if needed.

If you want the raw per-sample stream (not just the summary), append `--out json=loadtest/results.json` — it's gitignored.

## Important — what NOT to do

- **Do not log in as `admin` or `hr`** — use a regular employee account. The scripts only exercise endpoints accessible to any authenticated user; using a privileged account widens the blast radius if something misbehaves.
- **Do not commit `.env`, `summary.json`, or `results.json`** — they are gitignored, but double-check `git status` before staging.
- **Do not bump VUs on `stress-test.js` past the existing `1000` warm-up without first looking at the latest archived `summary-vu1000.json`** — we've already characterized that ceiling; going higher should be deliberate, not accidental.
