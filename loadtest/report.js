#!/usr/bin/env node
// Render a screenshot-friendly table from loadtest/summary.json.
// Usage: node loadtest/report.js [path/to/summary.json]

const fs = require('fs');
const path = require('path');

const summaryPath = process.argv[2] || path.join(__dirname, 'summary.json');

if (!fs.existsSync(summaryPath)) {
  console.error(`summary.json not found: ${summaryPath}`);
  console.error(`Run k6 first:  k6 run loadtest/script.js`);
  process.exit(1);
}

const raw = fs.readFileSync(summaryPath, 'utf8');
let data;
try {
  data = JSON.parse(raw);
} catch (e) {
  console.error(`Failed to parse JSON: ${e.message}`);
  process.exit(1);
}

const metrics = data.metrics || {};

function trend(name) {
  const m = metrics[name];
  if (!m || !m.values) return null;
  const v = m.values;
  return {
    count: v.count ?? null,
    avg: v.avg ?? null,
    p50: v['p(50)'] ?? v.med ?? null,
    p95: v['p(95)'] ?? null,
    p99: v['p(99)'] ?? null,
    max: v.max ?? null,
  };
}

function rate(name) {
  const m = metrics[name];
  if (!m || !m.values) return null;
  return m.values.rate ?? null;
}

function counter(name) {
  const m = metrics[name];
  if (!m || !m.values) return null;
  return m.values.count ?? null;
}

function fmt(n, digits = 2) {
  if (n === null || n === undefined || Number.isNaN(n)) return '—';
  return Number(n).toFixed(digits);
}

function fmtPct(n) {
  if (n === null || n === undefined || Number.isNaN(n)) return '—';
  return `${(Number(n) * 100).toFixed(2)}%`;
}

// ── Run-level summary ──────────────────────────────────────────────────────
console.log('\n=== Run summary ===');
const runRows = [
  { metric: 'iterations', value: counter('iterations') ?? '—' },
  { metric: 'http_reqs (total)', value: counter('http_reqs') ?? '—' },
  { metric: 'http_req_failed (rate)', value: fmtPct(rate('http_req_failed')) },
  { metric: 'vus_max', value: metrics.vus_max?.values?.max ?? metrics.vus?.values?.max ?? '—' },
  { metric: 'data_received (bytes)', value: counter('data_received') ?? '—' },
  { metric: 'data_sent (bytes)', value: counter('data_sent') ?? '—' },
];
console.table(runRows);

// ── Per-endpoint timing (ms) ───────────────────────────────────────────────
console.log('\n=== Per-endpoint duration (ms) ===');
const endpointRows = [
  { endpoint: 'auth/me', ...(trend('endpoint_me_duration') || {}) },
  { endpoint: 'evaluations/my-evaluations', ...(trend('endpoint_my_evaluations_duration') || {}) },
].map((r) => ({
  endpoint: r.endpoint,
  count: r.count ?? '—',
  avg: fmt(r.avg),
  p50: fmt(r.p50),
  p95: fmt(r.p95),
  p99: fmt(r.p99),
  max: fmt(r.max),
}));
console.table(endpointRows);

// ── Threshold pass/fail ────────────────────────────────────────────────────
console.log('\n=== Thresholds ===');
const thresholdRows = [];
for (const [name, m] of Object.entries(metrics)) {
  if (!m.thresholds) continue;
  for (const [expr, result] of Object.entries(m.thresholds)) {
    thresholdRows.push({
      metric: name,
      threshold: expr,
      ok: result.ok === undefined ? '—' : result.ok ? 'PASS' : 'FAIL',
    });
  }
}
if (thresholdRows.length === 0) {
  console.log('(no thresholds in summary)');
} else {
  console.table(thresholdRows);
}

console.log('');
