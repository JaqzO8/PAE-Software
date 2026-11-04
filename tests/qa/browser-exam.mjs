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
    await page.getByRole('button', { name: 'Volver a Simulacros', exact: true }).click();
    await expect(page).toHaveURL(/\/simulacros$/);
    console.log('PASS EXAM browser: restored answers survive reload, partial submission is graded by the server and clears cached attempt');
} finally { await browser.close(); }
