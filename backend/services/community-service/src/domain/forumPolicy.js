const { fail } = require('./communityPolicy');
function text(value, min, max) {
    if (typeof value !== 'string' || value.trim().length < min || value.trim().length > max) fail('INVALID_TEXT', `El texto debe tener entre ${min} y ${max} caracteres`);
    return value.trim();
}
function access(thread, actor, community, member) {
    if (!thread) fail('FORUM_NOT_FOUND', 'Foro no encontrado', 404);
    if (thread.community_id && (!community?.activa || !member?.activo || member.fecha_expulsion)) fail('FORUM_FORBIDDEN', 'No tienes acceso a este foro', 403);
    return actor.rol === 'admin' || Boolean(community && Number(community.profesor_id) === Number(actor.id));
}
module.exports = { text, access };
