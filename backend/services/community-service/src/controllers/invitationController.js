const { Op } = require('sequelize');
const { InvitacionComunidad, Comunidad } = require('../models');
const useCases = require('../bootstrap/community');
const config = require('../config/env');
const { invitationExpiresAt, positiveId } = require('../domain/communityPolicy');
const ttlMs = config.INVITATION_TTL_HOURS * 60 * 60 * 1000;

class InvitationController {
    static async history(req, res, next) {
        try {
            const where = { comunidad_id: positiveId(req.params.id) };
            if (req.query.before) where.id_invitacion = { [Op.lt]: positiveId(req.query.before) };
            const rows = await InvitacionComunidad.findAll({ where, order: [['id_invitacion', 'DESC']], limit: 51 });
            res.json({ success: true, invitations: rows.slice(0, 50).map(row => ({ ...row.get({ plain: true }), expires_at: invitationExpiresAt(row, ttlMs) })), nextCursor: rows.length > 50 ? String(rows[49].id_invitacion) : null });
        } catch (error) { next(error); }
    }
    static async revoke(req, res, next) {
        try { res.json({ success: true, invitation: await useCases.revokeInvitation({ communityId: req.params.id, invitationId: req.params.invitationId, actor: req.user }) }); }
        catch (error) { next(error); }
    }
    static async send(req, res, next) {
        try {
            const invitation = await useCases.invite({ communityId: req.params.id, studentId: req.body.estudiante_id, actor: req.user, accessToken: req.token });
            res.status(201).json({ success: true, invitation: { ...invitation, expires_at: invitationExpiresAt(invitation, ttlMs) } });
        } catch (error) { next(error); }
    }
    static async getMyInvitations(req, res, next) {
        try {
            const invitations = await InvitacionComunidad.findAll({
                where: { estudiante_id: positiveId(req.user.id), estado: 'pendiente', fecha_invitacion: { [Op.gt]: new Date(Date.now() - ttlMs) }, ...(req.query.before ? { id_invitacion: { [Op.lt]: positiveId(req.query.before) } } : {}) },
                include: [{ model: Comunidad, as: 'comunidad', where: { activa: true }, attributes: ['id_comunidad', 'nombre', 'materia'] }],
                order: [['id_invitacion', 'DESC']], limit: 51,
            });
            res.json({ success: true, nextCursor: invitations.length > 50 ? String(invitations[49].id_invitacion) : null, invitations: invitations.slice(0, 50).map((invitation) => ({
                ...invitation.get({ plain: true }), expires_at: invitationExpiresAt(invitation, ttlMs),
            })) });
        } catch (error) { next(error); }
    }
    static async accept(req, res, next) {
        try {
            const result = await useCases.accept({ invitationId: req.params.id, actor: req.user });
            res.json({ success: true, message: 'Invitación aceptada', ...result });
        } catch (error) { next(error); }
    }
    static async reject(req, res, next) {
        try {
            const result = await useCases.reject({ invitationId: req.params.id, actor: req.user });
            res.json({ success: true, message: 'Invitación rechazada', ...result });
        } catch (error) { next(error); }
    }
}
module.exports = InvitationController;
