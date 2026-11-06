const { deliver, isParticipant } = require('../realtime/sessionDelivery');

function fixture() {
    const sockets = new Map(['active', 'revoked', 'outsider'].map(id => [id, {
        handshake: { auth: { token: id } }, emit: jest.fn(), leave: jest.fn(), disconnect: jest.fn(),
    }]));
    return { sockets, io: { sockets: { sockets, adapter: { rooms: new Map([['challenge:1', new Set(sockets.keys())]]) } } } };
}

test('Private events reach current participants only; a revoked session is disconnected', async () => {
    const { io, sockets } = fixture();
    const verifySession = jest.fn(async token => {
        if (token === 'revoked') throw new Error('Revoked');
        return { id: token };
    });
    const payload = { game: { id: 1 } };
    await deliver({ io, channel: 'challenge:1', event: 'challenge:game-updated', payload, verifySession,
        room: { participantes: [{ id: 'active' }, { id: 'revoked' }] } });
    expect(sockets.get('active').emit).toHaveBeenCalledWith('challenge:game-updated', payload);
    expect(sockets.get('revoked').emit).not.toHaveBeenCalled();
    expect(sockets.get('revoked').disconnect).toHaveBeenCalledWith(true);
    expect(sockets.get('outsider').emit).not.toHaveBeenCalled();
    expect(sockets.get('outsider').leave).toHaveBeenCalledWith('challenge:1');
    expect(verifySession).toHaveBeenCalledTimes(3);
});

test('Authority outage delivers no events, including lobby updates', async () => {
    const { io, sockets } = fixture();
    await deliver({ io, channel: 'challenge:1', event: 'rooms-updated', payload: {},
        verifySession: async () => { throw new Error('Unavailable'); } });
    for (const socket of sockets.values()) {
        expect(socket.emit).not.toHaveBeenCalled();
        expect(socket.disconnect).toHaveBeenCalledWith(true);
    }
});

test('Membership compares normalized IDs and denies absent rooms or members', () => {
    expect(isParticipant({ participantes: [{ id: '42' }] }, 42)).toBe(true);
    expect(isParticipant({ participantes: [] }, 42)).toBe(false);
    expect(isParticipant(null, 42)).toBe(false);
});
