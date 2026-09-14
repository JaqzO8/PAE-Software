const baseUrl = process.env.PAE_API_URL || "http://127.0.0.1:3000/api";
const concurrency = Number(process.env.PAE_LOAD_CONCURRENCY || 8);
const durationMs = Number(process.env.PAE_LOAD_DURATION_MS || 20000);
const delayMs = Number(process.env.PAE_LOAD_DELAY_MS || 0);
const token = process.env.PAE_TOKEN || "";

const endpoints = [
  "/auth/health",
  "/content/health",
  "/community/health",
  "/learning/health",
];

const stats = {
  total: 0,
  ok: 0,
  failed: 0,
  timings: [],
};

const headers = token ? { Authorization: `Bearer ${token}` } : {};
const stopAt = Date.now() + durationMs;

async function hit(endpoint) {
  const started = performance.now();
  try {
    const response = await fetch(`${baseUrl}${endpoint}`, { headers });
    const elapsed = performance.now() - started;
    stats.total += 1;
    stats.timings.push(elapsed);
    if (response.ok) {
      stats.ok += 1;
    } else {
      stats.failed += 1;
    }
  } catch {
    stats.total += 1;
    stats.failed += 1;
  }
}

async function worker(index) {
  while (Date.now() < stopAt) {
    await hit(endpoints[index % endpoints.length]);
    if (delayMs > 0) {
      await new Promise((resolve) => setTimeout(resolve, delayMs));
    }
    index += concurrency;
  }
}

await Promise.all(Array.from({ length: concurrency }, (_, index) => worker(index)));

stats.timings.sort((a, b) => a - b);
const percentile = (value) => {
  if (stats.timings.length === 0) return 0;
  const index = Math.min(stats.timings.length - 1, Math.ceil((value / 100) * stats.timings.length) - 1);
  return Math.round(stats.timings[index]);
};

console.log(JSON.stringify({
  baseUrl,
  concurrency,
  durationMs,
  delayMs,
  totalRequests: stats.total,
  ok: stats.ok,
  failed: stats.failed,
  p50Ms: percentile(50),
  p95Ms: percentile(95),
  p99Ms: percentile(99),
}, null, 2));
