import assert from 'node:assert/strict';
import { expect } from '@playwright/test';
import { account, browserPage, compose, origin, request } from './harness.mjs';

assert.equal(JSON.parse(compose('config', '--format', 'json')).name, 'pae_qa');
const common = [
    ['/aprendizaje/simulacros', 'Simulacros de Admisión'],
    ['/aprendizaje/preguntas-guardadas', 'Preguntas Guardadas'],
    ['/aprendizaje/desafios', 'Desafíos Colaborativos'],
    ['/aprendizaje/trivia', 'Trivia Colaborativa'],
    ['/grupos/bienestar', 'Bienestar y comunidad'],
    ['/aprendizaje/gamificacion', 'Gamificacion'],
];
for (const role of ['estudiante', 'docente']) {
    const user = await account(role);
    const { browser, page } = await browserPage(user);
    const errors = [], serverErrors = [];
    page.on('pageerror', error => errors.push(error.message));
    page.on('response', response => {
        if (response.url().includes('/api/') && response.status() >= 500) serverErrors.push(`${response.status()} ${new URL(response.url()).pathname}`);
    });
    try {
        const paths = role === 'estudiante'
            ? [['/explorar', 'Explora y Aprende'], ['/biblioteca', 'Mis Favoritos'], ['/planificacion', 'Planificacion']]
            : [['', 'Hola, Usuario'], ['/repositorios/explorar', 'Repositorios Públicos'], ['/repositorios/favoritos', 'Mis Favoritos'], ['/crear-repositorio', 'Crear Nuevo Repositorio'], ['/aprendizaje/banco-preguntas', 'Banco de Preguntas']];
        for (const [path, heading] of [...paths, ...common]) {
            await page.goto(`${origin}/${role}${path}`);
            await expect(page.getByRole('heading', { name: heading, exact: true })).toBeVisible();
            assert.equal(new URL(page.url()).pathname, `/${role}${path}`, 'Authorized routes must not redirect to login');
            // Tabs expose distinct views and must render an accessible selected panel.
            const tabs = page.getByRole('tab');
            for (let i = 0, count = await tabs.count(); i < count; i++) {
                await tabs.nth(i).click();
                await expect(tabs.nth(i)).toHaveAttribute('aria-selected', 'true');
                await expect(page.getByRole('tabpanel')).toBeVisible();
            }
            console.log(`PASS UI ${role}${path}`);
        }
        await page.goto(`${origin}/${role}/perfil`);
        for (const name of ['Información Personal', 'Seguridad', 'Preferencias', 'Soporte', 'Privacidad']) {
            const tab = page.getByRole('tab', { name, exact: true });
            await tab.click();
            await expect(tab).toHaveAttribute('aria-selected', 'true');
            await expect(page.getByRole('tabpanel')).toBeVisible();
        }
        if (role === 'estudiante') {
            await page.goto(`${origin}/docente/aprendizaje/banco-preguntas`);
            await expect(page).not.toHaveURL(/\/docente\//);
            await expect(page.getByRole('heading', { name: 'Banco de Preguntas', exact: true })).toHaveCount(0);
        } else {
            const analytics = (await request('/learning/analytics/settings', { account: user })).body.data;
            const study = (await request('/content/stats/study-settings', { account: user })).body.data;
            try {
                await page.goto(`${origin}/docente`);
                await page.getByLabel('Bajo rendimiento (%)', { exact: true }).fill('65');
                const tracking = page.locator('div.bg-card').filter({ hasText: 'Reglas de seguimiento' });
                await tracking.getByRole('button', { name: 'Guardar', exact: true }).click();
                await expect(page.getByText('Configuracion actualizada', { exact: true })).toBeVisible();
                assert.equal((await request('/learning/analytics/settings', { account: user })).body.data.lowPerformanceThreshold, 65);
                await page.getByLabel('Descanso cada (min)', { exact: true }).fill('40');
                const habits = page.locator('div.bg-card').filter({ hasText: 'Reglas de habitos de estudio' });
                await habits.getByRole('button', { name: 'Guardar', exact: true }).click();
                await expect.poll(async () => (await request('/content/stats/study-settings', { account: user })).body.data.restReminderMinutes).toBe(40);
                await page.reload();
                await expect(page.getByLabel('Descanso cada (min)', { exact: true })).toHaveValue('40');
            } finally {
                await request('/learning/analytics/settings', { method: 'PUT', account: user, data: analytics });
                await request('/content/stats/study-settings', { method: 'PUT', account: user, data: study });
            }
        }
        assert.deepEqual(errors, [], 'Pages must render without uncaught JavaScript errors');
        assert.deepEqual(serverErrors, [], 'Module navigation must not trigger backend failures');
        console.log(`PASS UI ${role}: profile panels and role isolation`);
    } finally { await browser.close(); }
}
