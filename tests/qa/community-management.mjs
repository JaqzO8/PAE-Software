import assert from 'node:assert/strict';
import { expect } from '@playwright/test';
import { account, group, request, message, browserPage, origin, compose } from './harness.mjs';

assert.equal(JSON.parse(compose('config', '--format', 'json')).name, 'pae_qa');
const g = await group(false), outsider = await account();
const base = `/community/${g.id}`;
const challengeData = { nombre: 'Desafío semanal QA', descripcion: 'Resolver en equipo', fecha_inicio: new Date().toISOString(), fecha_fin: new Date(Date.now() + 86400000).toISOString() };
await request(`${base}/challenges`, { method: 'POST', account: g.member, data: challengeData, status: 403 });
await request(`${base}/challenges`, { account: outsider, status: 403 });
const challenge = (await request(`${base}/challenges`, { method: 'POST', account: g.owner, data: challengeData, status: 201 })).body.challenge;
assert.equal((await request(`${base}/challenges`, { account: g.member })).body.challenges[0].id_desafio, challenge.id_desafio);
await request(`${base}/challenges/${challenge.id_desafio}`, { method: 'PUT', account: g.member, data: { completado: true }, status: 403 });
const update = (await request(`${base}/challenges/${challenge.id_desafio}`, { method: 'PUT', account: g.owner, data: { nombre: 'Desafío revisado', completado: true, activo: false } })).body.challenge;
assert.equal(update.completado, true); assert.equal(update.activo, false);
await request(`${base}/challenges/2147483647`, { method: 'PUT', account: g.owner, data: { activo: false }, status: 404 });
await message(g);
await request(`${base}/performance`, { account: outsider, status: 403 });
await request('/community/2147483647/performance', { account: g.owner, status: 404 });
const performance = (await request(`${base}/performance`, { account: g.member })).body.performance;
assert.ok(Number.isFinite(performance.score) && performance.score >= 0 && performance.score <= 100);
assert.equal(performance.totals.challenges, 1); assert.equal(performance.totals.recentMessages, 1);
assert.equal(performance.topContributors[0].id, String(g.member.user.id));
assert.ok(performance.recommendedActions.length > 0);
const settings = (await request('/community/settings', { account: g.owner })).body.settings;
await request('/community/settings', { account: g.member, status: 403 });
await request('/community/settings', { method: 'PUT', account: g.member, data: { restSessionMinutes: 12 }, status: 403 });
const { browser, page } = await browserPage(g.owner);
try {
    const changed = (await request('/community/settings', { method: 'PUT', account: g.owner, data: { restSessionMinutes: 12, unrecognizedOption: 'discard' } })).body.settings;
    assert.equal(changed.restSessionMinutes, 12); assert.equal(changed.unrecognizedOption, undefined);
    await page.goto(`${origin}/docente/grupos/bienestar`);
    await page.getByRole('tab', { name: 'Parametros', exact: true }).click();
    await expect(page.getByLabel('Descanso sugerido', { exact: true })).toHaveValue('12');
    await page.getByLabel('Descanso sugerido', { exact: true }).fill('15');
    await page.getByRole('button', { name: 'Guardar parametros', exact: true }).click();
    await expect(page.getByText('Parametros actualizados', { exact: true })).toBeVisible();
    await page.reload();
    await page.getByRole('tab', { name: 'Parametros', exact: true }).click();
    await expect(page.getByLabel('Descanso sugerido', { exact: true })).toHaveValue('15');
    const hub = (await request('/community/hub', { account: g.member })).body;
    assert.equal(hub.settings.restSessionMinutes, 15); assert.equal(hub.summary.communitiesCount, 1);
    const news = (await request('/community/news?university=QA-inexistente&category=QA&search=QA', { account: g.member })).body.news;
    assert.deepEqual(news, []);
} finally {
    await browser.close(); await request('/community/settings', { method: 'PUT', account: g.owner, data: settings });
}
console.log('PASS COMMUNITY MANAGEMENT: weekly challenges, member-only analytics, settings whitelist and browser persistence');
