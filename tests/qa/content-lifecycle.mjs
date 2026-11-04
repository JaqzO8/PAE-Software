import assert from 'node:assert/strict';
import { expect } from '@playwright/test';
import { account, request, compose, sql, browserPage, origin } from './harness.mjs';

assert.equal(JSON.parse(compose('config', '--format', 'json')).name, 'pae_qa');
const teacher = await account('docente'), otherTeacher = await account('docente');
const student = await account(), otherStudent = await account();
const categories = (await request('/content/categories')).body.data;
const repo = (await request('/content/repositories', { account: teacher, method: 'POST', status: 201,
    data: { titulo: 'QA ciclo de aprendizaje', descripcion: 'Lecciones verificables', publico: true,
        id_categoria: categories[0].id_categoria, tags: ['qa-ciclo'] },
})).body.data;
const repository = `/content/repositories/${repo.id_repositorio}`;
await request(repository, { account: otherTeacher, method: 'PUT', data: { titulo: 'Ajeno' }, status: [403, 404] });
await request(repository, { account: teacher, method: 'PUT', data: { descripcion: 'Contenido revisado', tags: ['qa-revisado'] } });
assert.equal((await request(repository)).body.data.descripcion, 'Contenido revisado');

const favorite = `/content/favorites/${repo.id_repositorio}`;
await request(favorite, { method: 'POST', account: student, status: 201 });
await request(favorite, { method: 'POST', account: student, status: 409 });
assert.equal((await request(`/content/favorites/check/${repo.id_repositorio}`, { account: student })).body.isFavorite, true);
assert.equal((await request(`/content/favorites/check/${repo.id_repositorio}`, { account: otherStudent })).body.isFavorite, false);
assert.ok((await request('/content/favorites', { account: student })).body.data.some(item => item.repositorio.id_repositorio === repo.id_repositorio));
await request(favorite, { method: 'DELETE', account: otherStudent, status: 404 });

for (const puntuacion of [0, 11]) await request(`${repository}/rate`, { method: 'POST', account: student, data: { puntuacion }, status: 400 });
await request(`${repository}/rate`, { method: 'POST', account: student, data: { puntuacion: 8, comentario: ' Claro ' } });
await request(`${repository}/rate`, { method: 'POST', account: otherStudent, data: { puntuacion: 6 } });
const updated = await request(`${repository}/rate`, { method: 'POST', account: student, data: { puntuacion: 10 } });
assert.equal(updated.body.data.nuevo_promedio, 8);
assert.equal(updated.body.data.total_calificaciones, 2);
assert.equal((await request(`${repository}/my-rating`, { account: student })).body.data.puntuacion, 10);
const ratings = (await request(`${repository}/ratings?page=1&limit=1`)).body;
assert.equal(ratings.data.length, 1); assert.equal(ratings.pagination.total, 2);
assert.equal(ratings.distribution.reduce((sum, item) => sum + Number(item.count), 0), 2);
console.log('PASS CONTENT lifecycle: repository ownership, favorites and transactional rating averages');

const lessonData = { id_repositorio: repo.id_repositorio, titulo: 'QA ecuaciones', descripcion: 'Práctica guiada',
    contenido: 'Resolver x + 2 = 5.', resumen_teorico: 'Restar dos a ambos lados.',
    preguntas_respuestas: [{ pregunta: 'Valor de x', respuesta: '3' }], mapa_conceptual: [{ concepto: 'Igualdad' }],
    recursos_multimedia: [], duracion_minutos: 10, publicado: true };
