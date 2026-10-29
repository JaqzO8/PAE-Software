import assert from 'node:assert/strict';
import { account, request, apiOrigin, compose } from './harness.mjs';

assert.equal(JSON.parse(compose('config', '--format', 'json')).name, 'pae_qa');
const student = await account(), outsider = await account(), teacher = await account('docente');
const planning = '/learning/planning';
const preferences = { preferredDays: [1, 3], startTime: '17:00', endTime: '19:00', subjects: ['QA integración'], remindersEnabled: true, timeZone: 'America/Lima' };
await request(`${planning}/preferences`, { method: 'PUT', account: student, data: { ...preferences, userId: outsider.user.id } });
assert.deepEqual((await request(planning, { account: student })).body.data.preference.subjects, preferences.subjects);
assert.notDeepEqual((await request(planning, { account: outsider })).body.data.preference.subjects, preferences.subjects);
console.log('PASS JUA-I01: persisted planning preferences isolate body-supplied identities');

const reminder = (await request(`${planning}/reminders`, { method: 'POST', account: student, data: {
    userId: outsider.user.id, title: 'Repaso QA', scheduledAt: new Date(Date.now() + 86400000).toISOString(), durationMinutes: 30,
} })).body.data;
assert.equal(String(reminder.id_usuario), String(student.user.id));
await request(`${planning}/reminders/${reminder.id_recordatorio}/cancel`, { method: 'PATCH', account: outsider, status: [403, 404] });
await request(`${planning}/reminders/${reminder.id_recordatorio}/cancel`, { method: 'PATCH', account: student });
await request(`${planning}/preferences`, { method: 'PUT', account: student, data: { ...preferences, timeZone: 'invalid/zone' }, status: 400 });
console.log('PASS JUA-I02: reminders persist, reject foreign cancellation and validate timezone');

const categories = (await request('/content/categories')).body.data;
const repository = (await request('/content/repositories', { method: 'POST', account: teacher, status: 201,
    data: { titulo: 'Repositorio privado QA', id_categoria: categories[0].id_categoria, publico: false },
})).body.data;
const form = new FormData();
form.set('id_repositorio', String(repository.id_repositorio)); form.set('titulo', 'Documento privado QA'); form.set('tipo_recurso', 'pdf');
form.set('file', new Blob(['%PDF-1.4\nQA private fixture\n%%EOF'], { type: 'application/pdf' }), 'qa.pdf');
const resource = (await request('/content/resources', { method: 'POST', account: teacher, data: form, status: 201 })).body.data;
const direct = `${apiOrigin}${resource.url_archivo}`;
assert.equal((await fetch(direct)).status, 401);
assert.equal((await fetch(direct, { headers: { Authorization: `Bearer ${outsider.token}` } })).status, 403);
assert.equal((await fetch(direct, { headers: { Authorization: `Bearer ${teacher.token}` } })).status, 200);
console.log('PASS JUA-I03: real private PDF rejects anonymous and foreign access');

const link = (await request(`/content/resources/${resource.id_recurso}/download`, { method: 'POST', account: teacher })).body.downloadUrl;
assert.ok(link.includes('access_token='));
await request(link, { account: teacher });
await request(link, { account: outsider, status: 401 });
await request(link, { status: 401 });
console.log('PASS JUA-I04: signed download requires the active intended user');

await request('/auth/logout', { method: 'POST', account: teacher });
await request(link, { account: teacher, status: 401 });
assert.equal((await fetch(direct, { headers: { Authorization: `Bearer ${teacher.token}` } })).status, 401);
await request('/auth/logout', { method: 'POST', account: student });
await request(planning, { account: student, status: 401 });
console.log('PASS JUA-I05: logout revokes planning and both private download paths');
process.stdout.write(compose('exec', '-T', 'content-service', 'node', '/qa/content-repository.cjs', String(teacher.user.id)));
