import assert from 'node:assert/strict';
import { execFileSync } from 'node:child_process';
import { group, apiOrigin, compose } from './harness.mjs';

assert.equal(JSON.parse(compose('config', '--format', 'json')).name, 'pae_qa');
const g = await group();
const run = (script, env) => JSON.parse(execFileSync(process.execPath, [script], {
    encoding: 'utf8', timeout: 30000, env: { ...process.env, ...env }, stdio: ['ignore', 'pipe', 'pipe'],
}));
const health = run('scripts/load-test-api.mjs', {
    PAE_API_URL: `${apiOrigin}/api`, PAE_LOAD_CONCURRENCY: '4', PAE_LOAD_DURATION_MS: '2000', PAE_LOAD_DELAY_MS: '100',
});
assert.ok(health.totalRequests >= 4); assert.equal(health.failed, 0); assert.ok(health.p95Ms < 5000);
const traffic = run('scripts/load-test-200-students.mjs', {
    PAE_API_URL: `${apiOrigin}/api`, PAE_SOCKET_URL: apiOrigin,
    PAE_STUDENT_EMAIL: g.member.email, PAE_STUDENT_PASSWORD: g.member.password,
    PAE_COMMUNITY_ID: String(g.id), PAE_VUS: '8', PAE_SOCKET_USERS: '4', PAE_DURATION_MS: '3000',
});
assert.ok(traffic.http.total >= 8); assert.equal(traffic.http.failed, 0); assert.ok(traffic.http.p95Ms < 5000);
assert.equal(traffic.socket.connected, 4); assert.equal(traffic.socket.failed, 0);
assert.equal(Object.keys(traffic.endpoints).length, 6);
console.log(`PASS OPERATIONAL: health ${health.totalRequests} requests; authenticated ${traffic.http.total} requests, 8 workers and 4 sockets, no failures`);
