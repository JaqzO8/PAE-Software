const { test } = require('node:test');
const assert = require('node:assert/strict');
const request = require('supertest');
const { createApp } = require('../src/app');

test('JSON writes bind preferences, reminders and missions to authenticated identity', async () => {
    const received = [];
    const capture = async input => { received.push(input); return {}; };
    const app = createApp({
        authenticate: (req, res, next) => { req.user = { id: 7 }; next(); },
        planningUseCases: { updatePreferences: capture, scheduleSession: capture, createMission: capture },
    });
    for (const [method, route] of [['put', 'preferences'], ['post', 'reminders'], ['post', 'missions/daily']]) {
        await request(app)[method](`/api/learning/planning/${route}`).send({ userId: 99, title: 'Study' }).expect(200);
    }
    assert.equal(received.length, 3);
    for (const input of received) assert.deepEqual(input, { userId: 7, title: 'Study' });
});

test('domain errors return structured rejection; unexpected errors hide internals', async () => {
    const app = createApp({ authenticate: (req, res, next) => { req.user = { id: 7 }; next(); }, planningUseCases: {
        scheduleSession: async () => { throw Object.assign(new Error('Horario inválido'), { status: 400 }); },
        createMission: async () => { throw new Error('database connection secret'); },
    } });
    const invalid = await request(app).post('/api/learning/planning/reminders').send({}).expect(400);
    assert.equal(invalid.body.message, 'Horario inválido');
    const failure = await request(app).post('/api/learning/planning/missions/daily').send({}).expect(500);
    assert.equal(failure.body.message, 'Error interno de planificación');
});
