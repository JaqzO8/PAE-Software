import assert from 'node:assert/strict';
import { randomUUID } from 'node:crypto';
import { account, request, compose } from './harness.mjs';

assert.equal(JSON.parse(compose('config', '--format', 'json')).name, 'pae_qa');
const host = await account('docente'), member = await account(), outsider = await account();
const topic = `Live QA ${randomUUID()}`;
for (let index = 0; index < 3; index++) {
    await request('/learning/questions', { method: 'POST', account: host, status: 201, data: {
        universityId: 'unmsm', materia: topic, tema: topic, dificultad: 'facil', tipo: 'opcion_multiple',
        enunciado: `${topic} pregunta ${index}`, opciones: ['Correcta', 'Incorrecta'], respuesta_correcta: 0,
    } });
}

for (const mode of ['challenges', 'trivia']) {
    const root = `/learning/${mode}/rooms`;
    await request(root, { account: host });
    await request(root, { method: 'POST', account: host, data: { topic: '' }, status: 400 });
    const room = (await request(root, { method: 'POST', account: host, status: 201,
        data: { topic, difficulty: 'facil', questionsCount: 3, maxPlayers: 4 } })).body;
    const route = `${root}/${room.id}/match`;
    await request(`${route}/start`, { method: 'POST', account: outsider, status: 403 });
    await request(`${root}/${room.id}/join`, { method: 'POST', account: member });
    const repeatedJoin = (await request(`${root}/${room.id}/join`, { method: 'POST', account: member })).body;
    assert.equal(repeatedJoin.currentPlayers, 2);
    let game = (await request(`${route}/start`, { method: 'POST', account: host, status: 201, data: { questionCount: 3 } })).body;
    assert.equal(game.totalQuestions, 3);
    assert.equal((await request(`${route}/start`, { method: 'POST', account: host })).body.id, game.id);
    await request(route, { account: outsider, status: 403 });
    await request(`${route}/next`, { method: 'POST', account: member, status: 403 });
    await request(`${route}/answer`, { method: 'POST', account: outsider, data: { questionId: game.currentQuestion.id, answer: 0 }, status: 403 });
    for (let index = 0; index < 3; index++) {
        const questionId = game.currentQuestion.id;
        assert.equal(Object.hasOwn(game.currentQuestion, 'correctAnswer'), false);
        await request(`${route}/answer`, { method: 'POST', account: host, data: { questionId: 'wrong', answer: 0 }, status: 409 });
        const answer = (await request(`${route}/answer`, { method: 'POST', account: host, data: { questionId, answer: 0 } })).body;
        assert.equal(answer.lastAnswer.correct, true);
        assert.ok(answer.lastAnswer.points > 0);
        await request(`${route}/answer`, { method: 'POST', account: host, data: { questionId, answer: 0 }, status: 409 });
        game = (await request(`${route}/answer`, { method: 'POST', account: member, data: { questionId, answer: 1 } })).body;
        assert.equal(game.lastAnswer.correct, false);
        assert.equal(game.lastAnswer.points, 0);
    }
    assert.equal(game.status, 'finished');
    assert.equal(game.currentQuestion, null);
    assert.equal(game.scoreboard.find(row => String(row.id) === String(host.user.id)).correctAnswers, 3);
    assert.equal((await request(route, { account: host })).body.status, 'finished');
    await request(`${route}/next`, { method: 'POST', account: host, status: 404 });

    const manual = (await request(root, { method: 'POST', account: host, status: 201,
        data: { topic, difficulty: 'facil', questionsCount: 3 } })).body;
    const manualRoute = `${root}/${manual.id}/match`;
    await request(`${manualRoute}/start`, { method: 'POST', account: host, status: 201, data: { questionCount: 3 } });
    for (let index = 0; index < 3; index++) {
        const advanced = (await request(`${manualRoute}/next`, { method: 'POST', account: host })).body;
        assert.equal(advanced.status, index === 2 ? 'finished' : 'playing');
    }
    if (mode === 'challenges') {
        await request(`${root}/${manual.id}/leave`, { method: 'POST', account: host });
    }
    console.log(`PASS LIVE-${mode}: persisted matches, membership, duplicate answers, scores and manual completion`);
}
