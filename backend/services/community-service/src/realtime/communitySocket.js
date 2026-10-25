const { Server } = require('socket.io');
const { createAdapter } = require('@socket.io/redis-adapter');
const Redis = require('ioredis');
const { verifySession } = require('../infrastructure/sessionAuthority');
const { Comunidad, MiembroComunidad } = require('../models');
const { positiveId, fail } = require('../domain/communityPolicy');
const config = require('../config/env');

async function attachCommunityRealtime(server, { useRedis = true, reviewIntervalMs = 5000 } = {}) {
    const origins = [process.env.FRONTEND_URL || 'http://localhost:5173', 'http://localhost:5173', 'http://127.0.0.1:5173'];
    const io = new Server(server, {
        path: '/community-socket', transports: ['websocket'], maxHttpBufferSize: 4096,
        cors: { origin: origins },
        allowRequest: (req, callback) => callback(null, !req.headers.origin || origins.includes(req.headers.origin)),
    });
    let pub, sub;
    if (useRedis) {
        pub = new Redis(config.REDIS_URL, { lazyConnect: true, maxRetriesPerRequest: 2 });
        sub = pub.duplicate();
        pub.on('error', () => console.error('Community socket publisher unavailable'));
        sub.on('error', () => console.error('Community socket subscriber unavailable'));
        await Promise.all([pub.connect(), sub.connect()]);
        io.adapter(createAdapter(pub, sub, { key: 'pae:community:socket' }));
    }
    const membership = async (communityId, actor) => {
        const group = await Comunidad.findByPk(communityId);
        const member = await MiembroComunidad.findOne({ where: { comunidad_id: communityId, usuario_id: actor.id, activo: true } });
        if (!group?.activa || !member || member.fecha_expulsion) fail('MEMBERSHIP_REQUIRED', 'Ya no tienes acceso al grupo', 403);
    };
    io.use(async (socket, next) => {
        try {
            if (typeof socket.handshake.auth.token !== 'string' || socket.handshake.auth.token.length > 8192) fail('SESSION_REQUIRED', 'Se requiere una sesión', 401);
            const actor = await verifySession(socket.handshake.auth.token);
            socket.data.userId = actor.id;
            next();
        } catch { next(new Error('Sesión no autorizada')); }
    });
    io.on('connection', socket => {
        const accessToken = socket.handshake.auth.token;
        delete socket.handshake.auth.token;
        let communityId = null, checking = false;
        let lastWindow = Date.now(), subscriptions = 0;
        const validate = async () => {
            const actor = await verifySession(accessToken);
            if (communityId !== null) await membership(communityId, actor);
            return actor;
        };
        socket.on('community:subscribe', async (input, ack) => {
            if (typeof ack !== 'function') return;
            if (Date.now() - lastWindow > 60_000) { lastWindow = Date.now(); subscriptions = 0; }
            if (++subscriptions > 12) return ack({ success: false, code: 'RATE_LIMITED' });
            try {
                const nextId = positiveId(input?.communityId);
                const actor = await verifySession(accessToken);
                await membership(nextId, actor);
                if (communityId !== null) { await socket.leave(`community:${communityId}`); await socket.leave(`community:${communityId}:user:${actor.id}`); }
                communityId = nextId;
                await socket.join(`community:${communityId}`);
                await socket.join(`community:${communityId}:user:${actor.id}`);
                ack({ success: true });
            } catch (error) { ack({ success: false, code: error.code || 'UNAVAILABLE' }); }
        });
        // Event payloads only invalidate a view; every content fetch is authorized over HTTP.
        // Passive connections are also removed when membership/session authority changes.
        const timer = setInterval(async () => {
            if (checking) return;
            checking = true;
            try { await validate(); }
            catch { socket.emit('community:access-revoked'); socket.disconnect(true); }
            finally { checking = false; }
        }, reviewIntervalMs);
        timer.unref?.();
        socket.on('disconnect', () => clearInterval(timer));
    });
    return {
        io,
        changed: id => io.to(`community:${id}`).emit('community:changed', { communityId: String(id) }),
        revokeMember: (id, userId) => io.in(`community:${id}:user:${userId}`).disconnectSockets(true),
        closeGroup: id => io.in(`community:${id}`).disconnectSockets(true),
        async close() { await new Promise(resolve => io.close(resolve)); pub?.disconnect(); sub?.disconnect(); },
    };
}
module.exports = { attachCommunityRealtime };
