const { fail, positiveId } = require('../domain/communityPolicy');
const { text, access } = require('../domain/forumPolicy');
function createForumUseCases({ transaction }) {
    const inThread = (id, actor, work) => transaction(async repo => {
        const reference = await repo.thread(positiveId(id));
        if (!reference) fail('FORUM_NOT_FOUND', 'Foro no encontrado', 404);
        const group = reference.community_id ? await repo.lockGroup(reference.community_id) : null;
        const member = group ? await repo.member(group.id_comunidad, positiveId(actor.id)) : null;
        const thread = await repo.thread(reference.id, true);
        const moderator = access(thread, actor, group, member);
        return work(repo, thread, moderator);
    });
    return {
        create: ({ actor, input }) => transaction(async repo => {
            const groupId = input.groupId ? positiveId(input.groupId) : null;
            if (groupId) {
                const group = await repo.lockGroup(groupId), member = await repo.member(groupId, positiveId(actor.id));
                access({ community_id: groupId }, actor, group, member);
            }
            const tags = input.tags ?? [];
            if (!Array.isArray(tags) || tags.length > 5 || tags.some(tag => typeof tag !== 'string' || tag.trim().length < 1 || tag.length > 30)) fail('INVALID_TAGS', 'Usa hasta cinco etiquetas de 30 caracteres');
            return repo.createThread({ communityId: groupId, userId: positiveId(actor.id), title: text(input.title, 3, 160), body: text(input.question, 3, 4000), tags: [...new Set(tags.map(tag => tag.trim()))] });
        }),
        get: ({ actor, id, after }) => inThread(id, actor, async (repo, thread, moderator) => {
            if (thread.removed_at && !moderator && Number(thread.author_id) !== Number(actor.id)) fail('FORUM_REMOVED', 'La publicación fue retirada', 404);
            const comments = await repo.comments(thread.id, after ? positiveId(after) : 0);
            return { ...thread, canModerate: moderator, canEdit: Number(thread.author_id) === Number(actor.id), comments: comments.slice(0, 50), nextCommentsCursor: comments.length > 50 ? String(comments[49].id) : null };
        }),
        comment: ({ actor, id, content, clientId }) => inThread(id, actor, async (repo, thread) => {
            if (thread.removed_at || thread.resolved) fail('FORUM_CLOSED', 'Este hilo no admite nuevas respuestas', 409);
            const body = text(content, 1, 4000);
            if (typeof clientId !== 'string' || !/^[a-f0-9]{8}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{12}$/i.test(clientId)) fail('INVALID_REQUEST_ID', 'Identificador de respuesta inválido');
            const previous = await repo.commentRequest(thread.id, actor.id, clientId);
            if (previous) { if (previous.body !== body) fail('REQUEST_CONFLICT', 'Reintento incompatible', 409); return previous; }
            return repo.createComment(thread.id, actor.id, body, clientId);
        }),
        like: ({ actor, id, liked }) => inThread(id, actor, async (repo, thread) => {
            if (thread.removed_at) fail('FORUM_REMOVED', 'La publicación fue retirada', 404);
            if (typeof liked !== 'boolean') fail('INVALID_LIKE', 'Indica el estado de la reacción');
            await repo.setLike(thread.id, actor.id, liked);
        }),
        removeComment: ({ actor, id, commentId, reason }) => inThread(id, actor, async (repo, thread, moderator) => {
            const comment = await repo.comment(positiveId(commentId), thread.id);
            if (!comment) fail('COMMENT_NOT_FOUND', 'Respuesta no encontrada', 404);
            if (!moderator && Number(comment.author_id) !== Number(actor.id)) fail('FORUM_FORBIDDEN', 'No puedes retirar esta respuesta', 403);
            return repo.removeComment(comment.id, thread.id, actor.id, text(reason, 3, 1000));
        }),
        report: ({ actor, id, reason }) => inThread(id, actor, async (repo, thread) => repo.report(thread.id, actor.id, text(reason, 3, 1000))),
        update: ({ actor, id, input }) => inThread(id, actor, async (repo, thread, moderator) => {
            const author = Number(thread.author_id) === Number(actor.id);
            if (!author && !moderator) fail('FORUM_FORBIDDEN', 'No puedes administrar esta publicación', 403);
            if (!Number.isInteger(input.version) || input.version !== thread.version) fail('FORUM_VERSION_CONFLICT', 'La publicación cambió; actualiza la vista', 409);
            if (!['edit', 'resolve', 'reopen', 'remove', 'restore'].includes(input.action)) fail('INVALID_ACTION', 'Acción inválida');
            if (input.action === 'edit' && (!author || thread.removed_at)) fail('FORUM_FORBIDDEN', 'Solo el autor puede editar una publicación visible', 403);
            if (input.action === 'restore' && !moderator) fail('MODERATOR_REQUIRED', 'La restitución necesita revisión de moderación', 403);
            const reason = text(input.reason || (input.action === 'edit' ? 'Edición del autor' : ''), 3, 1000);
            return repo.update(thread, actor.id, input.action, reason, input.action === 'edit' ? { title: text(input.title, 3, 160), body: text(input.question, 3, 4000) } : null);
        }),
        reports: ({ actor, id }) => inThread(id, actor, async (repo, thread, moderator) => {
            if (!moderator) fail('MODERATOR_REQUIRED', 'No puedes consultar reportes de otros usuarios', 403);
            return repo.reports(thread.id);
        }),
        resolveReport: ({ actor, id, reportId, resolution }) => inThread(id, actor, async (repo, thread, moderator) => {
            if (!moderator) fail('MODERATOR_REQUIRED', 'No puedes resolver reportes', 403);
            return repo.resolveReport(thread.id, positiveId(reportId), actor.id, text(resolution, 3, 1000));
        }),
    };
}
module.exports = { createForumUseCases };
