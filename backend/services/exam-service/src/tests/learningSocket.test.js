jest.mock('socket.io', () => ({ Server: jest.fn() }));
jest.mock('../middlewares/authMiddleware', () => ({ verifySession: jest.fn() }));
jest.mock('../models', () => ({ ChallengeRoom: { findByPk: jest.fn() }, TriviaRoom: { findByPk: jest.fn() } }));
jest.mock('../config/env', () => ({ FRONTEND_URL: 'http://localhost:5173', SOCKET_MAX_CONNECTIONS: 100 }));
const { Server } = require('socket.io');
const { attachLearningSocket } = require('../realtime/learningSocket');

let connect, handlers, socket;
beforeEach(() => {
    jest.clearAllMocks();
    handlers = {};
    socket = { id: 'test', user: { id: 1 }, handshake: { auth: { token: 'fixture' } },
        join: jest.fn().mockResolvedValue(undefined), leave: jest.fn().mockResolvedValue(undefined),
        disconnect: jest.fn(), on: jest.fn((event, callback) => { handlers[event] = callback; }) };
    Server.mockImplementation(() => ({ engine: { clientsCount: 1 }, use: jest.fn(),
        on: jest.fn((event, callback) => { if (event === 'connection') connect = callback; }) }));
    attachLearningSocket({});
});

test('a rejected lobby adapter disconnects instead of leaving an unhandled rejection', async () => {
    socket.join.mockRejectedValue(new Error('adapter unavailable'));
    await connect(socket);
    expect(socket.disconnect).toHaveBeenCalledWith(true);
});

test.each(['challenge', 'trivia'])('%s room leave awaits the adapter and disconnects on failure', async kind => {
    await connect(socket);
    await handlers[`${kind}:leave-room`]('25');
    expect(socket.leave).toHaveBeenCalledWith(`${kind}:25`);
    expect(socket.disconnect).not.toHaveBeenCalled();
    socket.leave.mockRejectedValue(new Error('adapter unavailable'));
    await handlers[`${kind}:leave-room`]('25');
    expect(socket.disconnect).toHaveBeenCalledWith(true);
});

test.each(['challenge', 'trivia'])('%s room leave rejects malformed IDs without calling the adapter', async kind => {
    await connect(socket);
    await handlers[`${kind}:leave-room`]('../private');
    expect(socket.leave).not.toHaveBeenCalled();
});
