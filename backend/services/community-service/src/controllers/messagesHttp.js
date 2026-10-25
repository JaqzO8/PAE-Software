const { Op } = require('sequelize');
const { MensajeCanal } = require('../models');
const { findUser } = require('../infrastructure/identityDirectory');
const { fail, positiveId } = require('../domain/communityPolicy');
const useCases = require('../bootstrap/community');
const dto = (message, user) => ({
    id: message.id_mensaje, content: message.contenido, userId: message.usuario_id,
    author: user ? `${user.nombres || ''} ${user.apellidos || ''}`.trim() || 'Usuario' : 'Usuario',
    avatar: user?.avatar || null, authorRole: user?.rol || 'estudiante', timestamp: message.fecha_envio,
    editado: message.editado, version: message.version, removed: Boolean(message.fecha_eliminacion), clientId: message.client_id,
});
class MessageController {
    static async getMessages(req, res, next) {
        try {
            const limit = req.query.limit === undefined ? 50 : Number(req.query.limit);
            if (!Number.isInteger(limit) || limit < 1 || limit > 80) fail('INVALID_LIMIT', 'Límite inválido');
            if (req.query.before && req.query.after) fail('INVALID_CURSOR', 'Usa un solo cursor');
            const where = { comunidad_id: positiveId(req.params.id) };
            if (req.query.before) where.id_mensaje = { [Op.lt]: positiveId(req.query.before) };
            if (req.query.after) where.id_mensaje = { [Op.gt]: positiveId(req.query.after) };
            const rows = await MensajeCanal.findAll({ where, order: [['id_mensaje', req.query.after ? 'ASC' : 'DESC']], limit: limit + 1 });
            const page = rows.slice(0, limit);
            if (!req.query.after) page.reverse();
            const users = new Map();
            await Promise.all([...new Set(page.map(row => row.usuario_id))].map(async id => {
                try { users.set(Number(id), await findUser(id, req.token)); } catch { /* History remains usable when a profile is unavailable. */ }
            }));
            res.json({ success: true, messages: page.map(row => dto(row, users.get(Number(row.usuario_id)))), total: page.length,
                hasMore: rows.length > limit, nextCursor: rows.length > limit ? String(req.query.after ? page.at(-1).id_mensaje : page[0].id_mensaje) : null });
        } catch (error) { next(error); }
    }
    static async sendMessage(req, res, next) {
        try {
            const message = await useCases.publishMessage({ communityId: req.params.id, actor: req.user, content: req.body.contenido, clientId: req.body.client_id });
            req.app.get('communityRealtime')?.changed(req.params.id);
            res.status(message.replayed ? 200 : 201).json({ success: true, replayed: Boolean(message.replayed), message: dto(message, req.user) });
        } catch (error) { next(error); }
    }
    static async editMessage(req, res, next) {
        try {
            const message = await useCases.changeMessage({ communityId: req.params.id, messageId: req.params.messageId, actor: req.user, content: req.body.contenido, version: req.body.version });
            req.app.get('communityRealtime')?.changed(req.params.id);
            res.json({ success: true, message: dto(message, req.user) });
        } catch (error) { next(error); }
    }
    static async deleteMessage(req, res, next) {
        try {
            const message = await useCases.changeMessage({ communityId: req.params.id, messageId: req.params.messageId, actor: req.user, version: req.body.version, reason: req.body.motivo, remove: true });
            req.app.get('communityRealtime')?.changed(req.params.id);
            res.json({ success: true, message: dto(message) });
        } catch (error) { next(error); }
    }
}
module.exports = MessageController;
