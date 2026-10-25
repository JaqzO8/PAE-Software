const { fail, positiveId } = require('../domain/communityPolicy');
function createFriendshipUseCases({ withPair, findReference, findUser, clock }) {
    return {
        async request({ actor, recipientId, accessToken }) {
            const from = positiveId(actor.id), to = positiveId(recipientId);
            if (from === to) fail('SELF_FRIENDSHIP', 'No puedes enviarte una solicitud');
            await findUser(to, accessToken);
            return withPair(from, to, async repo => {
                if (await repo.current()) fail('FRIENDSHIP_EXISTS', 'Ya existe una relación o solicitud entre estos usuarios', 409);
                return repo.create({ usuario_solicitante_id: from, usuario_receptor_id: to, estado: 'pendiente', fecha_solicitud: clock.now() });
            });
        },
        async respond({ actor, friendshipId, action }) {
            if (!['accept', 'reject', 'cancel', 'remove', 'block'].includes(action)) fail('INVALID_ACTION', 'Acción inválida');
            const id = positiveId(friendshipId), userId = positiveId(actor.id);
            const reference = await findReference(id);
            if (!reference || ![reference.usuario_solicitante_id, reference.usuario_receptor_id].map(Number).includes(userId)) fail('FRIENDSHIP_NOT_FOUND', 'Solicitud no encontrada', 404);
            return withPair(reference.usuario_solicitante_id, reference.usuario_receptor_id, async repo => {
                const item = await repo.get(id);
                const recipient = Number(item.usuario_receptor_id) === userId;
                if (['accept', 'reject'].includes(action) && !recipient) fail('RECIPIENT_REQUIRED', 'Solo el destinatario responde la solicitud', 403);
                if (action === 'cancel' && recipient) fail('SENDER_REQUIRED', 'Solo el remitente cancela la solicitud', 403);
                const state = { accept: 'aceptada', reject: 'rechazada', cancel: 'cancelada', remove: 'eliminada', block: 'bloqueada' }[action];
                if (item.estado === state) return item;
                let invalidState = item.estado !== 'pendiente';
                if (action === 'remove') {
                    invalidState = item.estado !== 'aceptada';
                } else if (action === 'block') {
                    invalidState = !['aceptada', 'pendiente'].includes(item.estado);
                }
                if (invalidState) {
                    fail('FRIENDSHIP_CLOSED', 'La relación cambió; actualiza la lista', 409);
                }
                return repo.save(item, { estado: state, fecha_respuesta: clock.now() });
            });
        },
    };
}
module.exports = { createFriendshipUseCases };
