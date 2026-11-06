import assert from 'node:assert/strict';
import { randomUUID } from 'node:crypto';
import { expect } from '@playwright/test';
import { group, message, request, browserPage, compose, origin } from './harness.mjs';

assert.equal(JSON.parse(compose('config', '--format', 'json')).name, 'pae_qa');
const community = await group(), title = `Foro QA ${randomUUID()}`;
let groupName;
for (const member of [community.owner, community.member]) {
    const groups = (await request('/community/my-communities', { account: member })).body.communities;
    const own = groups.find(item => String(item.id) === String(community.id));
    assert.ok(own); assert.equal(own.miembros_count, 2); groupName = own.nombre;
}
await message(community, 'Mensaje QA antes de la conversación del foro');
const { browser, page } = await browserPage(community.owner);
try {
    await page.goto(`${origin}/docente/grupos/mis-grupos`);
    await expect(page.getByText(groupName, { exact: true })).toBeVisible();
    await page.goto(`${origin}/docente/grupos/explorar`);
    await expect(page.getByRole('heading', { name: 'Explorar Comunidades', exact: true })).toBeVisible();
    await page.goto(`${origin}/docente/grupos/${community.id}`);
    await page.getByRole('tab', { name: 'Foros', exact: true }).click();
    await expect(page.getByRole('heading', { name: 'Conversaciones del foro del grupo', exact: true })).toBeVisible();
    await page.getByRole('button', { name: 'Nueva publicación', exact: true }).click();
    await page.getByLabel('Título', { exact: true }).fill(title);
    await page.getByLabel('Contenido', { exact: true }).fill('Conversación sintética de integración.');
    await page.getByLabel('Etiquetas separadas por comas (hasta cinco)').fill('qa, aprendizaje');
    await page.getByRole('button', { name: 'Publicar', exact: true }).click();
    const detail = page.getByRole('article', { name: 'Detalle de la publicación' });
    await expect(detail.getByRole('heading', { name: title, exact: true })).toBeVisible();
    await page.getByLabel('Tu respuesta', { exact: true }).fill('Respuesta verificable del docente.');
    await page.route('**/api/community/forums/*/comments', route => route.fulfill({ status: 503,
        contentType: 'application/json', body: JSON.stringify({ message: 'Servicio temporalmente no disponible' }) }));
    await page.getByRole('button', { name: 'Responder', exact: true }).click();
    await expect(page.getByRole('alert')).toContainText('Servicio temporalmente no disponible');
    await expect(page.getByLabel('Tu respuesta', { exact: true })).toHaveValue('Respuesta verificable del docente.');
    await page.unroute('**/api/community/forums/*/comments');
    await page.getByRole('button', { name: 'Responder', exact: true }).click();
    await expect(detail.getByText('Respuesta verificable del docente.', { exact: true })).toHaveCount(1);
    const item = page.getByRole('listitem').filter({ has: page.getByRole('button', { name: title, exact: true }) });
    await item.getByRole('button', { name: /Me gusta/ }).click();
    await expect(item.getByRole('button', { name: /Quitar me gusta/ })).toHaveAttribute('aria-pressed', 'true');
    await item.getByRole('button', { name: /Quitar me gusta/ }).click();
    await expect(item.getByRole('button', { name: /Me gusta/ })).toHaveAttribute('aria-pressed', 'false');
    const reason = page.getByLabel('Motivo del reporte o de la acción de moderación');
    await reason.fill('Ajuste de redacción QA');
    await page.getByRole('button', { name: 'Editar publicación', exact: true }).click();
    await page.getByLabel('Título corregido').fill(`${title} revisado`);
    await page.getByLabel('Contenido corregido').fill('Contenido revisado de la conversación.');
    await page.getByRole('button', { name: 'Guardar edición', exact: true }).click();
    await expect(detail.getByRole('heading', { name: `${title} revisado`, exact: true })).toBeVisible();
    for (const [action, next] of [['Marcar resuelta', 'Reabrir'], ['Reabrir', 'Marcar resuelta']]) {
        await reason.fill('Cambio de estado QA');
        await page.getByRole('button', { name: action, exact: true }).click();
        await expect(page.getByRole('button', { name: next, exact: true })).toBeVisible();
    }
    await reason.fill('Reporte sintético para revisión');
    await page.getByRole('button', { name: 'Reportar contenido', exact: true }).click();
    await expect(page.getByText('Reporte enviado para revisión.', { exact: true })).toBeVisible();
    await page.getByRole('button', { name: 'Cerrar detalle', exact: true }).click();
    await page.getByRole('button', { name: `${title} revisado`, exact: true }).click();
    await reason.fill('Reporte revisado sin infracción');
    await page.getByRole('button', { name: 'Resolver con el motivo indicado', exact: true }).click();
    await expect(detail.getByText('Reporte revisado sin infracción', { exact: true })).toBeVisible();
    await reason.fill('Retiro de respuesta de prueba');
    await page.getByRole('button', { name: 'Retirar respuesta con motivo', exact: true }).click();
    await expect(detail.getByText('Respuesta verificable del docente.', { exact: true })).toHaveCount(0);
    await reason.fill('Retiro de publicación sintética');
    await page.getByRole('button', { name: 'Retirar publicación', exact: true }).click();
    await expect(page.getByRole('button', { name: 'Restituir tras revisión', exact: true })).toBeVisible();
    await reason.fill('Restituir tras validar permisos');
    await page.getByRole('button', { name: 'Restituir tras revisión', exact: true }).click();
    await expect(page.getByRole('button', { name: 'Editar publicación', exact: true })).toBeVisible();
    await page.getByLabel('Buscar por título o contenido').fill(`missing-${randomUUID()}`);
    await page.getByRole('button', { name: 'Buscar', exact: true }).click();
    await expect(page.getByText('No hay publicaciones para esta búsqueda.', { exact: true })).toBeVisible();
    console.log('PASS FORUM browser: create, recover failed reply, vote, edit, resolve, moderate and restore');
} catch (error) {
    console.error('Forum UI failure:', page.url(), (await page.locator('body').innerText()).slice(-1800));
    throw error;
} finally { await browser.close(); }
