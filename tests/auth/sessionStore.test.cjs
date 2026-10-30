const { test } = require('node:test');
const assert = require('node:assert/strict');
const { randomUUID } = require('node:crypto');
const store = require('../../backend/services/auth-service/src/config/sessionStore');

test('Session adapter expires blacklist entries and consumes reset tokens exactly once', async () => {
    const token = randomUUID();
    await store.addToBlacklist(token, -1);
    assert.equal(await store.isBlacklisted(token), false);
    await store.addToBlacklist(token, 10);
    assert.equal(await store.isBlacklisted(token), true);
    await store.storeResetToken(token, 42);
    const consumed = await Promise.all(Array.from({ length: 10 }, () => store.atomicConsumeResetToken(token)));
    assert.equal(consumed.filter(value => value === '42').length, 1);
});

test('MFA verification and consumption allow a single concurrent success', async () => {
    const id = randomUUID();
    await store.storeMfaChallenge(id, { userId: 42, otpCode: '123456', attempts: 0 });
    const attempts = await Promise.all(Array.from({ length: 10 }, () => store.verifyMfaChallenge(id, '123456', 42)));
    assert.equal(attempts.filter(value => value.status === 'accepted').length, 1);
    assert.equal(attempts.filter(value => value.status === 'expired').length, 9);
});

test('Concurrent failed MFA attempts exhaust the budget and a correct code cannot bypass it', async () => {
    const id = randomUUID();
    await store.storeMfaChallenge(id, { userId: 42, otpCode: '123456', attempts: 0 });
    const attempts = await Promise.all(Array.from({ length: 5 }, () => store.verifyMfaChallenge(id, '000000', 42)));
    assert.deepEqual(attempts.map(value => value.status), ['invalid', 'invalid', 'blocked', 'blocked', 'blocked']);
    assert.equal((await store.verifyMfaChallenge(id, '123456', 42)).status, 'blocked');
});

test('MFA requires correct owner, format and unexpired challenge', async () => {
    const id = randomUUID();
    await store.storeMfaChallenge(id, { userId: 42, otpCode: '123456' });
    assert.equal((await store.verifyMfaChallenge(id, '123456', 7)).status, 'invalid');
    assert.equal((await store.verifyMfaChallenge(id, '12', 42)).status, 'invalid');
    await store.storeMfaChallenge(id, { userId: 42, otpCode: '123456' }, -1);
    assert.equal((await store.verifyMfaChallenge(id, '123456', 42)).status, 'expired');
});

test('Session storage failure propagates instead of silently accepting credentials', async () => {
    store.redis.status = 'reconnecting';
    try { await assert.rejects(store.isBlacklisted(randomUUID()), { status: 503 }); }
    finally { store.redis.status = 'ready'; }
});
