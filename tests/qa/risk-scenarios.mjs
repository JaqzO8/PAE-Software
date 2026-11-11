import assert from 'node:assert/strict';
import { randomUUID } from 'node:crypto';
import { expect } from '@playwright/test';
import { account, group, request, message, messages, metrics, wave, sql, browserPage, origin, screenshot } from './harness.mjs';

export async function multiSessionIsolation() {
    const users = await Promise.all(Array.from({ length: 10 }, () => account()));
    const themes = users.map((_, i) => i % 2 ? 'dark' : 'light');
    await Promise.all(users.map((user, i) => request('/auth/preferences', { method: 'PUT', account: user, data: { theme: themes[i] } })));
    const responses = await wave(40, 10, async i => {
        const index = i % users.length, user = users[index];
        const preference = await request('/auth/preferences', { account: user });
        assert.equal(preference.body.preferences.theme, themes[index]);
        const identity = await request('/auth/verify', { account: user });
        assert.equal(String(identity.body.user.id), String(user.user.id));
        return [preference, identity];
    });
    return metrics(responses.flat());
}

export async function unauthorizedLoad() {
    const active = await account(), revoked = await account();
    await request('/auth/logout', { method: 'POST', account: revoked });
    const actors = [undefined, { token: 'invalid.jwt.signature' }, revoked];
    const responses = await wave(60, 10, async i => {
        const r = await request('/auth/preferences', { account: actors[i % actors.length], status: 401 });
        assert.equal(r.body.preferences, undefined); assert.equal(r.body.user, undefined); return r;
    });
    assert.equal(String((await request('/auth/verify', { account: active })).body.user.id), String(active.user.id));
    return metrics(responses);
}

export async function persistedWrites() {
    const g = await group(), ids = Array.from({ length: 24 }, () => randomUUID());
    const responses = await wave(24, 6, i => message(g, `Carga íntegra ${i}`, ids[i]));
    const saved = (await messages(g)).body.messages;
    assert.equal(saved.length, 24);
    assert.equal(new Set(saved.map(item => String(item.id))).size, 24);
    assert.deepEqual(new Set(saved.map(item => item.clientId)), new Set(ids));
    for (const item of saved) {
        assert.equal(item.content, `Carga íntegra ${ids.indexOf(item.clientId)}`);
        assert.equal(String(item.userId), String(g.member.user.id));
    }
    assert.equal(sql('qa_community', `SELECT count(*) FROM mensajes_canal WHERE comunidad_id=${g.id}`), '24');
    return metrics(responses);
}

export async function invalidWritesRecover() {
    const g = await group();
    const responses = await wave(12, 4, () => message(g, '', randomUUID(), 400));
    assert.equal(sql('qa_community', `SELECT count(*) FROM mensajes_canal WHERE comunidad_id=${g.id}`), '0');
    const valid = (await message(g, 'Válido después del rechazo')).body.message;
    const saved = (await messages(g)).body.messages;
    assert.equal(saved.length, 1); assert.equal(saved[0].id, valid.id); assert.equal(saved[0].content, 'Válido después del rechazo');
    return metrics(responses);
}

export async function parallelVersionedWrites() {
    const g = await group();
    const originals = await Promise.all(Array.from({ length: 8 }, (_, i) => message(g, `Inicial ${i}`)));
    const responses = await Promise.all(originals.map((r, i) => request(`/community/${g.id}/messages/${r.body.message.id}`, {
        method: 'PATCH', account: g.member, data: { contenido: `Editado ${i}`, version: 1 },
    })));
    const saved = (await messages(g)).body.messages;
    for (const [i, original] of originals.entries()) {
        const item = saved.find(m => m.id === original.body.message.id);
        assert.equal(item.content, `Editado ${i}`); assert.equal(item.version, 2);
    }
    assert.equal(saved.length, 8); return metrics(responses);
}

export async function conflictingVersionedWrites() {
    const g = await group(), original = (await message(g)).body.message;
    const responses = await Promise.all(Array.from({ length: 8 }, (_, i) => request(`/community/${g.id}/messages/${original.id}`, {
        method: 'PATCH', account: g.member, status: [200, 409], data: { contenido: `Contendiente ${i}`, version: 1 },
    })));
    assert.equal(responses.filter(r => r.status === 200).length, 1);
    assert.equal(responses.filter(r => r.status === 409).length, 7);
    const winner = responses.findIndex(r => r.status === 200), saved = (await messages(g)).body.messages;
    assert.equal(saved.length, 1); assert.equal(saved[0].content, `Contendiente ${winner}`); assert.equal(saved[0].version, 2);
    return metrics(responses);
}

