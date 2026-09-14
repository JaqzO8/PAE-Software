const { InvitacionComunidad, Comunidad, MiembroComunidad } = require('../models');

class InvitationController {
    // POST /api/community/:id/invite - Enviar invitación (solo profesor)
    static async send(req, res, next) {
        try {
            const { id } = req.params;
            const { estudiante_id } = req.body;
            const profesorId = req.user.id;

            const community = await Comunidad.findByPk(id);
            if (!community || community.profesor_id !== profesorId) {
                return res.status(403).json({ success: false, message: 'No autorizado' });
            }

            const existing = await InvitacionComunidad.findOne({
                where: { comunidad_id: id, estudiante_id },
            });

            if (existing && existing.estado === 'pendiente') {
                return res.status(400).json({ success: false, message: 'Ya existe una invitación pendiente' });
            }

            const invitation = await InvitacionComunidad.create({
                comunidad_id: id,
                profesor_id: profesorId,
                estudiante_id,
                estado: 'pendiente',
            });

            res.status(201).json({ success: true, invitation });
        } catch (error) {
            next(error);
        }
    }

    // GET /api/invitations - Ver mis invitaciones
    static async getMyInvitations(req, res, next) {
        try {
            const userId = req.user.id;

            const invitations = await InvitacionComunidad.findAll({
                where: { estudiante_id: userId, estado: 'pendiente' },
                include: [{ model: Comunidad, as: 'comunidad' }],
                order: [['fecha_invitacion', 'DESC']],
            });

            res.status(200).json({ success: true, invitations });
        } catch (error) {
            next(error);
        }
    }

    // POST /api/invitations/:id/accept - Aceptar invitación
    static async accept(req, res, next) {
        try {
            const { id } = req.params;
            const userId = req.user.id;

            const invitation = await InvitacionComunidad.findOne({
                where: { id_invitacion: id, estudiante_id: userId, estado: 'pendiente' },
            });

            if (!invitation) {
                return res.status(404).json({ success: false, message: 'Invitación no encontrada' });
            }

            await invitation.update({ estado: 'aceptada', fecha_respuesta: new Date() });

            await MiembroComunidad.create({
                comunidad_id: invitation.comunidad_id,
                usuario_id: userId,
                rol_comunidad: 'miembro',
                activo: true,
            });

            res.status(200).json({ success: true, message: 'Invitación aceptada' });
        } catch (error) {
            next(error);
        }
    }

    // POST /api/invitations/:id/reject - Rechazar invitación
    static async reject(req, res, next) {
        try {
            const { id } = req.params;
            const userId = req.user.id;

            const invitation = await InvitacionComunidad.findOne({
                where: { id_invitacion: id, estudiante_id: userId, estado: 'pendiente' },
            });

            if (!invitation) {
                return res.status(404).json({ success: false, message: 'Invitación no encontrada' });
            }

            await invitation.update({ estado: 'rechazada', fecha_respuesta: new Date() });

            res.status(200).json({ success: true, message: 'Invitación rechazada' });
        } catch (error) {
            next(error);
        }
    }
}

module.exports = InvitationController;