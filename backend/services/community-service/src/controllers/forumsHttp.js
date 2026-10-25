const express = require('express');
const rateLimit = require('express-rate-limit');
const { sequelize } = require('../config/database');
const { verifyToken } = require('../middlewares/authMiddleware');
const { positiveId, fail } = require('../domain/communityPolicy');
const { findUser } = require('../infrastructure/identityDirectory');
const { createForumUseCases } = require('../application/forumUseCases');
const { createForumRepository } = require('../infrastructure/postgresForums');
const cases = createForumUseCases(createForumRepository(sequelize));
const router = express.Router();
router.use(verifyToken);
const writeLimit = rateLimit({ windowMs: 60_000, max: 30, keyGenerator: req => String(req.user.id), message: { success: false, message: 'Espera antes de publicar de nuevo' } });
const query = async (sql, replacements) => (await sequelize.query(sql, { replacements }))[0];
const handle = work => async (req, res, next) => { try { await work(req, res); } catch (error) { next(error); } };
async function present(rows, req) {
    const users = new Map();
    await Promise.all([...new Set(rows.map(row => row.author_id))].map(async id => { try { users.set(Number(id), await findUser(id, req.token)); } catch { /* Missing profile never invents identity. */ } }));
    return rows.map(row => {
        const user = users.get(Number(row.author_id));
        return { id: String(row.id), authorId: String(row.author_id), author: user ? `${user.nombres || ''} ${user.apellidos || ''}`.trim() || 'Usuario' : 'Usuario',
            authorRole: user?.rol || 'estudiante', authorAvatar: user?.avatar || undefined,
            title: row.title, question: row.removed_at ? '[Publicación retirada]' : row.body, content: row.removed_at ? '[Respuesta retirada]' : row.body,
            tags: row.tags || [], groupName: row.group_name || (row.community_id ? 'Comunidad' : 'Foro público'), groupId: row.community_id ? String(row.community_id) : null,
            likes: Number(row.likes || 0), comments: Number(row.comments || 0), isLiked: Boolean(row.is_liked),
            createdAt: new Date(row.created_at).toLocaleString('es-PE'), createdAtISO: row.created_at,
            isResolved: Boolean(row.resolved), removed: Boolean(row.removed_at), version: row.version,
        };
    });
}
router.get('/', handle(async (req, res) => {
    const search = req.query.search || '';
    if (typeof search !== 'string' || search.length > 100) fail('INVALID_QUERY', 'Búsqueda inválida');
    const groupId = req.query.groupId ? positiveId(req.query.groupId) : null;
    const mine = req.query.mine === 'true';
    const moderation = req.query.moderation === 'true';
    if (moderation && !['admin', 'docente'].includes(req.user.rol)) fail('MODERATOR_REQUIRED', 'No tienes permisos de moderación', 403);
    const before = req.query.before ? positiveId(req.query.before) : 2147483647;
    const rows = await query(`SELECT f.*,c.nombre AS group_name,
      (SELECT COUNT(*) FROM forum_likes l WHERE l.thread_id=f.id) AS likes,
      (SELECT COUNT(*) FROM forum_comments r WHERE r.thread_id=f.id AND r.removed_at IS NULL) AS comments,
      EXISTS(SELECT 1 FROM forum_likes l WHERE l.thread_id=f.id AND l.user_id=:userId) AS is_liked
      FROM forum_threads f LEFT JOIN comunidades c ON c.id_comunidad=f.community_id
      WHERE f.id < :before AND (f.removed_at IS NULL OR (:mine AND f.author_id=:userId) OR :moderation)
        AND (NOT :mine OR f.author_id=:userId)
        AND (${groupId ? 'f.community_id=:groupId' : mine || moderation ? 'true' : 'f.community_id IS NULL'})
        AND (NOT :moderation OR ((:isAdmin OR c.profesor_id=:userId) AND (f.removed_at IS NOT NULL OR EXISTS(SELECT 1 FROM forum_reports r WHERE r.thread_id=f.id AND r.status='pending'))))
        AND (f.community_id IS NULL OR :moderation OR (c.activa AND (c.profesor_id=:userId OR :isAdmin OR EXISTS(SELECT 1 FROM miembros_comunidad m WHERE m.comunidad_id=f.community_id AND m.usuario_id=:userId AND m.activo AND m.fecha_expulsion IS NULL))))
        AND (f.title ILIKE :search OR f.body ILIKE :search)
      ORDER BY f.id DESC LIMIT 31`, { userId: positiveId(req.user.id), groupId, mine, moderation, isAdmin: req.user.rol === 'admin', before, search: `%${search}%` });
    res.json({ forums: await present(rows.slice(0, 30), req), nextCursor: rows.length > 30 ? String(rows[29].id) : null });
}));
router.post('/', writeLimit, handle(async (req, res) => {
    const thread = await cases.create({ actor: req.user, input: req.body });
    res.status(201).json((await present([thread], req))[0]);
}));
router.get('/:threadId', handle(async (req, res) => {
    const thread = await cases.get({ actor: req.user, id: req.params.threadId, after: req.query.after });
    const stats = (await query('SELECT COUNT(*) AS likes, bool_or(user_id=:userId) AS is_liked FROM forum_likes WHERE thread_id=:id', { userId: req.user.id, id: thread.id }))[0];
    const item = (await present([{ ...thread, ...stats, comments: 0 }], req))[0];
    res.json({ ...item, comments: await present(thread.comments, req), canModerate: thread.canModerate, canEdit: thread.canEdit, nextCommentsCursor: thread.nextCommentsCursor });
}));
router.patch('/:threadId', writeLimit, handle(async (req, res) => { await cases.update({ actor: req.user, id: req.params.threadId, input: req.body }); res.json({ success: true }); }));
router.post('/:threadId/comments', writeLimit, handle(async (req, res) => {
    await cases.comment({ actor: req.user, id: req.params.threadId, content: req.body.content, clientId: req.body.clientId }); res.json({ success: true });
}));
router.delete('/:threadId/comments/:commentId', writeLimit, handle(async (req, res) => { await cases.removeComment({ actor: req.user, id: req.params.threadId, commentId: req.params.commentId, reason: req.body.reason }); res.json({ success: true }); }));
router.put('/:threadId/like', writeLimit, handle(async (req, res) => { await cases.like({ actor: req.user, id: req.params.threadId, liked: req.body.liked }); res.json({ success: true }); }));
router.post('/:threadId/report', writeLimit, handle(async (req, res) => { res.json(await cases.report({ actor: req.user, id: req.params.threadId, reason: req.body.reason })); }));
router.get('/:threadId/reports', handle(async (req, res) => { res.json({ reports: await cases.reports({ actor: req.user, id: req.params.threadId }) }); }));
router.post('/:threadId/reports/:reportId/resolve', writeLimit, handle(async (req, res) => {
    const result = await cases.resolveReport({ actor: req.user, id: req.params.threadId, reportId: req.params.reportId, resolution: req.body.resolution });
    if (!result) fail('REPORT_NOT_FOUND', 'Reporte no encontrado', 404);
    res.json(result);
}));
module.exports = router;
