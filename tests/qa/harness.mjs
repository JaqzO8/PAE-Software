import assert from 'node:assert/strict';
import { randomUUID } from 'node:crypto';
import { execFileSync } from 'node:child_process';
import { mkdir, writeFile } from 'node:fs/promises';
import { createRequire } from 'node:module';
import { dockerExecutable } from '../../scripts/lib/docker-executable.mjs';
export const require = createRequire(import.meta.url);
export const origin = 'http://localhost:15173';
export const apiOrigin = 'http://127.0.0.1:13000';
export const output = new URL('../../test-results/qa/', import.meta.url);
export const docker = dockerExecutable();
export const compose = (...args) => execFileSync(docker, ['compose', '-p', 'pae_qa', '--env-file', '.env.qa', '-f', 'docker-compose.qa.yml', ...args], { encoding: 'utf8', timeout: 30000, stdio: ['pipe', 'pipe', 'pipe'] });
export function sql(database, statement) {
    assert.ok(['qa_auth', 'qa_community', 'qa_exam', 'qa_content'].includes(database));
    return compose('exec', '-T', 'postgres', 'psql', '-U', 'pae_qa', '-d', database, '-v', 'ON_ERROR_STOP=1', '-tAc', statement).trim();
}
export async function request(route, { method = 'GET', account, data, status = 200, timeout = 10000, headers: extra = {} } = {}) {
    const headers = { ...extra };
    if (account) headers.Authorization = `Bearer ${account.token}`;
    const form = data instanceof FormData;
    if (data && !form) headers['Content-Type'] = 'application/json';
    const started = performance.now();
    const response = await fetch(`${apiOrigin}/api${route}`, { method, headers, body: data ? form ? data : JSON.stringify(data) : undefined, signal: AbortSignal.timeout(timeout) });
    const text = await response.text();
    let body; try { body = JSON.parse(text); } catch { body = text; }
    const result = { status: response.status, body, ms: performance.now() - started, headers: response.headers };
    if (status !== null) assert.ok((Array.isArray(status) ? status : [status]).includes(response.status), `${method} ${route}: expected ${status}, received ${response.status}`);
    return result;
}
export async function account(role = 'estudiante') {
    const email = `qa.${randomUUID()}@example.test`, password = `Qa9!${randomUUID()}`;
    const { body } = await request('/auth/register', { method: 'POST', status: 201, data: { nombres: 'Usuario QA', apellidos: 'Sintético', email, password, isTeacher: false } });
    const result = { ...body, email, password };
    if (role !== 'estudiante') {
        assert.ok(['docente', 'admin'].includes(role));
        assert.match(String(body.user.id), /^\d+$/);
        sql('qa_auth', `UPDATE usuarios SET rol_id=(SELECT id_rol FROM roles WHERE nombre_rol='${role}') WHERE id_usuario=${body.user.id}`);
        result.user = (await request('/auth/verify', { account: result })).body.user;
    }
    return result;
}
export async function group(publicGroup = true, join = true) {
    const owner = await account('docente'), member = await account();
    const made = await request('/community/create', { method: 'POST', account: owner, status: 201, data: { nombre: `Grupo QA ${randomUUID().slice(0, 8)}`, es_publica: publicGroup } });
    const id = made.body.community.id;
    if (join) {
        if (publicGroup) await request(`/community/${id}/join`, { method: 'POST', account: member });
        else { const invitation = await invite(id, owner, member); await accept(invitation, member); }
    }
    return { id, owner, member };
}
export const invite = async (id, owner, member) => (await request(`/community/${id}/invite`, { method: 'POST', account: owner, status: 201, data: { estudiante_id: member.user.id } })).body.invitation.id_invitacion;
export const accept = (id, user, status = 200) => request(`/community/invitations/${id}/accept`, { method: 'POST', account: user, status });
export const message = (g, content = 'Mensaje QA persistente', clientId = randomUUID(), status = 201) => request(`/community/${g.id}/messages`, { method: 'POST', account: g.member, status, data: { contenido: content, client_id: clientId } });
export const messages = g => request(`/community/${g.id}/messages`, { account: g.member });
export function metrics(responses, maxP95 = 5000) {
    const values = responses.map(item => item.ms).sort((a, b) => a - b);
    const percentile = value => values[Math.min(values.length - 1, Math.ceil(values.length * value) - 1)];
    const result = { requests: values.length, meanMs: values.reduce((sum, value) => sum + value, 0) / values.length, medianMs: percentile(.5), p95Ms: percentile(.95), p99Ms: percentile(.99), maxP95Ms: maxP95, serverErrors: responses.filter(item => item.status >= 500).length };
    assert.ok(result.p95Ms <= maxP95, `p95 ${result.p95Ms.toFixed(1)} ms > ${maxP95} ms`);
    assert.equal(result.serverErrors, 0);
    return result;
}
export async function wave(count, concurrency, operation) {
    const results = []; let next = 0;
    await Promise.all(Array.from({ length: concurrency }, async () => { while (next < count) results.push(await operation(next++)); }));
    return results;
}
export async function sustained(operation, durationMs = 5000) {
    const results = [], start = performance.now();
    while (performance.now() - start < durationMs) { results.push(...await wave(5, 5, operation)); await new Promise(resolve => setTimeout(resolve, 200)); }
    return { ...metrics(results), durationMs: performance.now() - start };
}
export const cases = [];
export function pair(category, number, optimal, adverse) {
    for (const [mode, item] of [['O', optimal], ['P', adverse]]) cases.push({ id: `${category}-${mode}${String(number).padStart(2, '0')}`, category, mode, ...item });
}
export function scenario(title, input, expected, execute) { return { title, input, expected, execute }; }
export async function browserPage(user) {
    const { chromium } = await import('@playwright/test');
    const browser = await chromium.launch({ channel: process.env.QA_BROWSER_CHANNEL || 'chrome', headless: true });
    const page = await browser.newPage({ viewport: { width: 1366, height: 900 } });
    if (user) await page.addInitScript(data => {
        localStorage.setItem('token', data.token); localStorage.setItem('user', JSON.stringify(data.user)); localStorage.setItem('role', data.user.rol);
    }, { token: user.token, user: user.user });
    return { browser, page };
}
export async function screenshot(page, id) { await mkdir(output, { recursive: true }); await page.screenshot({ path: new URL(`${id}.png`, output).pathname.replace(/^\/(\w:)/, '$1'), fullPage: true }); }
export async function saveResults(results) {
    await mkdir(output, { recursive: true });
    await writeFile(new URL('results.json', output), JSON.stringify({ executedAt: new Date().toISOString(), environment: 'pae_qa', results }, null, 2));
}
