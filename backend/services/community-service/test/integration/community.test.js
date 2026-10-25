const { test, before, after } = require('node:test');
const assert = require('node:assert/strict');
const request = require('supertest');
const jwt = require('jsonwebtoken');
const { mkdtemp, writeFile, rm } = require('node:fs/promises');
const os = require('node:os');
const path = require('node:path');
const http = require('node:http');

if (!/^pae_test_[a-f0-9]{32}$/.test(process.env.DB_NAME || '')) throw new Error('Use npm run test:docker; an isolated database is required');
const { sequelize } = require('../../src/config/database');
const models = require('../../src/models');
const { createApp } = require('../../src/app');
const config = require('../../src/config/env');
const useCases = require('../../src/bootstrap/community');
const teacher = { id: 1, rol: 'docente' };
const student = { id: 2, rol: 'estudiante' };
const other = { id: 3, rol: 'estudiante' };
const token = user => `Bearer ${jwt.sign(user, config.JWT_SECRET, { expiresIn: '10m' })}`;
let app, temp, identityServer;
const create = async (isPublic = false) => {
    const response = await request(app).post('/api/community/create').set('Authorization', token(teacher)).send({ nombre: 'Grupo de prueba', es_publica: isPublic });
    assert.equal(response.status, 201, JSON.stringify(response.body));
    return response.body.community.id;
};
const invite = async (id, user = student) => {
    const response = await request(app).post(`/api/community/${id}/invite`).set('Authorization', token(teacher)).send({ estudiante_id: user.id });
    assert.equal(response.status, 201, JSON.stringify(response.body));
    return response.body.invitation.id_invitacion;
};
const accept = (id, user = student) => request(app).post(`/api/community/invitations/${id}/accept`).set('Authorization', token(user));

before(async () => {
    // Boundary fixture: the real Community HTTP app and PostgreSQL run unchanged.
    identityServer = http.createServer((req, res) => {
        const id = req.url.split('/').pop();
        res.setHeader('Content-Type', 'application/json');
        if (id === '999') { res.statusCode = 404; return res.end('{}'); }
        res.end(JSON.stringify({ user: { id, rol: id === '1' ? 'docente' : 'estudiante' } }));
    });
    await new Promise(resolve => identityServer.listen(0, '127.0.0.1', resolve));
    config.AUTH_SERVICE_URL = `http://127.0.0.1:${identityServer.address().port}`;
    await sequelize.sync();
    temp = await mkdtemp(path.join(os.tmpdir(), 'pae-community-test-'));
    config.UPLOAD_PATH = temp;
    app = createApp();
});
after(async () => {
    if (identityServer) await new Promise(resolve => identityServer.close(resolve));
    await sequelize.close();
    require('../../src/config/redis').redis.disconnect();
    if (temp) await rm(temp, { recursive: true, force: true });
});

test('real app denies missing/expired tokens and student creation', async () => {
    assert.equal((await request(app).post('/api/community/create').send({ nombre: 'Grupo' })).status, 401);
    assert.equal((await request(app).post('/api/community/create').set('Authorization', token(student)).send({ nombre: 'Grupo' })).status, 403);
    const expired = jwt.sign(student, config.JWT_SECRET, { expiresIn: -1 });
    assert.equal((await request(app).get('/api/community/invitations').set('Authorization', `Bearer ${expired}`)).status, 401);
});

test('creation validates input and atomically adds the owner', async () => {
    const invalid = await request(app).post('/api/community/create').set('Authorization', token(teacher)).send({ nombre: 9 });
    assert.equal(invalid.status, 400);
    const id = await create();
    assert.equal(await models.MiembroComunidad.count({ where: { comunidad_id: id, usuario_id: teacher.id, rol_comunidad: 'profesor' } }), 1);
});

test('static invitation route is reachable and invitations belong to the recipient', async () => {
    const id = await create();
    const invitation = await invite(id);
    const list = await request(app).get('/api/community/invitations').set('Authorization', token(student));
    assert.equal(list.status, 200);
    assert.ok(list.body.invitations.some(row => row.id_invitacion === invitation && row.expires_at));
    assert.equal((await accept(invitation, other)).status, 404);
    assert.equal((await request(app).post(`/api/community/${id}/invite`).set('Authorization', token({ id: 9, rol: 'docente' })).send({ estudiante_id: 10 })).status, 403);
});

