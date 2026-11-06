import assert from 'node:assert/strict';
import { setTimeout } from 'node:timers/promises';
import { account, compose, origin } from './harness.mjs';

assert.equal(JSON.parse(compose('config', '--format', 'json')).name, 'pae_qa');
const user = await account();
const frontend = compose('ps', '-q', 'frontend').trim();
const gateway = compose('ps', '-q', 'nginx-gateway').trim();
assert.ok(frontend && gateway);

async function verifySession() {
    const response = await fetch(`${origin}/api/auth/verify`, {
        headers: { Authorization: `Bearer ${user.token}` },
        signal: AbortSignal.timeout(3000),
    });
    assert.equal(response.status, 200);
    assert.equal(String((await response.json()).user.id), String(user.user.id));
}

await verifySession();
// Leave frontend and backend processes running, including their coverage data.
compose('up', '-d', '--no-deps', '--force-recreate', 'nginx-gateway');
assert.notEqual(compose('ps', '-q', 'nginx-gateway').trim(), gateway);
assert.equal(compose('ps', '-q', 'frontend').trim(), frontend);
let failure;
const deadline = Date.now() + 20000;
do {
    try { await verifySession(); failure = undefined; break; }
    catch (error) { failure = error; await setTimeout(500); }
} while (Date.now() < deadline);
if (failure) throw failure;
console.log('PASS PROXY: authenticated API recovers after gateway recreation without restarting or reloading the frontend');
