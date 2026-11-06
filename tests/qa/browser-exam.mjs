import assert from 'node:assert/strict';
import { randomUUID } from 'node:crypto';
import { expect } from '@playwright/test';
import { account, request, compose, browserPage, origin } from './harness.mjs';

assert.equal(JSON.parse(compose('config', '--format', 'json')).name, 'pae_qa');
const teacher = await account('docente'), student = await account(), subject = `Exam UI ${randomUUID()}`;
for (let i = 0; i < 6; i++) await request('/learning/questions', { method: 'POST', account: teacher, status: 201, data: {
    universityId: 'unmsm', materia: subject, tema: subject, dificultad: 'facil', tipo: 'opcion_multiple',
    enunciado: `Pregunta de navegador ${i}`, opciones: ['QA correcta', 'QA incorrecta'], respuesta_correcta: 0,
} });
const exam = (await request('/learning/simulacro/start', { method: 'POST', account: student, status: 201,
    data: { universityId: 'unmsm', difficulty: 'easy', subject, questionCount: 6 },
})).body;
assert.equal(exam.questions.length, 6);
const { browser, page } = await browserPage(student);
try {
    await page.goto(`${origin}/estudiante/aprendizaje/simulacros`);
    await expect(page.getByRole('heading', { name: 'Simulacros de Admisión', exact: true })).toBeVisible();
    // Restore a server-issued attempt, exactly as a student reopening an active exam.
    await page.evaluate(simulacro => localStorage.setItem('pae.activeExam', JSON.stringify({
        simulacro, answers: Array(6).fill(null), currentQuestionIndex: 0,
        timeRemaining: simulacro.timeLimit, updatedAt: new Date().toISOString(),
    })), exam);
    await page.goto(`${origin}/estudiante/aprendizaje/simulacros/examen`);
    await expect(page.getByRole('heading', { name: 'Pregunta 1', exact: true })).toBeVisible();
    await page.getByRole('button', { name: 'A QA correcta', exact: true }).click();
    await page.getByRole('button', { name: 'Marcar', exact: true }).click();
    await page.getByRole('button', { name: 'Siguiente', exact: true }).click();
    await page.getByRole('button', { name: 'B QA incorrecta', exact: true }).click();
    await expect.poll(() => page.evaluate(() => JSON.parse(localStorage.getItem('pae.activeExam')).answers.slice(0, 2))).toEqual([0, 1]);
    await page.reload();
    await expect(page.getByRole('heading', { name: 'Pregunta 2', exact: true })).toBeVisible();
    await page.getByRole('button', { name: 'Anterior', exact: true }).click();
    await page.getByRole('button', { name: 'Finalizar Examen', exact: true }).click();
    await expect(page.getByText('¿Finalizar el examen?', { exact: true })).toBeVisible();
    const submitted = page.waitForResponse(response => response.url().endsWith('/api/learning/simulacro/submit') && response.request().method() === 'POST');
    await page.getByRole('button', { name: 'Finalizar Examen', exact: true }).last().click();
    const response = await submitted;
    assert.equal(response.status(), 200);
    const result = await response.json();
    assert.equal(result.correctAnswers, 1); assert.equal(result.totalQuestions, 6);
    await expect(page.getByRole('heading', { name: '¡Simulacro Completado!', exact: true })).toBeVisible();
    assert.equal(await page.evaluate(() => localStorage.getItem('pae.activeExam')), null);
    await page.getByRole('button', { name: 'Guardar', exact: true }).first().click();
    await expect(page.getByRole('button', { name: 'Guardada', exact: true })).toHaveCount(1);
    await page.getByRole('button', { name: 'Volver a Simulacros', exact: true }).click();
    await expect(page).toHaveURL(/\/simulacros$/);
    await page.goto(`${origin}/estudiante/aprendizaje/preguntas-guardadas`);
    await expect(page.getByRole('button', { name: 'Retirar', exact: true })).toHaveCount(1);
    await page.getByPlaceholder('Buscar por enunciado, curso o tema').fill('no-existe-qa');
    await expect(page.getByText('Aun no hay preguntas para este filtro', { exact: true })).toBeVisible();
    await page.getByPlaceholder('Buscar por enunciado, curso o tema').fill('Pregunta de navegador');
    await page.getByRole('combobox').click();
    await page.getByRole('option', { name: 'Facil', exact: true }).click();
    await page.getByRole('button', { name: 'Retirar', exact: true }).click();
    await expect(page.getByText('Pregunta retirada', { exact: true })).toBeVisible();
    assert.equal((await request('/learning/questions/saved', { account: student })).body.data.length, 0);
    console.log('PASS EXAM browser: restored answers survive reload, partial submission is graded by the server and clears cached attempt');

    const offlineExam = (await request('/learning/simulacro/start', { method: 'POST', account: student, status: 201,
        data: { universityId: 'unmsm', difficulty: 'easy', subject, questionCount: 6 },
    })).body;
    await page.evaluate(simulacro => localStorage.setItem('pae.activeExam', JSON.stringify({
        simulacro, answers: Array(6).fill(0), currentQuestionIndex: 5,
        timeRemaining: simulacro.timeLimit, updatedAt: new Date().toISOString(),
    })), offlineExam);
    await page.goto(`${origin}/estudiante/aprendizaje/simulacros/examen`);
    await expect(page.getByRole('heading', { name: 'Pregunta 6', exact: true })).toBeVisible();
    await page.context().setOffline(true);
    await page.getByRole('button', { name: 'Finalizar Examen', exact: true }).click();
    await page.getByRole('button', { name: 'Finalizar Examen', exact: true }).last().click();
    await expect(page.getByText('Envio pendiente de sincronizacion', { exact: true })).toBeVisible();
    const queued = () => page.evaluate(() => new Promise((resolve, reject) => {
        const open = indexedDB.open('pae-learning-offline', 1);
        open.onerror = () => reject(open.error);
        open.onsuccess = () => {
            const db = open.result, tx = db.transaction('offlineAttempts', 'readonly');
            const rows = tx.objectStore('offlineAttempts').getAll();
            rows.onsuccess = () => resolve(rows.result);
            tx.oncomplete = () => db.close();
        };
    }));
    const stored = await queued();
    assert.equal(stored.length, 1); assert.equal(stored[0].submission.simulacroId, offlineExam.id);
    assert.deepEqual(stored[0].submission.answers, Array(6).fill(0));
    const sync = page.waitForResponse(response => response.url().endsWith('/api/learning/simulacro/submit') && response.request().method() === 'POST');
    await page.context().setOffline(false);
    const synced = await sync; assert.equal(synced.status(), 200);
    assert.equal((await synced.json()).correctAnswers, 6);
    await expect.poll(queued).toEqual([]);
    await page.reload();
    assert.deepEqual(await queued(), []);
    console.log('PASS OFFLINE browser: IndexedDB retains exact answers without connection, reconnect grades once and clears the queue');
} finally { await browser.close(); }
