function isParticipant(room, userId) {
    return room?.participantes?.some(person => String(person.id) === String(userId)) === true;
}

// Revalidate at delivery, including clients that connected before logout or removal.
async function deliver({ io, channel, event, payload, verifySession, room }) {
    const ids = io.sockets.adapter.rooms.get(channel) || [];
    await Promise.all([...ids].map(async id => {
        const socket = io.sockets.sockets.get(id);
        if (!socket) return;
        try {
            const user = await verifySession(socket.handshake.auth?.token);
            if (room && !isParticipant(room, user.id)) {
                await socket.leave(channel);
                return;
            }
            socket.emit(event, payload);
        } catch {
            socket.disconnect(true);
        }
    }));
}

module.exports = { isParticipant, deliver };
