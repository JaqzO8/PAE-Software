const { test, before, after } = require('node:test');
const assert = require('node:assert/strict');
const request = require('supertest');
const jwt = require('jsonwebtoken');
const { mkdtemp, writeFile, rm } = require('node:fs/promises');
const os = require('node:os');
const path = require('node:path');
const http = require('node:http');
const { randomUUID } = require('node:crypto');

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
const revokedUsers = new Set();
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
        if (req.url === '/api/auth/verify') {
            const user = jwt.verify(req.headers.authorization.substring(7), config.JWT_SECRET);
            if (revokedUsers.has(Number(user.id))) { res.statusCode = 401; return res.end('{}'); }
            return res.end(JSON.stringify({ valid: true, user: { ...user, activo: true } }));
        }
        if (id === '999') { res.statusCode = 404; return res.end('{}'); }
        res.end(JSON.stringify({ user: { id, rol: id === '1' ? 'docente' : 'estudiante' } }));
    });
    await new Promise(resolve => identityServer.listen(0, '127.0.0.1', resolve));
    config.AUTH_SERVICE_URL = `http://127.0.0.1:${identityServer.address().port}`;
    await sequelize.sync();
    // Reproduce the legacy init SQL as well as Sequelize's indexes before migrating.
    await sequelize.query("ALTER TABLE invitaciones_comunidad ADD CONSTRAINT invitaciones_unique UNIQUE(comunidad_id, estudiante_id)");
    await sequelize.query("ALTER TABLE invitaciones_comunidad ADD CONSTRAINT invitaciones_comunidad_estado_check CHECK(estado IN ('pendiente', 'aceptada', 'rechazada', 'expirada'))");
    await sequelize.query("ALTER TABLE amistades ADD CONSTRAINT amistades_estado_check CHECK(estado IN ('pendiente', 'aceptada', 'rechazada', 'bloqueada'))");
    await require('../../scripts/migrate').migrate(sequelize);
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

test('each invitation issuance has an immutable identity and revoked IDs cannot be revived', async () => {
    const group = await create();
    const first = await invite(group);
    assert.equal((await request(app).post(`/api/community/${group}/invitations/${first}/revoke`).set('Authorization', token(other))).status, 403);
    assert.equal((await request(app).post(`/api/community/${group}/invitations/${first}/revoke`).set('Authorization', token(teacher))).status, 200);
    const second = await invite(group);
    assert.notEqual(first, second);
    assert.equal((await accept(first)).status, 409);
    assert.equal((await accept(second)).status, 200);
    assert.equal((await models.InvitacionComunidad.findByPk(first)).estado, 'revocada');
    const history = await request(app).get(`/api/community/${group}/invitations/history`).set('Authorization', token(teacher));
    assert.deepEqual(history.body.invitations.map(item => item.id_invitacion), [second, first]);
    assert.equal((await request(app).get(`/api/community/${group}/invitations/history`).set('Authorization', token(student))).status, 403);
});

test('expired pending emission is closed before creating a new invitation', async () => {
    const group = await create();
    const first = await invite(group);
    await models.InvitacionComunidad.update({ fecha_invitacion: new Date(Date.now() - 8 * 86400000) }, { where: { id_invitacion: first } });
    const second = await invite(group);
    assert.notEqual(first, second);
    assert.equal((await models.InvitacionComunidad.findByPk(first)).estado, 'expirada');
    assert.equal((await accept(first)).status, 409);
    assert.equal((await accept(second)).status, 200);
});

test('friendships require recipient acceptance and serialize opposite simultaneous requests', async () => {
    const a = { id: 50, rol: 'estudiante' }, b = { id: 51, rol: 'estudiante' };
    const send = (actor, to) => request(app).post('/api/community/friends/request').set('Authorization', token(actor)).send({ usuario_receptor_id: String(to.id) });
    assert.equal((await send(a, a)).status, 400);
    const results = await Promise.all(Array.from({ length: 8 }, (_, i) => i % 2 ? send(a, b) : send(b, a)));
    assert.equal(results.filter(res => res.status === 201).length, 1);
    assert.ok(results.every(res => [201, 409].includes(res.status)));
    const item = results.find(res => res.status === 201).body.friendship;
    const sender = Number(item.usuario_solicitante_id) === a.id ? a : b;
    const recipient = sender === a ? b : a;
    const respond = (actor, action) => request(app).post(`/api/community/friends/${item.id_amistad}/${action}`).set('Authorization', token(actor));
    const before = await request(app).get('/api/community/friends').set('Authorization', token(recipient));
    assert.equal(before.body.friends.length, 0);
    assert.equal(before.body.requests[0].direction, 'incoming');
    assert.equal((await respond(sender, 'accept')).status, 403);
    assert.equal((await respond(other, 'accept')).status, 404);
    assert.equal((await respond(recipient, 'accept')).status, 200);
    assert.equal((await respond(recipient, 'accept')).status, 200);
    assert.equal((await request(app).get('/api/community/friends').set('Authorization', token(sender))).body.friends.length, 1);
    assert.equal((await respond(recipient, 'remove')).status, 200);
    const next = await send(a, b);
    assert.equal(next.status, 201);
    assert.equal((await request(app).post(`/api/community/friends/${next.body.friendship.id_amistad}/block`).set('Authorization', token(b))).status, 200);
    assert.equal((await send(a, b)).status, 409);
});

