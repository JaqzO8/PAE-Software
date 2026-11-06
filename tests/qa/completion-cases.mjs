import assert from 'node:assert/strict';
import { expect } from '@playwright/test';
import { pair, scenario as s, account, group, request, sql, browserPage, origin, screenshot } from './harness.mjs';

const ticketData = { subject: 'Consulta privada QA', description: 'Solicitud académica verificable.', category: 'tecnico', priority: 'media' };
async function privateRepository() {
    const owner = await account('docente');
    const categories = (await request('/content/categories')).body.data;
    const repository = (await request('/content/repositories', { account: owner, method: 'POST', status: 201,
        data: { titulo: 'Repositorio privado QA', descripcion: 'Aislamiento entre cuentas', publico: false, id_categoria: categories[0].id_categoria },
    })).body.data;
    return { owner, repository };
}
async function challenge() {
    const g = await group(false);
    const path = `/community/${g.id}/challenges`;
    const created = (await request(path, { method: 'POST', account: g.owner, status: 201,
        data: { nombre: 'Desafío del propietario', descripcion: 'Regresión de identidad', fecha_inicio: new Date().toISOString(), fecha_fin: new Date(Date.now() + 86400000).toISOString() },
    })).body.challenge;
    return { g, path, created };
}

export function registerCompletionCases() {
    pair('PS', 4,
        s('Soporte completo desde interfaz hasta persistencia', 'Alumno envía ticket válido por navegador y recarga',
            'Confirmación, ticket visible tras recargar, misma identidad en API y una fila en PostgreSQL', async () => {
                const user = await account(), { browser, page } = await browserPage(user);
                try {
                    await page.goto(`${origin}/estudiante/perfil`);
                    await page.getByRole('tab', { name: 'Soporte', exact: true }).click();
                    await page.getByPlaceholder('Asunto', { exact: true }).fill(ticketData.subject);
                    await page.getByPlaceholder('Describe el problema o solicitud').fill(ticketData.description);
                    await page.getByRole('button', { name: 'Crear ticket', exact: true }).click();
                    await expect(page.getByText('Ticket creado', { exact: true })).toBeVisible();
                    await page.reload();
                    await page.getByRole('tab', { name: 'Soporte', exact: true }).click();
                    await expect(page.getByText(ticketData.subject, { exact: true })).toBeVisible();
                    assert.equal((await request('/auth/support/tickets', { account: user })).body.tickets[0].subject, ticketData.subject);
                    assert.equal(sql('qa_auth', `SELECT count(*) FROM tickets_soporte WHERE id_usuario=${user.user.id}`), '1');
                    await screenshot(page, 'PS-O04');
                } finally { await browser.close(); }
            }),
        s('Soporte ante fallo de transporte', 'Interrupción controlada del POST de soporte en el navegador con 503',
            'Error visible, formulario recuperable y ningún ticket ni confirmación ficticia', async () => {
                const user = await account(), { browser, page } = await browserPage(user);
                try {
                    await page.route('**/api/auth/support/tickets', route => route.request().method() === 'POST'
                        ? route.fulfill({ status: 503, contentType: 'application/json', body: '{"message":"QA unavailable"}' }) : route.continue());
                    await page.goto(`${origin}/estudiante/perfil`);
                    await page.getByRole('tab', { name: 'Soporte', exact: true }).click();
                    await page.getByPlaceholder('Asunto', { exact: true }).fill(ticketData.subject);
                    await page.getByPlaceholder('Describe el problema o solicitud').fill(ticketData.description);
                    await page.getByRole('button', { name: 'Crear ticket', exact: true }).click();
                    await expect(page.getByText('No se pudo crear el ticket', { exact: true })).toBeVisible();
                    await expect(page.getByPlaceholder('Asunto', { exact: true })).toHaveValue(ticketData.subject);
                    await expect(page.getByRole('button', { name: 'Crear ticket', exact: true })).toBeEnabled();
                    assert.equal(await page.getByText('Ticket creado', { exact: true }).count(), 0);
                    assert.equal(sql('qa_auth', `SELECT count(*) FROM tickets_soporte WHERE id_usuario=${user.user.id}`), '0');
                    await screenshot(page, 'PS-P04');
                } finally { await browser.close(); }
            }));

    pair('PI', 4,
        s('Identidad central autoriza contenido privado propio', 'Docente de Auth crea repositorio privado en Content y lo consulta mediante gateway',
            'Detalle y listado propio conservan el repositorio privado y su propietario', async () => {
                const { owner, repository } = await privateRepository();
                const detail = (await request(`/content/repositories/${repository.id_repositorio}`, { account: owner })).body.data;
                assert.equal(detail.id_repositorio, repository.id_repositorio);
                assert.equal(detail.publico, false);
                assert.ok((await request('/content/repositories/my', { account: owner })).body.data.some(item => item.id_repositorio === repository.id_repositorio));
            }),
        s('Contenido privado no cruza identidades', 'Otro docente autenticado y visitante anónimo consultan el mismo repositorio privado',
            'Ambos reciben 404 sin detalle; el propietario mantiene acceso', async () => {
                const { owner, repository } = await privateRepository(), other = await account('docente');
                const path = `/content/repositories/${repository.id_repositorio}`;
                for (const actor of [other, undefined]) {
                    const response = await request(path, { account: actor, status: 404 });
                    assert.equal(response.body.data, undefined);
                }
                assert.equal((await request(path, { account: owner })).body.data.id_repositorio, repository.id_repositorio);
            }));

    pair('PG', 4,
        s('Propietario de desafío conserva permisos con IDs serializados', 'Propietario de PostgreSQL y JWT actualiza y completa su desafío',
            '200 y cambios persistidos; no reaparece el rechazo 403 por diferencia de tipos', async () => {
                const { g, path, created } = await challenge();
                await request(`${path}/${created.id_desafio}`, { method: 'PUT', account: g.owner, data: { nombre: 'Desafío actualizado', completado: true } });
                const saved = (await request(path, { account: g.member })).body.challenges.find(item => item.id_desafio === created.id_desafio);
                assert.equal(saved.nombre, 'Desafío actualizado'); assert.equal(saved.completado, true);
            }),
        s('Corrección de propiedad no concede edición a terceros', 'Miembro intenta completar el desafío del docente',
            '403; nombre y estado originales permanecen intactos', async () => {
                const { g, path, created } = await challenge();
                await request(`${path}/${created.id_desafio}`, { method: 'PUT', account: g.member, status: 403, data: { nombre: 'Alterado', completado: true } });
                const saved = (await request(path, { account: g.owner })).body.challenges.find(item => item.id_desafio === created.id_desafio);
                assert.equal(saved.nombre, created.nombre); assert.equal(saved.completado, created.completado);
            }));

    pair('PA', 4,
        s('Exportación personal útil sin credenciales', 'Alumno solicita sus datos después de registrar una solicitud de soporte',
            'Perfil propio y ticket presentes; ninguna contraseña o credencial de sesión exportada', async () => {
                const user = await account();
                const ticket = (await request('/auth/support/tickets', { method: 'POST', account: user, data: ticketData, status: 201 })).body.ticket;
                const data = (await request('/auth/privacy/export', { account: user })).body.data;
                assert.equal(String(data.profile.id_usuario), String(user.user.id));
                assert.ok(data.supportTickets.some(item => item.id === ticket.id));
                assert.equal(data.profile.password_hash, undefined);
                assert.ok(data.sessions.every(item => !Object.hasOwn(item, 'token_sesion')));
            }),
        s('Exportación no acepta suplantación de otra cuenta', 'Cuenta ajena añade userId del propietario al exportar datos',
            'Solo devuelve sus propios datos y ningún ticket del propietario; anónimo recibe 401', async () => {
                const owner = await account(), other = await account();
                const ticket = (await request('/auth/support/tickets', { method: 'POST', account: owner, data: ticketData, status: 201 })).body.ticket;
                const route = `/auth/privacy/export?userId=${owner.user.id}`;
                const data = (await request(route, { account: other })).body.data;
                assert.equal(String(data.profile.id_usuario), String(other.user.id));
                assert.ok(data.supportTickets.every(item => item.id !== ticket.id));
                await request(route, { status: 401 });
            }));
}
