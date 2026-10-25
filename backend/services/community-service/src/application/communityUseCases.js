const { fail, positiveId, requireActive, requireOwner, requireNotExpelled, invitationExpiresAt } = require('../domain/communityPolicy');

// Ports: unitOfWork(callback) supplies a transactional repository; clock.now() returns a Date; hash(str) returns a digest.
function createCommunityUseCases({ unitOfWork, clock, invitationTtlMs, findStudent, hash = (str) => Buffer.from(str).toString('hex') }) {
    if (!Number.isFinite(invitationTtlMs) || invitationTtlMs <= 0) throw new Error('Invalid invitation TTL');
    const inCommunity = (id, work) => unitOfWork(async (repo) => {
        const community = await repo.lockCommunity(positiveId(id));
        requireActive(community);
        return work(repo, community);
    });
    const activate = async (repo, community, userId, member) => {
        requireNotExpelled(member);
        if (member?.activo) return;
        await repo.saveMember(member, {
            comunidad_id: community.id_comunidad, usuario_id: userId,
            rol_comunidad: 'miembro', activo: true, fecha_union: clock.now(),
        });
    };
    const respond = async ({ invitationId, actor, accept }) => {
        const outcome = await unitOfWork(async (repo) => {
            const reference = await repo.findInvitation(positiveId(invitationId));
            if (!reference || Number(reference.estudiante_id) !== positiveId(actor.id)) {
                fail('INVITATION_NOT_FOUND', 'Invitación no encontrada', 404);
            }
            const community = await repo.lockCommunity(reference.comunidad_id);
            requireActive(community);
            const invitation = await repo.findInvitation(reference.id_invitacion);
            const member = await repo.findMember(community.id_comunidad, positiveId(actor.id));
            requireNotExpelled(member);
            if (invitation.estado === (accept ? 'aceptada' : 'rechazada')) return { replayed: true };
            if (invitation.estado !== 'pendiente') fail('INVITATION_CLOSED', 'La invitación ya no está pendiente', 409);
            if (invitationExpiresAt(invitation, invitationTtlMs) <= clock.now()) {
                await repo.saveInvitation(invitation, { estado: 'expirada', fecha_respuesta: clock.now() });
                return { expired: true }; // Commit expiry before returning HTTP 410.
            }
            if (accept) await activate(repo, community, positiveId(actor.id), member);
            await repo.saveInvitation(invitation, { estado: accept ? 'aceptada' : 'rechazada', fecha_respuesta: clock.now() });
            return { replayed: false };
        });
        if (outcome.expired) fail('INVITATION_EXPIRED', 'La invitación ha expirado', 410);
        return outcome;
    };
    return {
        publishMessage: ({ communityId, actor, content, clientId }) => inCommunity(communityId, async (repo, community) => {
            if (typeof content !== 'string' || !content.trim() || content.trim().length > 1000) fail('INVALID_MESSAGE', 'El mensaje debe tener entre 1 y 1000 caracteres');
            const member = await repo.findMember(community.id_comunidad, positiveId(actor.id));
            requireNotExpelled(member);
            if (!member?.activo) fail('MEMBERSHIP_REQUIRED', 'No eres miembro de esta comunidad', 403);
            if (clientId != null && (typeof clientId !== 'string' || !/^[a-f0-9]{8}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{12}$/i.test(clientId))) fail('INVALID_REQUEST_ID', 'Identificador de mensaje inválido');
            const requestHash = hash(content.trim());
            if (clientId) {
                const previous = await repo.findMessageRequest(community.id_comunidad, positiveId(actor.id), clientId);
                if (previous) {
                    if (previous.request_hash !== requestHash) fail('REQUEST_CONFLICT', 'El identificador ya corresponde a otro mensaje', 409);
                    return { ...previous, replayed: true };
                }
            }
            return repo.createMessage({ comunidad_id: community.id_comunidad, usuario_id: positiveId(actor.id), contenido: content.trim(), fecha_envio: clock.now(), client_id: clientId || null, request_hash: requestHash });
        }),
        changeMessage: ({ communityId, messageId, actor, content, remove, version, reason }) => inCommunity(communityId, async (repo, community) => {
            const member = await repo.findMember(community.id_comunidad, positiveId(actor.id));
            requireNotExpelled(member);
            if (!member?.activo) fail('MEMBERSHIP_REQUIRED', 'No eres miembro de esta comunidad', 403);
            const message = await repo.findMessage(community.id_comunidad, positiveId(messageId));
            if (!message) fail('MESSAGE_NOT_FOUND', 'Mensaje no encontrado', 404);
            const author = Number(message.usuario_id) === positiveId(actor.id);
            if (!author && !(remove && Number(community.profesor_id) === positiveId(actor.id))) fail('MESSAGE_FORBIDDEN', 'No puedes modificar este mensaje', 403);
            if (message.fecha_eliminacion) {
                if (remove) return message;
                fail('MESSAGE_REMOVED', 'El mensaje fue retirado', 409);
            }
            if (!Number.isInteger(version) || version !== message.version) fail('MESSAGE_VERSION_CONFLICT', 'El mensaje cambió. Actualiza la conversación', 409);
            if (remove) {
                if (!author && (typeof reason !== 'string' || !reason.trim() || reason.length > 1000)) fail('REASON_REQUIRED', 'Indica el motivo de moderación');
                return repo.saveMessage(message, { contenido: '[Mensaje retirado]', fecha_eliminacion: clock.now(), eliminado_por: positiveId(actor.id), motivo_eliminacion: author ? 'Retirado por el autor' : reason.trim(), version: message.version + 1 });
            }
            if (typeof content !== 'string' || !content.trim() || content.trim().length > 1000) fail('INVALID_MESSAGE', 'El mensaje debe tener entre 1 y 1000 caracteres');
            return repo.saveMessage(message, { contenido: content.trim(), editado: true, fecha_edicion: clock.now(), version: message.version + 1 });
        }),
        async create({ actor, input }) {
            if (actor.rol !== 'docente') fail('TEACHER_REQUIRED', 'Solo los docentes pueden crear comunidades', 403);
            if (typeof input.nombre !== 'string' || input.nombre.trim().length < 3 || input.nombre.trim().length > 100) {
                fail('INVALID_NAME', 'El nombre debe tener entre 3 y 100 caracteres');
            }
            for (const [field, limit] of [['descripcion', 4000], ['materia', 100], ['icono_url', 255]]) {
                if (input[field] != null && (typeof input[field] !== 'string' || input[field].length > limit)) fail('INVALID_INPUT', `Campo inválido: ${field}`);
            }
            if (input.es_publica !== undefined && typeof input.es_publica !== 'boolean') fail('INVALID_VISIBILITY', 'Visibilidad inválida');
            return unitOfWork(async (repo) => {
                const community = await repo.createCommunity({
                    nombre: input.nombre.trim(), descripcion: input.descripcion?.trim() || null,
                    materia: input.materia?.trim() || null, icono_url: input.icono_url || null,
                    profesor_id: positiveId(actor.id), es_publica: input.es_publica !== false, activa: true,
                });
                await repo.saveMember(null, { comunidad_id: community.id_comunidad, usuario_id: positiveId(actor.id), rol_comunidad: 'profesor', activo: true });
                return community;
            });
        },
        invite: ({ communityId, actor, studentId, accessToken }) => inCommunity(communityId, async (repo, community) => {
            requireOwner(community, actor);
            const userId = positiveId(studentId);
            if (userId === positiveId(actor.id)) fail('SELF_INVITATION', 'No puedes invitarte a ti mismo');
            await findStudent(userId, accessToken);
            const member = await repo.findMember(community.id_comunidad, userId);
            requireNotExpelled(member);
            if (member?.activo) fail('ALREADY_MEMBER', 'El usuario ya es miembro', 409);
            const previous = await repo.findInvitationFor(community.id_comunidad, userId);
            if (previous?.estado === 'pendiente' && invitationExpiresAt(previous, invitationTtlMs) > clock.now()) {
                fail('INVITATION_PENDING', 'Ya existe una invitación pendiente', 409);
            }
            if (previous?.estado === 'pendiente') await repo.saveInvitation(previous, { estado: 'expirada', fecha_respuesta: clock.now() });
            return repo.saveInvitation(null, {
                comunidad_id: community.id_comunidad, profesor_id: positiveId(actor.id), estudiante_id: userId,
                estado: 'pendiente', fecha_invitacion: clock.now(), fecha_respuesta: null,
            });
        }),
        accept: (input) => respond({ ...input, accept: true }),
        reject: (input) => respond({ ...input, accept: false }),
        revokeInvitation: ({ communityId, invitationId, actor }) => inCommunity(communityId, async (repo, community) => {
            requireOwner(community, actor);
            const invitation = await repo.findInvitation(positiveId(invitationId));
            if (!invitation || Number(invitation.comunidad_id) !== Number(community.id_comunidad)) fail('INVITATION_NOT_FOUND', 'Invitación no encontrada', 404);
            if (invitation.estado === 'revocada') return invitation;
            if (invitation.estado !== 'pendiente') fail('INVITATION_CLOSED', 'La invitación ya no está pendiente', 409);
            return repo.saveInvitation(invitation, { estado: 'revocada', fecha_respuesta: clock.now() });
        }),
        join: ({ communityId, actor }) => inCommunity(communityId, async (repo, community) => {
            if (!community.es_publica) fail('INVITATION_REQUIRED', 'Esta comunidad requiere invitación', 403);
            const member = await repo.findMember(community.id_comunidad, positiveId(actor.id));
            await activate(repo, community, positiveId(actor.id), member);
        }),
        leave: ({ communityId, actor }) => inCommunity(communityId, async (repo, community) => {
            if (Number(community.profesor_id) === positiveId(actor.id)) fail('OWNER_CANNOT_LEAVE', 'El creador debe cerrar la comunidad', 403);
            const member = await repo.findMember(community.id_comunidad, positiveId(actor.id));
            if (!member?.activo) fail('MEMBER_NOT_FOUND', 'No eres miembro de esta comunidad', 404);
            await repo.saveMember(member, { activo: false });
        }),
        kick: ({ communityId, actor, userId, reason }) => inCommunity(communityId, async (repo, community) => {
            requireOwner(community, actor);
            if (positiveId(userId) === positiveId(actor.id)) fail('OWNER_CANNOT_BE_KICKED', 'No puedes expulsar al creador', 403);
            if (typeof reason !== 'string' || !reason.trim() || reason.length > 1000) fail('REASON_REQUIRED', 'Indica un motivo de hasta 1000 caracteres');
            const member = await repo.findMember(community.id_comunidad, positiveId(userId));
            if (!member?.activo) fail('MEMBER_NOT_FOUND', 'El usuario no es miembro', 404);
            await repo.saveMember(member, { activo: false, fecha_expulsion: clock.now(), motivo_expulsion: reason.trim() });
        }),
        close: ({ communityId, actor }) => inCommunity(communityId, async (repo, community) => {
            requireOwner(community, actor);
            await repo.closeCommunity(community.id_comunidad, clock.now());
        }),
    };
}

module.exports = { createCommunityUseCases };
