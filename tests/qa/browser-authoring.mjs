import assert from 'node:assert/strict';
import { randomUUID } from 'node:crypto';
import { expect } from '@playwright/test';
import { account, request, browserPage, origin, compose } from './harness.mjs';

assert.equal(JSON.parse(compose('config', '--format', 'json')).name, 'pae_qa');
const teacher = await account('docente'), student = await account();
const title = `Autoría QA ${randomUUID().slice(0, 8)}`;
const { browser, page } = await browserPage(teacher);
const errors = [];
page.on('pageerror', error => errors.push(error.message));
try {
    await page.goto(`${origin}/docente/crear-repositorio`);
    await page.getByRole('button', { name: 'Publicar Repositorio', exact: true }).click();
    await expect(page.getByText('El título debe tener al menos 5 caracteres', { exact: true })).toBeVisible();
    await page.getByLabel('Título del Repositorio').fill(title);
    const categories = (await request('/content/categories')).body.data;
    await page.getByLabel('Categoría *', { exact: true }).selectOption(String(categories[0].id_categoria));
    await page.getByLabel('Descripción', { exact: true }).fill('Repositorio creado desde la interfaz y verificado en PostgreSQL.');
    await page.getByPlaceholder('Agregar etiqueta (máx. 5)').fill('qa-editorial');
    await page.getByRole('button', { name: 'Agregar', exact: true }).click();
    await page.getByRole('button', { name: 'Publicar Repositorio', exact: true }).click();
    await expect(page).toHaveURL(/\/docente\/repositorios\/mis-repos$/);
    await expect(page.getByText(title, { exact: true })).toBeVisible();
    const repos = (await request('/content/repositories/my', { account: teacher })).body.data;
    const repo = repos.find(item => item.titulo === title);
    assert.ok(repo, 'The repository must persist for its authenticated author');
    assert.deepEqual(repo.tags.map(tag => tag.nombre), ['qa-editorial']);
    const manage = `${origin}/docente/repositorios/gestionar/${repo.id_repositorio}`;
    await page.goto(manage);
    await expect(page.getByText('No hay lecciones aun', { exact: true })).toBeVisible();
    await page.getByRole('button', { name: 'Agregar Primera Leccion', exact: true }).click();
    for (const [label, value] of [
        ['Titulo *', 'Lección editorial QA'], ['Descripcion', 'Introducción guiada'],
        ['Contenido de la leccion *', 'Resolver una ecuación conservando la igualdad.'],
        ['Resumen teorico', 'Operar en ambos lados.'], ['Preguntas y respuestas', 'Valor de x en x+2=5 | 3'],
        ['Mapa conceptual', 'Igualdad | Equilibrio'], ['Recursos multimedia', 'Referencia | https://example.test/referencia | enlace'],
        ['Duracion estimada', '20'], ['Orden', '1'],
    ]) await page.getByLabel(label, { exact: true }).fill(value);
    await page.getByRole('button', { name: 'Crear leccion', exact: true }).click();
    await expect(page).toHaveURL(manage);
    await expect(page.getByRole('heading', { name: 'Lección editorial QA', exact: true })).toBeVisible();
    const lesson = (await request(`/content/lessons?repositorio_id=${repo.id_repositorio}`, { account: teacher })).body.data[0];
    assert.deepEqual(lesson.preguntas_respuestas, [{ pregunta: 'Valor de x en x+2=5', respuesta: '3' }]);
    assert.equal(lesson.duracion_minutos, 20);
    await page.getByRole('button', { name: 'Agregar Primer Recurso', exact: true }).click();
    await page.getByLabel('Título del Recurso').fill('Referencia editorial QA');
    await page.getByLabel('Descripción', { exact: true }).fill('Material de referencia con licencia.');
    await page.getByRole('combobox').click();
    await page.getByRole('option', { name: 'Enlace Externo', exact: true }).click();
    await page.getByLabel('URL Externa', { exact: true }).fill('https://example.test/referencia');
    await page.getByLabel('Fuente / referencia', { exact: true }).fill('https://example.test/fuente');
    await page.getByLabel('Licencia / autorización', { exact: true }).fill('CC BY 4.0');
    await page.locator('form button[type="submit"]').click();
    await expect(page).toHaveURL(manage);
    await expect(page.getByRole('heading', { name: 'Referencia editorial QA', exact: true })).toBeVisible();
    const resource = (await request(`/content/resources?repositorio_id=${repo.id_repositorio}`, { account: teacher })).body.data[0];
    assert.equal(resource.publicado, false);
    assert.equal((await request(`/content/resources?repositorio_id=${repo.id_repositorio}`, { account: student })).body.data.length, 0);
    const detailRoute = `/content/repositories/${repo.id_repositorio}`;
    assert.equal((await request(detailRoute)).body.data.recursos.length, 0, 'Anonymous repository detail must not leak drafts');
    assert.equal((await request(detailRoute, { account: student })).body.data.recursos.length, 0);
    assert.equal((await request(detailRoute, { account: teacher })).body.data.recursos.length, 1);
    await page.getByRole('button', { name: 'Publicar', exact: true }).click();
    await expect(page.getByText('Publicado', { exact: true })).toBeVisible();
    assert.equal((await request(`/content/resources?repositorio_id=${repo.id_repositorio}`, { account: student })).body.data[0].id_recurso, resource.id_recurso);
    await page.reload();
    await expect(page.getByText('Publicado', { exact: true })).toBeVisible();
    // Remove only records created by this test, exercising cancel as well as confirmation.
    const lessonRow = page.locator('div.flex.border.rounded-lg').filter({ has: page.getByRole('heading', { name: 'Lección editorial QA', exact: true }) });
    page.once('dialog', dialog => dialog.dismiss());
    await lessonRow.getByRole('button').click();
    await expect(lessonRow).toBeVisible();
    page.once('dialog', dialog => dialog.accept());
    await lessonRow.getByRole('button').click();
    await expect(page.getByText('No hay lecciones aun', { exact: true })).toBeVisible();
    const resourceRow = page.locator('div.flex.border.rounded-lg').filter({ has: page.getByRole('heading', { name: 'Referencia editorial QA', exact: true }) });
    page.once('dialog', dialog => dialog.accept());
    await resourceRow.locator('button').last().click();
    await expect(page.getByRole('heading', { name: 'Recursos (0)', exact: true })).toBeVisible();
    await request(detailRoute, { method: 'PUT', account: teacher, data: { publico: false } });
    await request(detailRoute, { status: 404 });
    await request(detailRoute, { account: student, status: 404 });
    await page.reload();
    await expect(page.getByRole('heading', { name: title, exact: true })).toBeVisible();
    assert.equal((await request(detailRoute, { account: teacher })).body.data.publico, false);
    assert.deepEqual(errors, []);
    console.log('PASS AUTHORING: browser validation, repository, structured lesson, editorial publication, persistence and deletion');
} catch (error) {
    console.error('Authoring page:', page.url(), (await page.locator('body').innerText()).slice(-1800));
    throw error;
} finally { await browser.close(); }
