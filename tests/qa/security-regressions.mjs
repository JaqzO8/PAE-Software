import assert from 'node:assert/strict';
import { account, request, sql } from './harness.mjs';

// Additional real Redis/PostgreSQL regressions; the contracted matrix remains 64 cases.
const user = await account();
const challenge = async () => (await request('/auth/login', {
    method: 'POST', data: { email: user.email, password: user.password, mfaRequired: true },
})).body;
let value = await challenge();
assert.match(value.code, /^\d{6}$/); // QA is explicitly a local development environment.
let results = await Promise.all(Array.from({ length: 8 }, () => request('/auth/mfa/complete', {
    method: 'POST', status: [200, 400], data: { challengeToken: value.challengeToken, code: value.code },
})));
assert.equal(results.filter(result => result.status === 200).length, 1);
assert.equal(sql('qa_auth', `SELECT count(*) FROM sesiones WHERE id_usuario=${Number(user.user.id)} AND activa`), '2');
console.log('PASS real Redis: single MFA completion across eight concurrent requests');
value = await challenge();
results = await Promise.all(Array.from({ length: 8 }, () => request('/auth/mfa/complete', {
    method: 'POST', status: [400, 429], data: { challengeToken: value.challengeToken, code: '000000' },
})));
assert.equal(results.filter(result => result.status === 400).length, 2);
await request('/auth/mfa/complete', { method: 'POST', status: 429, data: { challengeToken: value.challengeToken, code: value.code } });
console.log('PASS real Redis: concurrent attempts cannot bypass the MFA budget');
results = await Promise.all(Array.from({ length: 2 }, () => request('/auth/refresh', { method: 'POST', account: user, status: [200, 401] })));
assert.deepEqual(results.map(result => result.status).sort(), [200, 401]);
await request('/auth/verify', { account: user, status: 401 });
await request('/auth/verify', { account: { token: results.find(result => result.status === 200).body.token } });
console.log('PASS real PostgreSQL: concurrent refresh rotates the session only once');