test('message retries, edits, deletion and cursors preserve ordering and request identity', async () => {
    const group = await create(true);
    await request(app).post(`/api/community/${group}/join`).set('Authorization', token(student));
    const clientId = randomUUID();
    const send = content => request(app).post(`/api/community/${group}/messages`).set('Authorization', token(student)).send({ contenido: content, client_id: clientId });
    const replies = await Promise.all(Array.from({ length: 8 }, () => send('Mensaje original')));
    assert.equal(replies.filter(res => res.status === 201).length, 1);
    assert.ok(replies.every(res => [200, 201].includes(res.status)), replies.map(res => JSON.stringify(res.body)).join('\n'));
    const message = replies[0].body.message;
    assert.equal((await send('Otro contenido')).status, 409);
    const route = `/api/community/${group}/messages/${message.id}`;
    assert.equal((await request(app).patch(route).set('Authorization', token(teacher)).send({ contenido: 'Cambio ajeno', version: 1 })).status, 403);
    const edit = await request(app).patch(route).set('Authorization', token(student)).send({ contenido: 'Editado', version: 1 });
    assert.equal(edit.status, 200);
    assert.equal(edit.body.message.version, 2);
    assert.equal((await request(app).patch(route).set('Authorization', token(student)).send({ contenido: 'Cambio obsoleto', version: 1 })).status, 409);
    assert.equal((await request(app).delete(route).set('Authorization', token(teacher)).send({ version: 2 })).status, 400);
    assert.equal((await request(app).delete(route).set('Authorization', token(teacher)).send({ version: 2, motivo: 'Regla de moderación de prueba' })).status, 200);
    const replay = await send('Mensaje original');
    assert.equal(replay.status, 200);
    assert.equal(replay.body.message.content, '[Mensaje retirado]');
    assert.equal(replay.body.message.removed, true);
    for (let i = 0; i < 3; i++) await useCases.publishMessage({ communityId: group, actor: student, content: `Mensaje ${i}`, clientId: randomUUID() });
    const page = await request(app).get(`/api/community/${group}/messages?limit=2`).set('Authorization', token(student));
    assert.equal(page.status, 200);
    assert.equal(page.body.hasMore, true);
    const older = await request(app).get(`/api/community/${group}/messages?limit=2&before=${page.body.nextCursor}`).set('Authorization', token(student));
    assert.equal(new Set([...page.body.messages, ...older.body.messages].map(item => item.id)).size, 4);
    assert.equal(older.body.hasMore, false);
});

test('a valid JWT cannot bypass revoked sessions in Identity', async () => {
    const original = token(student);
    revokedUsers.add(student.id);
    try {
        assert.equal((await request(app).get('/api/community/invitations').set('Authorization', original)).status, 401);
        assert.equal((await request(app).get('/api/community/friends').set('Authorization', original)).status, 401);
    } finally { revokedUsers.delete(student.id); }
});

test('community migration is repeatable without changing invitation history', async () => {
    const count = await models.InvitacionComunidad.count();
    await require('../../scripts/migrate').migrate(sequelize);
    assert.equal(await models.InvitacionComunidad.count(), count);
    const [migrations] = await sequelize.query('SELECT name FROM community_schema_migrations');
    assert.equal(migrations.length, 2);
});

