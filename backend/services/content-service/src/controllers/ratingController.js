const { Rating, Repository } = require('../models');
const { sequelize } = require('../config/database');

class RatingController {
    /**
     * POST /api/content/repositories/:id/rate
     * Calificar un repositorio (escala 1-10)
     */
    static async rateRepository(req, res, next) {
        const transaction = await sequelize.transaction();

        try {
            const userId = req.user.id;
            const { id } = req.params;
            const { puntuacion, comentario } = req.body;

            // Validar puntuación
            if (!puntuacion || puntuacion < 1 || puntuacion > 10) {
                await transaction.rollback();
                return res.status(400).json({
                    success: false,
                    message: 'La puntuación debe estar entre 1 y 10',
                });
            }

            // Verificar repositorio
            const repository = await Repository.findOne({
                where: { id_repositorio: id, publico: true, activo: true },
                transaction,
            });

            if (!repository) {
                await transaction.rollback();
                return res.status(404).json({
                    success: false,
                    message: 'Repositorio no encontrado',
                });
            }

            // Buscar calificación existente
            let rating = await Rating.findOne({
                where: { id_usuario: userId, id_repositorio: id },
                transaction,
            });

            const isUpdate = !!rating;

            if (rating) {
                // Actualizar calificación existente
                await rating.update({
                    puntuacion: parseInt(puntuacion),
                    comentario: comentario?.trim() || null,
                }, { transaction });
            } else {
                // Crear nueva calificación
                rating = await Rating.create({
                    id_usuario: userId,
                    id_repositorio: id,
                    puntuacion: parseInt(puntuacion),
                    comentario: comentario?.trim() || null,
                }, { transaction });
            }

            // Recalcular rating promedio
            const ratings = await Rating.findAll({
                where: { id_repositorio: id },
                attributes: ['puntuacion'],
                transaction,
            });

            const average = ratings.reduce((sum, r) => sum + r.puntuacion, 0) / ratings.length;

            await repository.update({
                rating_promedio: average.toFixed(2),
            }, { transaction });

            await transaction.commit();

            res.status(200).json({
                success: true,
                message: isUpdate ? 'Calificación actualizada' : 'Calificación registrada',
                data: {
                    rating,
                    nuevo_promedio: parseFloat(average.toFixed(2)),
                    total_calificaciones: ratings.length,
                },
            });
        } catch (error) {
            await transaction.rollback();
            next(error);
        }
    }

    /**
     * GET /api/content/repositories/:id/ratings
     * Obtener todas las calificaciones de un repositorio
     */
    static async getRepositoryRatings(req, res, next) {
        try {
            const { id } = req.params;
            const { page = 1, limit = 20 } = req.query;
            const offset = (page - 1) * limit;

            const { count, rows } = await Rating.findAndCountAll({
                where: { id_repositorio: id },
                attributes: ['id_calificacion', 'id_usuario', 'puntuacion', 'comentario', 'fecha_creacion'],
                limit: parseInt(limit),
                offset: parseInt(offset),
                order: [['fecha_creacion', 'DESC']],
            });

            // Calcular distribución de puntuaciones
            const distribution = await Rating.findAll({
                where: { id_repositorio: id },
                attributes: [
                    'puntuacion',
                    [sequelize.fn('COUNT', sequelize.col('puntuacion')), 'count']
                ],
                group: ['puntuacion'],
                order: [['puntuacion', 'DESC']],
                raw: true,
            });

            res.status(200).json({
                success: true,
                data: rows,
                pagination: {
                    page: parseInt(page),
                    limit: parseInt(limit),
                    total: count,
                    totalPages: Math.ceil(count / limit),
                },
                distribution,
            });
        } catch (error) {
            next(error);
        }
    }

    /**
     * GET /api/content/repositories/:id/my-rating
     * Obtener mi calificación
     */
    static async getMyRating(req, res, next) {
        try {
            const userId = req.user.id;
            const { id } = req.params;

            const rating = await Rating.findOne({
                where: { id_usuario: userId, id_repositorio: id },
            });

            res.status(200).json({
                success: true,
                data: rating,
            });
        } catch (error) {
            next(error);
        }
    }

    /**
     * DELETE /api/content/repositories/:id/rate
     * Eliminar mi calificación
     */
    static async deleteRating(req, res, next) {
        const transaction = await sequelize.transaction();

        try {
            const userId = req.user.id;
            const { id } = req.params;

            const rating = await Rating.findOne({
                where: { id_usuario: userId, id_repositorio: id },
                transaction,
            });

            if (!rating) {
                await transaction.rollback();
                return res.status(404).json({
                    success: false,
                    message: 'No has calificado este repositorio',
                });
            }

            await rating.destroy({ transaction });

            // Recalcular promedio
            const repository = await Repository.findByPk(id, { transaction });
            const ratings = await Rating.findAll({
                where: { id_repositorio: id },
                attributes: ['puntuacion'],
                transaction,
            });

            const average = ratings.length > 0
                ? ratings.reduce((sum, r) => sum + r.puntuacion, 0) / ratings.length
                : 0;

            await repository.update({
                rating_promedio: average.toFixed(2),
            }, { transaction });

            await transaction.commit();

            res.status(200).json({
                success: true,
                message: 'Calificación eliminada',
            });
        } catch (error) {
            await transaction.rollback();
            next(error);
        }
    }
}

module.exports = RatingController;