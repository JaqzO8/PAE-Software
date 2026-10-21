class CommunityError extends Error {
    constructor(code, message, status = 400) {
        super(message);
        this.name = 'CommunityError';
        this.code = code;
        this.status = status;
    }
}

const fail = (code, message, status) => { throw new CommunityError(code, message, status); };
const positiveId = (value) => {
    if (!/^[1-9]\d*$/.test(String(value)) || !Number.isSafeInteger(Number(value))) {
        fail('INVALID_ID', 'Identificador inválido');
    }
    return Number(value);
};
const requireActive = (community) => {
    if (!community?.activa) fail('COMMUNITY_NOT_FOUND', 'Comunidad no encontrada', 404);
};
const requireOwner = (community, actor) => {
    requireActive(community);
    if (actor.rol !== 'docente' || Number(community.profesor_id) !== positiveId(actor.id)) {
        fail('OWNER_REQUIRED', 'Solo el docente creador puede realizar esta acción', 403);
    }
};
const requireNotExpelled = (member) => {
    if (member?.fecha_expulsion) fail('MEMBER_EXPELLED', 'La membresía fue revocada', 403);
};
const invitationExpiresAt = (invitation, ttlMs) => new Date(new Date(invitation.fecha_invitacion).getTime() + ttlMs);

module.exports = { CommunityError, fail, positiveId, requireActive, requireOwner, requireNotExpelled, invitationExpiresAt };