test('forums persist replies, enforce membership, moderate with versions and never leak removed content', async () => {
    const group = await create(true);
    await request(app).post(`/api/community/${group}/join`).set('Authorization', token(student));
    const base = '/api/community/forums';
    const made = await request(app).post(base).set('Authorization', token(student)).send({ title: 'Tema para discutir', question: '<script>alert(1)</script> texto literal', groupId: group, tags: ['matemática'] });
    assert.equal(made.status, 201, JSON.stringify(made.body));
    const route = `${base}/${made.body.id}`;
    assert.equal((await request(app).get(route).set('Authorization', token(other))).status, 403);
    const clientId = randomUUID();
    const comments = await Promise.all(Array.from({ length: 5 }, () => request(app).post(`${route}/comments`).set('Authorization', token(student)).send({ content: 'Una respuesta', clientId })));
    assert.ok(comments.every(item => item.status === 200));
    let detail = await request(app).get(route).set('Authorization', token(student));
    assert.equal(detail.body.comments.length, 1);
    assert.equal(detail.body.question, '<script>alert(1)</script> texto literal');
    assert.equal((await request(app).post(`${route}/comments`).set('Authorization', token(student)).send({ content: 'Cambió el reintento', clientId })).status, 409);
    const report = await request(app).post(`${route}/report`).set('Authorization', token(student)).send({ reason: 'Revisar contenido del hilo' });
    assert.equal(report.status, 200);
    assert.equal((await request(app).get(`${route}/reports`).set('Authorization', token(student))).status, 403);
    const queue = await request(app).get(`${base}?moderation=true`).set('Authorization', token(teacher));
    assert.ok(queue.body.forums.some(row => row.id === made.body.id));
    const remove = await request(app).patch(route).set('Authorization', token(teacher)).send({ action: 'remove', version: 1, reason: 'Retiro temporal para revisión' });
    assert.equal(remove.status, 200, JSON.stringify(remove.body));
    detail = await request(app).get(route).set('Authorization', token(student));
    assert.equal(detail.body.question, '[Publicación retirada]');
    assert.equal(detail.body.version, 2);
    assert.equal((await request(app).patch(route).set('Authorization', token(student)).send({ action: 'restore', version: 2, reason: 'Intento sin permiso' })).status, 403);
    assert.equal((await request(app).patch(route).set('Authorization', token(teacher)).send({ action: 'restore', version: 1, reason: 'Versión antigua' })).status, 409);
    assert.equal((await request(app).patch(route).set('Authorization', token(teacher)).send({ action: 'restore', version: 2, reason: 'Revisión final aprobada' })).status, 200);
    assert.equal((await request(app).post(`${route}/reports/${report.body.id}/resolve`).set('Authorization', token(teacher)).send({ resolution: 'Contenido revisado y restituido' })).status, 200);
    assert.equal((await request(app).delete(`${route}/comments/${detail.body.comments[0].id}`).set('Authorization', token(teacher)).send({ reason: 'Retiro de respuesta' })).status, 200);
    detail = await request(app).get(route).set('Authorization', token(student));
    assert.equal(detail.body.comments[0].content, '[Respuesta retirada]');
    await request(app).post(`/api/community/${group}/kick/${student.id}`).set('Authorization', token(teacher)).send({ motivo: 'Prueba de aislamiento del foro' });
    assert.equal((await request(app).get(route).set('Authorization', token(student))).status, 403);
    const publicPost = await request(app).post(base).set('Authorization', token(other)).send({ title: 'Foro público', question: 'Contenido público persistente' });
    assert.equal(publicPost.status, 201);
    assert.equal((await request(app).get(`${base}/${publicPost.body.id}`).set('Authorization', token(student))).status, 200);
});

test('websocket subscribes only current members, invalidates persisted messages and disconnects revoked sessions', async () => {
    const { io } = require('socket.io-client');
    const { attachCommunityRealtime } = require('../../src/realtime/communitySocket');
    const server = http.createServer(app);
    const realtime = await attachCommunityRealtime(server, { useRedis: false, reviewIntervalMs: 100 });
    app.set('communityRealtime', realtime);
    await new Promise(resolve => server.listen(0, '127.0.0.1', resolve));
    const sockets = [];
    const event = (socket, name) => new Promise((resolve, reject) => {
        const timer = setTimeout(() => { socket.off(name, onEvent); reject(new Error(`Timed out waiting for ${name}`)); }, 4000);
        function onEvent(value) { clearTimeout(timer); resolve(value); }
        socket.once(name, onEvent);
    });
    const connect = async actor => {
        const socket = io(`http://127.0.0.1:${server.address().port}`, { path: '/community-socket', transports: ['websocket'], auth: { token: token(actor).substring(7) }, autoConnect: false, reconnection: false });
        sockets.push(socket);
        const ready = event(socket, 'connect'); socket.connect(); await ready;
        return socket;
    };
    try {
        const group = await create(true);
        await request(app).post(`/api/community/${group}/join`).set('Authorization', token(student));
        const outsider = await connect(other);
        assert.equal((await outsider.timeout(2000).emitWithAck('community:subscribe', { communityId: group })).success, false);
        const member = await connect(student);
        assert.equal((await member.timeout(2000).emitWithAck('community:subscribe', { communityId: group })).success, true);
        const notification = event(member, 'community:changed');
        const written = await request(app).post(`/api/community/${group}/messages`).set('Authorization', token(teacher)).send({ contenido: 'Persistido antes de notificar', client_id: randomUUID() });
        assert.equal(written.status, 201);
        assert.deepEqual(await notification, { communityId: String(group) });
        assert.ok(await models.MensajeCanal.findByPk(written.body.message.id));
        const disconnected = event(member, 'disconnect');
        revokedUsers.add(student.id);
        await disconnected;
        assert.equal(member.connected, false);
        revokedUsers.delete(student.id);
        const reconnected = await connect(student);
        assert.equal((await reconnected.timeout(2000).emitWithAck('community:subscribe', { communityId: group })).success, true);
        const kicked = event(reconnected, 'disconnect');
        await request(app).post(`/api/community/${group}/kick/${student.id}`).set('Authorization', token(teacher)).send({ motivo: 'Prueba de revocación inmediata' });
        await kicked;
        assert.equal((await request(app).get(`/api/community/${group}/messages`).set('Authorization', token(student))).status, 403);
    } finally {
        revokedUsers.delete(student.id);
        sockets.forEach(socket => socket.disconnect());
        app.set('communityRealtime', undefined);
        await realtime.close();
    }
});
