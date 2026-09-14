const { DesafioSemanal, Comunidad } = require('../models');

class ChallengeController {
    // POST /api/community/:id/challenges - Crear desafío (solo profesor)
    static async create(req, res, next) {
        try {
            const { id } = req.params;
            const { nombre, descripcion, fecha_inicio, fecha_fin } = req.body;
            const userId = req.user.id;

            const community = await Comunidad.findByPk(id);
            if (!community || community.profesor_id !== userId) {
                return res.status(403).json({ success: false, message: 'No autorizado' });
            }

            const challenge = await DesafioSemanal.create({
                comunidad_id: id,
                nombre,
                descripcion,
                fecha_inicio: new Date(fecha_inicio),
                fecha_fin: new Date(fecha_fin),
                activo: true,
            });

            res.status(201).json({ success: true, challenge });
        } catch (error) {
            next(error);
        }
    }

    // GET /api/community/:id/challenges - Listar desafíos
    static async list(req, res, next) {
        try {
            const { id } = req.params;
            const challenges = await DesafioSemanal.findAll({
                where: { comunidad_id: id },
                order: [['fecha_inicio', 'DESC']],
            });

            res.status(200).json({ success: true, challenges });
        } catch (error) {
            next(error);
        }
    }

    // PUT /api/community/:id/challenges/:challengeId - Actualizar
    static async update(req, res, next) {
        try {
            const { id, challengeId } = req.params;
            const { nombre, descripcion, activo, completado } = req.body;
            const userId = req.user.id;

            const community = await Comunidad.findByPk(id);
            if (community.profesor_id !== userId) {
                return res.status(403).json({ success: false, message: 'No autorizado' });
            }

            const challenge = await DesafioSemanal.findOne({
                where: { id_desafio: challengeId, comunidad_id: id },
            });

            if (!challenge) {
                return res.status(404).json({ success: false, message: 'Desafío no encontrado' });
            }

            await challenge.update({ nombre, descripcion, activo, completado });

            res.status(200).json({ success: true, challenge });
        } catch (error) {
            next(error);
        }
    }
}

module.exports = ChallengeController;