test('12 simultaneous accepts create one membership and return safe replays', async () => {
    const id = await create();
    const invitation = await invite(id);
    const responses = await Promise.all(Array.from({ length: 12 }, () => accept(invitation)));
    assert.ok(responses.every(res => res.status === 200), responses.map(res => res.status).join(','));
    assert.equal(responses.filter(res => !res.body.replayed).length, 1);
    assert.equal(await models.MiembroComunidad.count({ where: { comunidad_id: id, usuario_id: student.id } }), 1);
});

test('expiry is persisted and duplicate pending invitations conflict', async () => {
    const id = await create();
    const invitation = await invite(id);
    assert.equal((await request(app).post(`/api/community/${id}/invite`).set('Authorization', token(teacher)).send({ estudiante_id: student.id })).status, 409);
    await models.InvitacionComunidad.update({ fecha_invitacion: new Date(Date.now() - 8 * 86400000) }, { where: { id_invitacion: invitation } });
    assert.equal((await accept(invitation)).status, 410);
    assert.equal((await models.InvitacionComunidad.findByPk(invitation)).estado, 'expirada');
});

test('membership insert failure rolls back invitation acceptance', async () => {
    const id = await create();
    const user = { id: 777, rol: 'estudiante' };
    const invitation = await invite(id, user);
    await sequelize.query('ALTER TABLE miembros_comunidad ADD CONSTRAINT test_reject_member CHECK (usuario_id <> 777)');
    try {
        assert.equal((await accept(invitation, user)).status, 500);
        assert.equal((await models.InvitacionComunidad.findByPk(invitation)).estado, 'pendiente');
    } finally { await sequelize.query('ALTER TABLE miembros_comunidad DROP CONSTRAINT test_reject_member'); }
});

test('public details never expose conversations or members to outsiders', async () => {
    const id = await create(true);
    await useCases.publishMessage({ communityId: id, actor: teacher, content: 'Conversación privada' });
    const res = await request(app).get(`/api/community/${id}`).set('Authorization', token(other));
    assert.equal(res.status, 200);
    assert.deepEqual(res.body.community.messages, []);
    assert.deepEqual(res.body.community.participants, []);
    assert.equal((await request(app).get(`/api/community/${id}/messages`).set('Authorization', token(other))).status, 403);
});

test('expulsion blocks rejoin, invitation replay, reading, writing and files', async () => {
    const id = await create(true);
    const invitation = await invite(id);
    await accept(invitation);
    const kick = await request(app).post(`/api/community/${id}/kick/${student.id}`).set('Authorization', token(teacher)).send({ motivo: 'Incumplimiento de reglas de prueba' });
    assert.equal(kick.status, 200);
    for (const suffix of ['join', 'messages']) {
        assert.equal((await request(app).post(`/api/community/${id}/${suffix}`).set('Authorization', token(student)).send({ contenido: 'No autorizado' })).status, 403);
    }
    assert.equal((await accept(invitation)).status, 403);
    assert.equal((await request(app).get(`/api/community/${id}/resources`).set('Authorization', token(student))).status, 403);
    await assert.rejects(useCases.publishMessage({ communityId: id, actor: student, content: 'No autorizado' }), { code: 'MEMBER_EXPELLED' });
});

test('private attachments require active membership and have no static bypass', async () => {
    const id = await create();
    await writeFile(path.join(temp, 'fixture.pdf'), '%PDF-1.4 test fixture');
    const resource = await models.RecursoComunidad.create({ comunidad_id: id, profesor_id: 1, nombre_archivo: 'fixture.pdf', url_archivo: '/uploads/fixture.pdf', tipo_archivo: 'application/pdf', tamano_bytes: 21 });
    const route = `/api/community/${id}/resources/${resource.id_recurso}/download`;
    assert.equal((await request(app).get('/uploads/fixture.pdf')).status, 404);
    assert.equal((await request(app).get(route)).status, 401);
    assert.equal((await request(app).get(route).set('Authorization', token(other))).status, 403);
    const allowed = await request(app).get(route).set('Authorization', token(teacher));
    assert.equal(allowed.status, 200);
    assert.equal(allowed.headers['cache-control'], 'private, no-store');
});

test('leaving does not allow an accepted invitation to reactivate membership', async () => {
    const id = await create();
    const invitation = await invite(id);
    await accept(invitation);
    assert.equal((await request(app).post(`/api/community/${id}/leave`).set('Authorization', token(student))).status, 200);
    assert.equal((await accept(invitation)).status, 200);
    assert.equal((await models.MiembroComunidad.findOne({ where: { comunidad_id: id, usuario_id: student.id } })).activo, false);
});
