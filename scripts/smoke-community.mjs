import { dockerExecutable } from './lib/docker-executable.mjs';
const docker = dockerExecutable();
import assert from 'node:assert/strict';
import { randomUUID, randomBytes } from 'node:crypto';
import { execFileSync } from 'node:child_process';
import { mkdir } from 'node:fs/promises';
import path from 'node:path';
import { pathToFileURL, fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const inspect = JSON.parse(execFileSync(docker, ['inspect', 'pae-community-service'], { encoding: 'utf8' }))[0];
assert.equal(inspect.Config.Labels['com.docker.compose.project'], 'pruebas_pae');
const origin = 'http://localhost:5173';
const runId = randomUUID();
const users = [];
let communityId, resourceId, teacher, browser;
const api = async (route, { method = 'GET', account, data, status = 200 } = {}) => {
    const headers = {};
    if (account) headers.Authorization = `Bearer ${account.token}`;
    const form = data instanceof FormData;
    let body;
    if (data) {
        body = form ? data : JSON.stringify(data);
    }
    const response = await fetch(`${origin}/api${route}`, { method, headers, body });
    assert.equal(response.status, status, `${method} ${route}: expected ${status}, received ${response.status}`);
    return response.headers.get('content-type')?.includes('json') ? response.json() : response.text();
};
const register = async (label, isTeacher = false) => {
    const email = `qa.${runId}.${label}@example.test`;
    const result = await api('/auth/register', { method: 'POST', status: 201, data: {
        email, nombres: isTeacher ? 'Docente Prueba' : 'Estudiante Prueba', apellidos: 'Arquitectura',
        password: `Qa9!${randomBytes(20).toString('hex')}`, isTeacher,
    } });
    users.push(result);
    return result;
};
try {
    teacher = await register('teacher', true);
    const student = await register('student');
    const outsider = await register('outsider');
    const result = await api('/community/create', { method: 'POST', account: teacher, status: 201, data: { nombre: 'Comunidad QA Arquitectura', es_publica: false, materia: 'Matemática' } });
    communityId = result.community.id;
    const search = await api(`/community/users/search?query=${encodeURIComponent(student.user.identificador_unico)}`, { account: teacher });
    assert.ok(search.users.some(user => user.id === student.user.id));
    assert.ok(search.users.every(user => !('email' in user) && !('password_hash' in user)));

    if (process.argv.includes('--browser')) {
        const modulePath = process.env.PAE_PLAYWRIGHT_MODULE || path.join(root, '.codex/browser/node_modules/playwright/index.mjs');
        const { chromium } = await import(pathToFileURL(modulePath));
        browser = await chromium.launch({ channel: process.env.PAE_BROWSER_CHANNEL || 'chrome', headless: true });
        const pageFor = async account => {
            const context = await browser.newContext({ viewport: { width: 1366, height: 1000 } });
            await context.addInitScript(({ user, token }) => {
                localStorage.setItem('user', JSON.stringify(user));
                localStorage.setItem('token', token);
                localStorage.setItem('role', user.rol);
            }, account);
            return context.newPage();
        };
        const output = path.join(root, 'test-results/architecture');
        await mkdir(output, { recursive: true });
        const teacherPage = await pageFor(teacher);
        await teacherPage.goto(`${origin}/docente/grupos/${communityId}`);
        await teacherPage.getByLabel('Nombre o identificador del estudiante').fill(student.user.identificador_unico);
        await teacherPage.getByRole('button', { name: 'Buscar estudiantes' }).click();
        await teacherPage.getByRole('button', { name: 'Invitar', exact: true }).click();
        await teacherPage.getByText('Invitación enviada a', { exact: false }).waitFor();
        await teacherPage.screenshot({ path: path.join(output, 'docente-invitacion.png'), fullPage: true });
        const studentPage = await pageFor(student);
        await studentPage.goto(`${origin}/estudiante/grupos/mis-grupos`);
        await studentPage.getByRole('button', { name: 'Aceptar', exact: true }).click();
        await studentPage.getByText('Invitación aceptada. Ya puedes entrar a la comunidad.').waitFor();
        await studentPage.screenshot({ path: path.join(output, 'estudiante-invitacion.png'), fullPage: true });
        console.log('Browser: teacher searches/invites and student accepts successfully. Screenshots in test-results/architecture.');
    } else {
        const invitation = await api(`/community/${communityId}/invite`, { method: 'POST', account: teacher, status: 201, data: { estudiante_id: student.user.id } });
        await api(`/community/invitations/${invitation.invitation.id_invitacion}/accept`, { method: 'POST', account: student });
    }

    await api(`/community/${communityId}/messages`, { account: outsider, status: 403 });
    const message = '<script>window.paeInjected=true</script> Texto de prueba';
    await api(`/community/${communityId}/messages`, { method: 'POST', account: student, status: 201, data: { contenido: message } });
    const conversation = await api(`/community/${communityId}/messages`, { account: teacher });
    assert.ok(conversation.messages.some(item => item.content === message));
    const form = new FormData();
    const fixture = '%PDF-1.4\nPAE synthetic fixture\n%%EOF';
    form.append('file', new Blob([fixture], { type: 'application/pdf' }), 'qa-arquitectura.pdf');
    const uploaded = await api(`/community/${communityId}/resources`, { method: 'POST', account: teacher, status: 201, data: form });
    resourceId = uploaded.resource.id;
    const download = `/community/${communityId}/resources/${resourceId}/download`;
    assert.equal(await api(download, { account: student }), fixture);
    await api(download, { account: outsider, status: 403 });
    await api(`/community/${communityId}/kick/${student.user.id}`, { method: 'POST', account: teacher, data: { motivo: 'Cierre de la prueba sintética' } });
    await api(download, { account: student, status: 403 });
    await api(`/community/${communityId}/messages`, { account: student, status: 403 });
    console.log('Live smoke passed: Identity search, invitation, membership, persistent text, private PDF and expulsion through frontend/gateway.');
} finally {
    if (browser) await browser.close();
    if (resourceId) await api(`/community/${communityId}/resources/${resourceId}`, { method: 'DELETE', account: teacher });
    if (communityId) await api(`/community/${communityId}`, { method: 'DELETE', account: teacher });
    // Exact synthetic email addresses created in this invocation, never existing users.
    if (users.length) {
        const emails = users.map(account => account.user.email);
        assert.ok(emails.every(email => email.startsWith(`qa.${runId}.`) && email.endsWith('@example.test')));
        const cleanup = `const { Usuario } = require('./src/models'); const { sequelize } = require('./src/config/database');
            Usuario.update({activo:false}, {where:{email:${JSON.stringify(emails)}}}).then(()=>sequelize.close()).catch(()=>{process.exitCode=1;});`;
        execFileSync(docker, ['exec', '-i', 'pae-auth-service', 'node'], { input: cleanup, stdio: ['pipe', 'pipe', 'pipe'] });
    }
}