await request('/content/lessons', { method: 'POST', account: student, data: lessonData, status: 403 });
await request('/content/lessons', { method: 'POST', account: teacher, data: {}, status: 400 });
const lesson = (await request('/content/lessons', { method: 'POST', account: teacher, data: lessonData, status: 201 })).body.data;
const route = `/content/lessons/${lesson.id_leccion}`;
await request(route, { method: 'PUT', account: otherTeacher, data: { titulo: 'Ajeno' }, status: 403 });
await request(route, { method: 'PUT', account: teacher, data: { descripcion: 'Actualizada', mapa_conceptual: JSON.stringify(lessonData.mapa_conceptual) } });
assert.equal((await request(route, { account: student })).body.data.descripcion, 'Actualizada');
const listed = (await request(`/content/lessons?repositorio_id=${repo.id_repositorio}`, { account: student })).body.data;
assert.ok(listed.some(item => item.id_leccion === lesson.id_leccion));
for (const feature of ['summary', 'solution', 'concept-map', 'material']) await request(`${route}/${feature}`, { account: student, status: 403 });
await request(`${route}/start`, { method: 'POST', account: student });
await request(`${route}/time`, { method: 'POST', account: student, data: { tiempo_segundos: 120 } });
const elapsed = (await request(`${route}/time`, { method: 'POST', account: student, data: { tiempo_segundos: 60 } })).body.data;
assert.equal(elapsed.tiempo_segundos, 120, 'Late reports must not decrease accumulated study time');
for (let i = 0; i < 2; i++) await request(`${route}/complete`, { method: 'POST', account: student, data: { puntuacion: 9, tiempo_segundos: 150 } });
assert.equal(sql('qa_content', `SELECT count(*) FROM content_outbox_events WHERE event_type='LeccionCompletada.v1' AND payload->>'lessonId'='${lesson.id_leccion}' AND payload->>'userId'='${student.user.id}'`), '1');
assert.equal((await request(`${route}/summary`, { account: student })).body.data.resumen_teorico, lessonData.resumen_teorico);
assert.deepEqual((await request(`${route}/solution`, { account: student })).body.data.preguntas_respuestas, lessonData.preguntas_respuestas);
assert.deepEqual((await request(`${route}/concept-map`, { account: student })).body.data.mapa_conceptual, lessonData.mapa_conceptual);
const material = await request(`${route}/material`, { account: student });
assert.match(material.headers.get('content-type'), /application\/pdf/); assert.match(material.body, /^%PDF/);
await request(`${route}/summary`, { account: otherStudent, status: 403 });
console.log('PASS CONTENT lifecycle: lessons, monotonic progress, single completion event and protected learning material');

const { browser, page } = await browserPage(student);
try {
    await page.goto(`${origin}/estudiante/repositorios/${repo.id_repositorio}`);
    await expect(page.getByRole('heading', { name: repo.titulo, exact: true })).toBeVisible();
    await page.goto(`${origin}/estudiante/repositorios/${repo.id_repositorio}/lecciones/${lesson.id_leccion}`);
    await expect(page.getByRole('heading', { name: lessonData.titulo, exact: true })).toBeVisible();
    for (const [tab, button, text] of [['Resumen', 'Ver resumen', lessonData.resumen_teorico],
        ['Solucionario', 'Ver solucionario', 'Valor de x'], ['Mapa', 'Generar mapa', 'Igualdad']]) {
        await page.getByRole('tab', { name: tab, exact: true }).click();
        await page.getByRole('button', { name: button, exact: true }).click();
        await expect(page.getByText(text, { exact: true })).toBeVisible();
    }
    await page.getByRole('tab', { name: 'Material', exact: true }).click();
    const downloadPromise = page.waitForEvent('download');
    await page.getByRole('button', { name: 'Descargar PDF', exact: true }).click();
    const download = await downloadPromise;
    assert.match(download.suggestedFilename(), /\.pdf$/);
    assert.equal(await download.failure(), null);
    console.log('PASS CONTENT browser: repository detail, lesson aids and PDF download');
} finally { await browser.close(); }

for (const [path, user] of [['student', student], ['teacher', teacher]]) {
    const stats = await request(`/content/stats/${path}`, { account: user });
    assert.equal(stats.body.success, true); assert.ok(stats.body.data);
}
await request('/content/stats/study-settings', { account: student, status: 403 });
const settings = (await request('/content/stats/study-settings', { account: teacher })).body.data;
try {
    const changed = (await request('/content/stats/study-settings', { method: 'PUT', account: teacher,
        data: { restReminderMinutes: 1, longTimeMultiplier: 99, fastTimeMultiplier: 0, minTrackedSeconds: 999 },
    })).body.data;
    assert.deepEqual(changed, { restReminderMinutes: 5, longTimeMultiplier: 5, fastTimeMultiplier: 0.1, minTrackedSeconds: 600 });
} finally { await request('/content/stats/study-settings', { method: 'PUT', account: teacher, data: settings }); }

await request(`${repository}/rate`, { method: 'DELETE', account: student });
assert.equal(Number((await request(repository)).body.data.rating_promedio), 6);
await request(`${repository}/rate`, { method: 'DELETE', account: otherStudent });
assert.equal(Number((await request(repository)).body.data.rating_promedio), 0);
await request(`${repository}/rate`, { method: 'DELETE', account: student, status: 404 });
await request(favorite, { method: 'DELETE', account: student });
assert.equal((await request(`/content/favorites/check/${repo.id_repositorio}`, { account: student })).body.isFavorite, false);
await request(route, { method: 'DELETE', account: otherTeacher, status: 403 });
await request(route, { method: 'DELETE', account: teacher });
await request(route, { account: student, status: 404 });
await request(repository, { method: 'DELETE', account: teacher });
await request(repository, { status: 404 });
console.log('PASS CONTENT lifecycle: study settings, statistics, rating deletion and content retirement');

