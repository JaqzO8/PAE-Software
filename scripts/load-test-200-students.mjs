import { createRequire } from "node:module";

const apiUrl = process.env.PAE_API_URL || "http://127.0.0.1:3000/api";
const socketUrl = (process.env.PAE_SOCKET_URL || apiUrl.replace(/\/api\/?$/, "")).replace(/\/$/, "");
const email = process.env.PAE_STUDENT_EMAIL || "estudiante.demo@pae.test";
const password = process.env.PAE_STUDENT_PASSWORD || "PaeDemo2026";
const virtualUsers = Number(process.env.PAE_VUS || 200);
const durationMs = Number(process.env.PAE_DURATION_MS || 30000);
const communityId = process.env.PAE_COMMUNITY_ID || "";
const socketUsers = Number(process.env.PAE_SOCKET_USERS || Math.min(80, virtualUsers));

const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));
const stats = {
  http: { total: 0, ok: 0, failed: 0, timings: [], statuses: {} },
  endpoints: {},
  socket: { attempted: 0, connected: 0, failed: 0 },
};

const ensureEndpointStats = (endpoint) => {
  stats.endpoints[endpoint] ||= { total: 0, ok: 0, failed: 0, timings: [], statuses: {} };
  return stats.endpoints[endpoint];
};

const record = (endpoint, ok, started, status = "network_error") => {
  const elapsed = Date.now() - started;
  stats.http.total += 1;
  stats.http.timings.push(elapsed);
  stats.http.statuses[status] = (stats.http.statuses[status] || 0) + 1;
  if (ok) stats.http.ok += 1;
  else stats.http.failed += 1;

  const endpointStats = ensureEndpointStats(endpoint);
  endpointStats.total += 1;
  endpointStats.timings.push(elapsed);
  endpointStats.statuses[status] = (endpointStats.statuses[status] || 0) + 1;
  if (ok) endpointStats.ok += 1;
  else endpointStats.failed += 1;
};

const loginResponse = await fetch(`${apiUrl}/auth/login`, {
  method: "POST",
  headers: { "Content-Type": "application/json" },
  body: JSON.stringify({ email, password }),
});

if (!loginResponse.ok) {
  throw new Error(`No se pudo iniciar sesion para la prueba: HTTP ${loginResponse.status}`);
}

const { token } = await loginResponse.json();
const headers = { Authorization: `Bearer ${token}` };
const endpoints = [
  "/auth/verify",
  "/auth/preferences",
  "/learning/gamification/summary",
  "/learning/gamification/leaderboard",
  "/community/hub",
];

if (communityId) {
  endpoints.push(`/community/${communityId}/messages?limit=30&offset=0`);
}

async function hit(endpoint) {
  const started = Date.now();
  try {
    const response = await fetch(`${apiUrl}${endpoint}`, { headers });
    record(endpoint, response.ok, started, response.status);
  } catch {
    record(endpoint, false, started);
  }
}

async function userWorker(index) {
  const stopAt = Date.now() + durationMs;
  let cursor = index % endpoints.length;
  while (Date.now() < stopAt) {
    await hit(endpoints[cursor]);
    cursor = (cursor + 1) % endpoints.length;
    await sleep(150 + (index % 7) * 25);
  }
}

async function openSocketClients() {
  let io;
  try {
    const requireFromFrontend = createRequire(new URL("../frontend/package.json", import.meta.url));
    ({ io } = requireFromFrontend("socket.io-client"));
  } catch (error) {
    console.warn(`Socket.IO client no disponible para la prueba: ${error.message}`);
    return [];
  }

  const clients = [];
  await Promise.all(Array.from({ length: socketUsers }, async (_, index) => {
    stats.socket.attempted += 1;
    await new Promise((resolve) => {
      const socket = io(socketUrl, {
        path: "/learning-socket",
        auth: { token },
        transports: ["websocket"],
        reconnection: false,
        timeout: 5000,
      });
      socket.on("connect", () => {
        stats.socket.connected += 1;
        socket.emit(index % 2 === 0 ? "challenge:join-room" : "trivia:join-room", "1");
        clients.push(socket);
        resolve();
      });
      socket.on("connect_error", () => {
        stats.socket.failed += 1;
        socket.close();
        resolve();
      });
    });
  }));

  return clients;
}

const socketClients = await openSocketClients();
await Promise.all(Array.from({ length: virtualUsers }, (_, index) => userWorker(index)));
socketClients.forEach((socket) => socket.close());

stats.http.timings.sort((a, b) => a - b);
const percentile = (value) => {
  if (!stats.http.timings.length) return 0;
  const index = Math.min(stats.http.timings.length - 1, Math.ceil((value / 100) * stats.http.timings.length) - 1);
  return stats.http.timings[index];
};

const percentileFor = (timings, value) => {
  if (!timings.length) return 0;
  timings.sort((a, b) => a - b);
  const index = Math.min(timings.length - 1, Math.ceil((value / 100) * timings.length) - 1);
  return timings[index];
};

const result = {
  apiUrl,
  socketUrl,
  virtualUsers,
  socketUsers,
  durationMs,
  http: {
    total: stats.http.total,
    ok: stats.http.ok,
    failed: stats.http.failed,
    statuses: stats.http.statuses,
    errorRate: stats.http.total ? Number((stats.http.failed / stats.http.total).toFixed(4)) : 0,
    p50Ms: percentile(50),
    p95Ms: percentile(95),
    p99Ms: percentile(99),
  },
  endpoints: Object.fromEntries(Object.entries(stats.endpoints).map(([endpoint, endpointStats]) => [
    endpoint,
    {
      total: endpointStats.total,
      ok: endpointStats.ok,
      failed: endpointStats.failed,
      statuses: endpointStats.statuses,
      p50Ms: percentileFor(endpointStats.timings, 50),
      p95Ms: percentileFor(endpointStats.timings, 95),
    },
  ])),
  socket: stats.socket,
};

console.log(JSON.stringify(result, null, 2));

if (result.http.errorRate > 0.05 || result.socket.failed > Math.max(5, socketUsers * 0.1)) {
  process.exitCode = 1;
}
