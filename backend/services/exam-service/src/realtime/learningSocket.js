const { verifySession } = require('../middlewares/authMiddleware');
const { ChallengeRoom, TriviaRoom } = require('../models');
const { isParticipant, deliver } = require('./sessionDelivery');
const { Server } = require('socket.io');
const config = require('../config/env');

let ioInstance = null;
const activeConnections = new Map();

const normalizeRoomId = (roomId) => {
    const value = String(roomId || '').trim();
    return /^[0-9]+$/.test(value) ? value : null;
};

const tokenFor = socket => socket.handshake.auth?.token;

const attachLearningSocket = (server) => {
    const allowedOrigins = [
        config.FRONTEND_URL,
        config.FRONTEND_URL.replace('localhost', '127.0.0.1'),
        'http://localhost:5173',
        'http://127.0.0.1:5173',
    ];

    const io = new Server(server, {
        path: '/learning-socket',
        transports: ['websocket', 'polling'],
        maxHttpBufferSize: config.SOCKET_MAX_HTTP_BUFFER_BYTES,
        pingTimeout: config.SOCKET_PING_TIMEOUT_MS,
        pingInterval: config.SOCKET_PING_INTERVAL_MS,
        cors: {
            origin: allowedOrigins,
            credentials: true,
        },
    });

    io.use(async (socket, next) => {
        const token = socket.handshake.auth?.token;
        if (!token) return next(new Error('Token requerido'));

        try {
            socket.user = await verifySession(token);
            return next();
        } catch (error) {
            return next(new Error('Token invalido'));
        }
    });

    io.on('connection', (socket) => {
        if (io.engine.clientsCount > config.SOCKET_MAX_CONNECTIONS) {
            socket.emit('system:busy', { message: 'Servicio en vivo ocupado. Intenta nuevamente en unos segundos.' });
            socket.disconnect(true);
            return;
        }

        activeConnections.set(socket.id, {
            userId: socket.user?.id,
            connectedAt: Date.now(),
        });

        socket.join('learning:lobby');

        socket.on('challenge:join-room', async (roomId) => {
            const safeRoomId = normalizeRoomId(roomId);
            if (!safeRoomId) return;
            try {
                const user = await verifySession(tokenFor(socket));
                const room = await ChallengeRoom.findByPk(safeRoomId);
                if (isParticipant(room, user.id)) await socket.join(`challenge:${safeRoomId}`);
            } catch { socket.disconnect(true); }
        });

        socket.on('challenge:leave-room', (roomId) => {
            const safeRoomId = normalizeRoomId(roomId);
            if (!safeRoomId) return;
            socket.leave(`challenge:${safeRoomId}`);
        });

        socket.on('trivia:join-room', async (roomId) => {
            const safeRoomId = normalizeRoomId(roomId);
            if (!safeRoomId) return;
            try {
                const user = await verifySession(tokenFor(socket));
                const room = await TriviaRoom.findByPk(safeRoomId);
                if (isParticipant(room, user.id)) await socket.join(`trivia:${safeRoomId}`);
            } catch { socket.disconnect(true); }
        });

        socket.on('trivia:leave-room', (roomId) => {
            const safeRoomId = normalizeRoomId(roomId);
            if (!safeRoomId) return;
            socket.leave(`trivia:${safeRoomId}`);
        });

        socket.on('disconnect', () => {
            activeConnections.delete(socket.id);
        });
    });

    ioInstance = io;
    return io;
};

async function publish(channel, event, payload, model, roomId) {
    if (!ioInstance) return;
    try {
        const room = model ? await model.findByPk(roomId) : undefined;
        if (model && !room) return;
        await deliver({ io: ioInstance, channel, event, payload, verifySession, room });
    } catch { console.error('Realtime update unavailable'); }
}
const emitChallengeRoomsUpdated = payload => publish('learning:lobby', 'challenge:rooms-updated', payload);
const emitTriviaRoomsUpdated = payload => publish('learning:lobby', 'trivia:rooms-updated', payload);
const emitChallengeRoomUpdated = (id, payload) => {
    void publish(`challenge:${id}`, 'challenge:room-updated', payload, ChallengeRoom, id);
    void emitChallengeRoomsUpdated(payload);
};
const emitTriviaRoomUpdated = (id, payload) => {
    void publish(`trivia:${id}`, 'trivia:room-updated', payload, TriviaRoom, id);
    void emitTriviaRoomsUpdated(payload);
};
// Game state is private to current room participants; never send it to the lobby.
const emitChallengeGameUpdated = (id, payload) => publish(`challenge:${id}`, 'challenge:game-updated', payload, ChallengeRoom, id);
const emitTriviaGameUpdated = (id, payload) => publish(`trivia:${id}`, 'trivia:game-updated', payload, TriviaRoom, id);

module.exports = {
    attachLearningSocket,
    emitChallengeRoomsUpdated,
    emitChallengeRoomUpdated,
    emitChallengeGameUpdated,
    emitTriviaRoomsUpdated,
    emitTriviaRoomUpdated,
    emitTriviaGameUpdated,
};
