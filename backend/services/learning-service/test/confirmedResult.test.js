const { test } = require('node:test');
const assert = require('node:assert/strict');
const { randomUUID } = require('node:crypto');
const { evaluateRule } = require('../src/modules/gamification/domain/confirmedResult');
const event = () => ({ eventId: randomUUID(), type: 'ResultadoConfirmado.v1', schemaVersion: 1, producer: 'evaluation', correlationId: randomUUID(), occurredAt: new Date().toISOString(), data: { attemptId: '1', userId: '2', resultVersion: 1, status: 'confirmed' } });
const rule = { id: 'test.completed', version: 1, points: 15, enabled: true };

test('only confirmed server events and explicit versioned rules grant points', () => {
    assert.equal(evaluateRule(event(), rule).points, 15);
    for (const patch of [{ producer: 'browser' }, { schemaVersion: 2 }, { eventId: 'not-an-id' }, { occurredAt: 'yesterday' }]) {
        assert.throws(() => evaluateRule({ ...event(), ...patch }, rule));
    }
    for (const points of [-1, 1.5, Infinity, '15', 10001]) assert.throws(() => evaluateRule(event(), { ...rule, points }));
    assert.throws(() => evaluateRule(event(), { ...rule, enabled: false }));
});

test('client balances, grades, pending results and revisions are rejected', () => {
    for (const patch of [{ points: 999 }, { grade: 20 }, { resultVersion: 2 }, { status: 'pending' }, { userId: 2 }]) {
        const candidate = event();
        candidate.data = { ...candidate.data, ...patch };
        assert.throws(() => evaluateRule(candidate, rule));
    }
});