export async function paginatedHistory() {
    const g = await group(), foreign = await group();
    await message(foreign, 'Contenido ajeno que no debe aparecer');
    sql('qa_community', `INSERT INTO mensajes_canal(comunidad_id,usuario_id,contenido,fecha_envio) SELECT ${g.id},${g.member.user.id},'Historial ' || n,now() FROM generate_series(1,500) AS n`);
    let cursor = null; const ids = new Set(), contents = new Set(), responses = [];
    do {
        const r = await request(`/community/${g.id}/messages?limit=80${cursor ? `&before=${cursor}` : ''}`, { account: g.member });
        responses.push(r); assert.ok(r.body.messages.length <= 80);
        for (const item of r.body.messages) {
            assert.ok(!ids.has(String(item.id)), 'No debe haber duplicados entre páginas');
            if (cursor) assert.ok(BigInt(item.id) < BigInt(cursor));
            assert.equal(String(item.userId), String(g.member.user.id));
            ids.add(String(item.id)); contents.add(item.content);
        }
        cursor = r.body.nextCursor;
        assert.ok(responses.length <= 7, 'La paginación no termina');
    } while (cursor);
    assert.equal(ids.size, 500);
    assert.deepEqual(contents, new Set(Array.from({ length: 500 }, (_, i) => `Historial ${i + 1}`)));
    const plan = JSON.parse(sql('qa_community', `EXPLAIN (ANALYZE,BUFFERS,FORMAT JSON) SELECT id_mensaje FROM mensajes_canal WHERE comunidad_id=${g.id} ORDER BY id_mensaje DESC LIMIT 80`));
    assert.ok(plan[0]['Execution Time'] <= 100);
    return { ...metrics(responses), databaseExecutionMs: plan[0]['Execution Time'], pages: responses.length, distinctRows: ids.size };
}

export async function oversizeRecovery() {
    const user = await account();
    const verify = async () => {
        const r = await request('/auth/verify', { account: user });
        assert.equal(String(r.body.user.id), String(user.user.id)); return r;
    };
    const baseline = metrics(await wave(20, 2, verify));
    const rejected = await wave(100, 5, () => request('/auth/profile', { method: 'PUT', account: user, status: 413, data: { bio: 'x'.repeat(120000) } }));
    const recoveryBudgetMs = Math.max(1000, baseline.p95Ms * 3);
    const recovery = metrics(await wave(20, 2, verify), recoveryBudgetMs);
    return { baseline, rejected: metrics(rejected), recovery, recoveryBudgetMs };
}

export async function resolvedForumJourney() {
    const student = await account(), teacher = await account('docente'), title = `Consulta académica ${randomUUID()}`;
    const forum = (await request('/community/forums', { method: 'POST', account: student, status: 201,
        data: { title, question: '¿Cómo puedo comprobar la solución del ejercicio?' } })).body;
    const reply = 'Verifica sustituyendo la solución en la ecuación original.';
    await request(`/community/forums/${forum.id}/comments`, { method: 'POST', account: teacher, data: { content: reply, clientId: randomUUID() } });
    const { browser, page } = await browserPage(student), errors = [];
    page.on('pageerror', error => errors.push(error.message));
    try {
        await page.goto(`${origin}/estudiante/grupos/foros`);
        await page.getByRole('button', { name: title, exact: true }).click();
        await expect(page.getByRole('article', { name: 'Detalle de la publicación' }).getByText(reply, { exact: true })).toBeVisible();
        await page.getByLabel('Motivo del reporte o de la acción de moderación').fill('La respuesta permitió resolver mi consulta');
        await page.getByRole('button', { name: 'Marcar resuelta', exact: true }).click();
        await expect(page.getByRole('button', { name: 'Reabrir', exact: true })).toBeVisible();
        await page.reload();
        await page.getByRole('button', { name: title, exact: true }).click();
        await expect(page.getByRole('button', { name: 'Reabrir', exact: true })).toBeVisible();
        const saved = (await request(`/community/forums/${forum.id}`, { account: student })).body;
        assert.equal(saved.isResolved, true); assert.equal(saved.comments.length, 1); assert.deepEqual(errors, []);
        await screenshot(page, 'PS-O03');
    } finally { await browser.close(); }
}
