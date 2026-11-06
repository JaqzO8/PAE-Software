import assert from 'node:assert/strict';
import { randomUUID } from 'node:crypto';
import { account, request, compose } from './harness.mjs';

assert.equal(JSON.parse(compose('config', '--format', 'json')).name, 'pae_qa');
const admin = await account('admin'), student = await account(), rejected = await account();
const login = async (user, password = user.password) => (await request('/auth/login', {
    method: 'POST', data: { email: user.email, password },
})).body;

await request('/auth/teacher/request', { method: 'POST', account: student, data: { institucion: 'x' }, status: 400 });
const approvedRequest = (await request('/auth/teacher/request', { method: 'POST', account: student, status: 201,
    data: { institucion: 'Institución QA', evidencia: 'Expediente sintético' },
})).body.solicitud.id_solicitud;
const rejectedRequest = (await request('/auth/teacher/request', { method: 'POST', account: rejected, status: 201,
    data: { institucion: 'Institución QA' },
})).body.solicitud.id_solicitud;
await request('/auth/teacher/requests', { account: student, status: 403 });
await request(`/auth/teacher/requests/${approvedRequest}/approve`, { method: 'POST', account: student, status: 403 });
const requests = (await request('/auth/teacher/requests', { account: admin })).body.solicitudes;
assert.ok(requests.some(item => item.id_solicitud === approvedRequest));
await request(`/auth/teacher/requests/${approvedRequest}/approve`, { method: 'POST', account: admin });
assert.equal((await request('/auth/verify', { account: student })).body.user.rol, 'docente');
await request(`/auth/teacher/requests/${rejectedRequest}/reject`, { method: 'POST', account: admin, data: { motivo: 'Evidencia insuficiente' } });
assert.equal((await request('/auth/verify', { account: rejected })).body.user.rol, 'estudiante');
for (const action of ['approve', 'reject']) await request(`/auth/teacher/requests/2147483647/${action}`, { method: 'POST', account: admin, status: 404 });
for (const [data, status] of [[{}, 400], [{ targetUserId: rejected.user.id, roleName: 'inventado' }, 400],
    [{ targetUserId: 2147483647, roleName: 'docente' }, 404]]) {
    await request('/auth/admin/assign-role', { method: 'POST', account: admin, data, status });
}
await request('/auth/admin/assign-role', { method: 'POST', account: rejected, data: { targetUserId: rejected.user.id, roleName: 'admin' }, status: 403 });
await request('/auth/admin/assign-role', { method: 'POST', account: admin, data: { targetUserId: student.user.id, roleName: 'estudiante' } });
assert.equal((await request('/auth/verify', { account: student })).body.user.rol, 'estudiante');
console.log('PASS AUTH lifecycle: administrator approval, rejection, role assignment and escalation prevention');

const profile = (await request('/auth/profile', { method: 'PUT', account: student,
    data: { nombres: ' Nombre QA ', institucion: ' Institución QA ', bio: ' Biografía QA ', carrera_interes: 'Ingeniería', rol: 'admin', email: admin.email },
})).body.user;
assert.equal(profile.nombres, 'Nombre QA'); assert.equal(profile.rol, 'estudiante'); assert.equal(profile.email, student.email);
const publicProfile = (await request(`/auth/user/${student.user.id}`, { account: rejected })).body.user;
assert.equal(publicProfile.bio, 'Biografía QA');
for (const key of ['email', 'password_hash', 'token']) assert.equal(publicProfile[key], undefined);
await request('/auth/user/2147483647', { account: student, status: 404 });
const code = (await request('/auth/2fa/request', { method: 'POST', account: student })).body.code;
assert.match(code, /^\d{6}$/);
await request('/auth/2fa/verify', { method: 'POST', account: student, data: { code: 'invalid' }, status: 400 });
await request('/auth/2fa/verify', { method: 'POST', account: student, data: { code } });
await request('/auth/2fa/verify', { method: 'POST', account: student, data: { code }, status: 400 });
console.log('PASS AUTH lifecycle: profile whitelist, public data minimization and single-use verification code');

const secondSession = await login(student);
assert.ok((await request('/auth/sessions', { account: student })).body.sessions.some(session => session.isCurrent));
await request('/auth/logout-all', { method: 'POST', account: student });
for (const session of [student, secondSession]) await request('/auth/verify', { account: session, status: 401 });
const resetUser = await account();
const missing = (await request('/auth/forgot-password', { method: 'POST', data: { email: `missing.${randomUUID()}@example.test` } })).body;
const reset = (await request('/auth/forgot-password', { method: 'POST', data: { email: resetUser.email } })).body;
assert.equal(missing.message, reset.message, 'Recovery must not reveal whether the account exists');
assert.equal(missing.resetToken, null); assert.match(reset.resetToken, /^[a-f0-9]{64}$/);
await request('/auth/reset-password', { method: 'POST', data: { token: reset.resetToken, newPassword: 'short' }, status: 400 });
const password = `Qa9!${randomUUID()}`;
await request('/auth/reset-password', { method: 'POST', data: { token: reset.resetToken, newPassword: password } });
await request('/auth/reset-password', { method: 'POST', data: { token: reset.resetToken, newPassword: password }, status: 400 });
await request('/auth/verify', { account: resetUser, status: 401 });
const restored = await login(resetUser, password);
await request('/auth/password', { method: 'PUT', account: restored,
    data: { currentPassword: 'Wrong9!Password', newPassword: `Qa8!${randomUUID()}` }, status: 401 });
const changedPassword = `Qa7!${randomUUID()}`;
await request('/auth/password', { method: 'PUT', account: restored, data: { currentPassword: password, newPassword: changedPassword } });
await request('/auth/verify', { account: restored, status: 401 });
assert.ok((await login(resetUser, changedPassword)).token);
console.log('PASS AUTH lifecycle: session revocation, password recovery replay prevention and password change');
