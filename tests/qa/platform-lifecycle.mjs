import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { expect } from '@playwright/test';
import { account, request, browserPage, compose, origin } from './harness.mjs';

assert.equal(JSON.parse(compose('config', '--format', 'json')).name, 'pae_qa');
const user = await account(), other = await account();
const path = '/auth/support/tickets';
await request(path, { method: 'POST', account: user, data: { subject: 'bad', description: 'Descripción suficiente' }, status: 400 });
await request(path, { method: 'POST', account: user, data: { subject: 'Asunto válido', description: 'bad' }, status: 400 });
const ticket = (await request(path, { method: 'POST', account: user, status: 201,
    data: { subject: 'Consulta QA privada', description: 'Incidencia sintética verificable.', category: 'tecnico', priority: 'media', userId: other.user.id },
})).body.ticket;
assert.ok((await request(path, { account: user })).body.tickets.some(item => item.id === ticket.id));
assert.equal((await request(path, { account: other })).body.tickets.length, 0);
const exported = (await request('/auth/privacy/export', { account: user })).body.data;
assert.equal(String(exported.profile.id_usuario), String(user.user.id));
assert.equal(exported.profile.password_hash, undefined);
assert.ok(exported.supportTickets.some(item => item.id === ticket.id));
assert.ok(exported.sessions.every(item => !Object.hasOwn(item, 'token_sesion')));
const deletion = (await request('/auth/privacy/delete-request', { method: 'POST', account: user, status: 202, data: { reason: 'Solicitud QA para revisión, sin eliminar datos.' } })).body.ticket;
assert.equal(deletion.category, 'privacidad'); assert.equal(deletion.priority, 'alta');
await request('/auth/verify', { account: user });
console.log('PASS PLATFORM: support ownership, private export without credentials and reviewed deletion request');

const { browser, page } = await browserPage(user);
try {
    await page.goto(`${origin}/estudiante/perfil`);
    await page.getByRole('tab', { name: 'Soporte', exact: true }).click();
    await expect(page.getByText(ticket.subject, { exact: true })).toBeVisible();
    await page.getByRole('button', { name: 'Crear ticket', exact: true }).click();
    await expect(page.getByText('Solicitud incompleta', { exact: true })).toBeVisible();
    await page.getByPlaceholder('Asunto', { exact: true }).fill('Consulta creada desde navegador QA');
    await page.getByPlaceholder('Describe el problema o solicitud').fill('La descripción completa se guarda desde el navegador.');
    await page.getByRole('button', { name: 'Crear ticket', exact: true }).click();
    await expect(page.getByText('Consulta creada desde navegador QA', { exact: true })).toBeVisible();
    await page.reload();
    await page.getByRole('tab', { name: 'Soporte', exact: true }).click();
    await expect(page.getByText('Consulta creada desde navegador QA', { exact: true })).toBeVisible();
    await page.getByRole('tab', { name: 'Privacidad', exact: true }).click();
    const downloadPromise = page.waitForEvent('download');
    await page.getByRole('button', { name: /Exportar datos/ }).click();
    const download = await downloadPromise;
    assert.equal(await download.failure(), null);
    assert.match(download.suggestedFilename(), /^pae-datos-\d+\.json$/);
    const content = JSON.parse(await readFile(await download.path(), 'utf8'));
    assert.equal(content.data.profile.email, user.email);
    assert.equal(content.data.profile.password_hash, undefined);
    console.log('PASS PLATFORM browser: ticket validation, persistence after reload and private JSON download');
} finally { await browser.close(); }
