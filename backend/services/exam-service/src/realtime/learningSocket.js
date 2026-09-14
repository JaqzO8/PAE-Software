const jwt = require('jsonwebtoken');
const { Server } = require('socket.io');
const config = require('../config/env');

let ioInstance = null;
const activeConnections = new Map();

const normalizeRoomId = (roomId) => {
    const value = String(roomId || '').trim();
    return /^[0-9]+$/.test(value) ? value : null;
};

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

    io.use((socket, next) => {
        const token = socket.handshake.auth?.token;
        if (!token) return next(new Error('Token requerido'));

        try {
            socket.user = jwt.verify(token, config.JWT_SECRET);
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

        socket.on('challenge:join-room', (roomId) => {
            const safeRoomId = normalizeRoomId(roomId);
            if (!safeRoomId) return;
            socket.join(`challenge:${safeRoomId}`);
        });

        socket.on('challenge:leave-room', (roomId) => {
            const safeRoomId = normalizeRoomId(roomId);
            if (!safeRoomId) return;
            socket.leave(`challenge:${safeRoomId}`);
        });

        socket.on('trivia:join-room', (roomId) => {
            const safeRoomId = normalizeRoomId(roomId);
            if (!safeRoomId) return;
            socket.join(`trivia:${safeRoomId}`);
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

const emitChallengeRoomsUpdated = (payload) => {
    if (!ioInstance) return;
    ioInstance.to('learning:lobby').emit('challenge:rooms-updated', payload);
};

const emitChallengeRoomUpdated = (roomId, payload) => {
    if (!ioInstance) return;
    ioInstance.to(`challenge:${roomId}`).emit('challenge:room-updated', payload);
    emitChallengeRoomsUpdated(payload);
};

const emitChallengeGameUpdated = (roomId, payload) => {
    if (!ioInstance) return;
    ioInstance.to(`challenge:${roomId}`).emit('challenge:game-updated', payload);
    ioInstance.to('learning:lobby').emit('challenge:game-updated', payload);
};

const emitTriviaRoomsUpdated = (payload) => {
    if (!ioInstance) return;
    ioInstance.to('learning:lobby').emit('trivia:rooms-updated', payload);
};

const emitTriviaRoomUpdated = (roomId, payload) => {
    if (!ioInstance) return;
    ioInstance.to(`trivia:${roomId}`).emit('trivia:room-updated', payload);
    emitTriviaRoomsUpdated(payload);
};

const emitTriviaGameUpdated = (roomId, payload) => {
    if (!ioInstance) return;
    ioInstance.to(`trivia:${roomId}`).emit('trivia:game-updated', payload);
    ioInstance.to('learning:lobby').emit('trivia:game-updated', payload);
};

module.exports = {
    attachLearningSocket,
    emitChallengeRoomsUpdated,
    emitChallengeRoomUpdated,
    emitChallengeGameUpdated,
    emitTriviaRoomsUpdated,
    emitTriviaRoomUpdated,
    emitTriviaGameUpdated,
};
