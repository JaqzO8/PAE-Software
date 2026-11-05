import assert from 'node:assert/strict';
import { randomUUID } from 'node:crypto';
import { account, request, compose } from './harness.mjs';

assert.equal(JSON.parse(compose('config', '--format', 'json')).name, 'pae_qa');
const teacher = await account('docente'), student = await account(), outsider = await account();
const subject = `QA revisión ${randomUUID()}`;
const questions = Array.from({ length: 6 }, (_, index) => ({ universityId: 'unmsm', materia: subject,
    tema: subject, dificultad: 'facil', tipo: 'abierta', enunciado: `${subject} pregunta ${index}`,
    respuesta_texto: 'Respuesta de referencia privada', explicacion: 'Rúbrica QA' }));
await request('/learning/questions/import', { method: 'POST', account: student, data: { questions }, status: 403 });
await request('/learning/questions/import', { method: 'POST', account: teacher, data: { questions: [] }, status: 400 });
const imported = (await request('/learning/questions/import', { method: 'POST', account: teacher, status: 201,
    data: { questions: [{ materia: subject }, ...questions] },
})).body.data;
assert.equal(imported.length, 6);
const exportResult = await request('/learning/questions/export', { account: teacher });
assert.match(exportResult.headers.get('content-disposition'), /banco-preguntas/);
assert.equal(exportResult.body.filter(item => item.materia === subject).length, 6);
const filter = new URLSearchParams({ materia: subject, dificultad: 'easy', universidad: 'unmsm', search: subject });
const listed = (await request(`/learning/questions?${filter}`, { account: teacher })).body.data;
assert.equal(listed.length, 6); assert.equal(listed[0].respuesta_texto, questions[0].respuesta_texto);

const attempt = (await request('/learning/simulacro/start', { method: 'POST', account: student, status: 201,
    data: { universityId: 'unmsm', difficulty: 'easy', subject, questionCount: 6 },
})).body;
const first = attempt.questions[0].id;
const reviewRoute = id => `/learning/reviews/${attempt.id}/questions/${id}`;
await request(reviewRoute(first), { method: 'POST', account: teacher, data: { puntaje: 5 }, status: 409 });
await request(`/learning/questions/${first}/save`, { method: 'POST', account: student });
await request(`/learning/questions/${first}/save`, { method: 'POST', account: student });
const saved = (await request('/learning/questions/saved', { account: student })).body.data;
assert.equal(saved.length, 1); assert.equal(saved[0].pregunta.respuesta_texto, undefined);
assert.equal((await request('/learning/questions/saved', { account: outsider })).body.data.length, 0);
await request(`/learning/questions/${first}/save`, { method: 'DELETE', account: outsider, status: 404 });

const submission = { simulacroId: attempt.id, answers: attempt.questions.map(() => 'Respuesta desarrollada por el estudiante.'), timeSpent: 120 };
const pending = (await request('/learning/simulacro/submit', { method: 'POST', account: student, data: submission,
    headers: { 'Idempotency-Key': `qa-review-${attempt.id}` },
})).body;
assert.equal(pending.status, 'pending_review'); assert.equal(pending.pendingManualReviews, 6);
await request('/learning/reviews/open', { account: student, status: 403 });
const reviews = (await request('/learning/reviews/open', { account: teacher })).body.data.filter(item => String(item.id_intento) === String(attempt.id));
assert.equal(reviews.length, 6); assert.ok(reviews.every(item => item.estado === 'pendiente'));
await request(reviewRoute(first), { method: 'POST', account: student, data: { puntaje: 5 }, status: 403 });
for (const puntaje of [-1, 6, 'invalid']) await request(reviewRoute(first), { method: 'POST', account: teacher, data: { puntaje }, status: 400 });
await request('/learning/reviews/2147483647/questions/2147483647', { method: 'POST', account: teacher, data: { puntaje: 5 }, status: 404 });
let final;
for (const question of attempt.questions) {
    final = (await request(reviewRoute(question.id), { method: 'POST', account: teacher,
        data: { puntaje: 5, feedback: 'Respuesta completa según rúbrica QA' },
    })).body.data.intento;
}
assert.equal(final.estado_resultado, 'confirmed'); assert.equal(final.puntaje, 100); assert.equal(final.correctas, 6);
await request(reviewRoute(first), { method: 'POST', account: teacher, data: { puntaje: 0 }, status: 409 });
const completed = (await request('/learning/reviews/open?estado=all', { account: teacher })).body.data.filter(item => String(item.id_intento) === String(attempt.id));
assert.equal(completed.length, 6); assert.ok(completed.every(item => item.estado === 'revisado'));
await request(`/learning/questions/${first}/save`, { method: 'DELETE', account: student });
assert.equal((await request('/learning/questions/saved', { account: student })).body.data.length, 0);
console.log('PASS EVALUATION: question import/export, saved-question privacy and manual review with immutable confirmation');

const original = (await request('/learning/analytics/settings', { account: teacher })).body.data;
await request('/learning/analytics/settings', { account: student, status: 403 });
try {
    const settings = (await request('/learning/analytics/settings', { method: 'PUT', account: teacher,
        data: { lowPerformanceThreshold: 80, criticalPerformanceThreshold: 99, targetAccuracy: 90,
            minAttemptsForAlert: 0, weakSubjectMinQuestions: 100, studentHistoryLimit: 1, cohortHistoryLimit: 99999 },
    })).body.data;
    assert.equal(settings.criticalPerformanceThreshold, 80); assert.equal(settings.minAttemptsForAlert, 1);
    assert.equal(settings.weakSubjectMinQuestions, 50); assert.equal(settings.studentHistoryLimit, 10); assert.equal(settings.cohortHistoryLimit, 2000);
    const stats = (await request('/learning/analytics/summary', { account: student })).body.data;
    assert.equal(stats.role, 'estudiante'); assert.equal(stats.attemptsCount, 1); assert.equal(stats.bestScore, 100);
    await request('/learning/analytics/summary', { account: teacher, status: 403 });
} finally { await request('/learning/analytics/settings', { method: 'PUT', account: teacher, data: original }); }
await request('/learning/notifications/2147483647/read', { method: 'PATCH', account: student, status: 404 });
console.log('PASS EVALUATION: bounded analytics settings, student results and rejection of unscoped teacher analytics');
