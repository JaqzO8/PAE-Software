const { test, before, after } = require('node:test');
const assert = require('node:assert/strict');
const { randomUUID } = require('node:crypto');
const { Pool } = require('pg');
const { migrate } = require('../../scripts/migrate');
const { createPostgresAwards } = require('../../src/modules/gamification/infrastructure/postgresAwards');
const { createAwardConfirmedResult } = require('../../src/modules/gamification/application/awardConfirmedResult');
if (!/^\/pae_test_[a-f0-9]{32}$/.test(new URL(process.env.LEARNING_DATABASE_URL).pathname)) throw new Error('Use an isolated test database');
const pool = new Pool({ connectionString: process.env.LEARNING_DATABASE_URL });
const awards = createPostgresAwards({ pool });
const rule = { id: 'test.completed', version: 1, points: 15, enabled: true };
const consume = createAwardConfirmedResult({ awards, rule });
const event = (attemptId, userId = '2') => ({ eventId: randomUUID(), type: 'ResultadoConfirmado.v1', schemaVersion: 1, producer: 'evaluation', correlationId: randomUUID(), occurredAt: new Date().toISOString(), data: { attemptId, userId, resultVersion: 1, status: 'confirmed' } });
before(async () => { await migrate(pool); await migrate(pool); });
after(() => pool.end());

test('concurrent retries grant one ledger entry, one balance and one outbox event', async () => {
    const source = event('1');
    const results = await Promise.all(Array.from({ length: 20 }, () => consume(source)));
    assert.equal(results.filter(r => r.granted).length, 1);
    assert.equal((await pool.query("SELECT points FROM gamification.balances WHERE user_id='2'")).rows[0].points, '15');
    assert.equal((await pool.query('SELECT count(*) FROM gamification.outbox')).rows[0].count, '1');
    assert.deepEqual(await consume({ ...source, eventId: randomUUID() }), { granted: false });
});

test('event IDs cannot be reused for other results and rules cannot change under the same version', async () => {
    const source = event('2', '3');
    await consume(source);
    await assert.rejects(consume({ ...source, data: { ...source.data, attemptId: '3' } }), /identity reused/);
    const mutatedRule = createAwardConfirmedResult({ awards, rule: { ...rule, points: 30 } });
    await assert.rejects(mutatedRule(event('4')), /immutable/);
});

test('failure writing outbox rolls back ledger, inbox and balance', async () => {
    await pool.query("ALTER TABLE gamification.outbox ADD CONSTRAINT fail_test_user CHECK (payload->'data'->>'userId' <> '777')");
    const source = event('5', '777');
    try {
        await assert.rejects(consume(source));
        assert.equal((await pool.query('SELECT * FROM gamification.inbox WHERE event_id=$1', [source.eventId])).rowCount, 0);
        assert.equal((await pool.query("SELECT * FROM gamification.balances WHERE user_id='777'")).rowCount, 0);
    } finally { await pool.query('ALTER TABLE gamification.outbox DROP CONSTRAINT fail_test_user'); }
    assert.deepEqual(await consume(source), { granted: true });
});

test('concurrent distinct results accumulate exactly and balance can be reconciled from ledger', async () => {
    await Promise.all(Array.from({ length: 12 }, (_, index) => consume(event(String(index + 100), '5'))));
    const balance = (await pool.query("SELECT points FROM gamification.balances WHERE user_id='5'")).rows[0].points;
    const ledger = (await pool.query("SELECT sum(points) AS points FROM gamification.ledger WHERE user_id='5'")).rows[0].points;
    assert.equal(balance, '180');
    assert.equal(balance, ledger);
});
