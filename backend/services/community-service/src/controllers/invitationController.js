const { Op } = require('sequelize');
const { InvitacionComunidad, Comunidad } = require('../models');
const useCases = require('../bootstrap/community');
const config = require('../config/env');
const { invitationExpiresAt, positiveId } = require('../domain/communityPolicy');
const ttlMs = config.INVITATION_TTL_HOURS * 60 * 60 * 1000;

class InvitationController {
    static async send(req, res, next) {
        try {
            const invitation = await useCases.invite({ communityId: req.params.id, studentId: req.body.estudiante_id, actor: req.user, accessToken: req.token });
            res.status(201).json({ success: true, invitation: { ...invitation, expires_at: invitationExpiresAt(invitation, ttlMs) } });
        } catch (error) { next(error); }
    }
    static async getMyInvitations(req, res, next) {
        try {
            const invitations = await InvitacionComunidad.findAll({
                where: { estudiante_id: positiveId(req.user.id), estado: 'pendiente', fecha_invitacion: { [Op.gt]: new Date(Date.now() - ttlMs) } },
                include: [{ model: Comunidad, as: 'comunidad', where: { activa: true }, attributes: ['id_comunidad', 'nombre', 'materia'] }],
                order: [['fecha_invitacion', 'DESC'], ['id_invitacion', 'DESC']], limit: 50,
            });
            res.json({ success: true, invitations: invitations.map((invitation) => ({
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
