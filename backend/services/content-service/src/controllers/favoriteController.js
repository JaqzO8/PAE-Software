const { Favorite, Repository, Category, Tag } = require('../models');

class FavoriteController {
    /**
     * GET /api/content/favorites
     * Listar favoritos del usuario (RQ55)
     */
    static async list(req, res, next) {
        try {
            const userId = req.user.id;
            const { page = 1, limit = 20 } = req.query;
            const offset = (page - 1) * limit;

            const { count, rows } = await Favorite.findAndCountAll({
                where: { id_usuario: userId },
                include: [
                    {
                        model: Repository,
                        as: 'repositorio',
                        where: { activo: true, publico: true },
                        include: [
                            { 
                                model: Category, 
                                as: 'categoria',
                                attributes: ['id_categoria', 'nombre', 'slug', 'icono'],
                            },
                            { 
                                model: Tag, 
                                as: 'tags', 
                                attributes: ['id_tag', 'nombre', 'slug'],
                                through: { attributes: [] },
                            },
                        ],
                    },
                ],
                limit: parseInt(limit),
                offset: parseInt(offset),
                order: [['fecha_creacion', 'DESC']],
            });

            res.status(200).json({
                success: true,
                data: rows.map(fav => ({
                    id_favorito: fav.id_favorito,
                    fecha_creacion: fav.fecha_creacion,
                    repositorio: fav.repositorio,
                })),
                pagination: {
                    page: parseInt(page),
                    limit: parseInt(limit),
                    total: count,
                    totalPages: Math.ceil(count / limit),
                },
            });
        } catch (error) {
            next(error);
        }
    }

    /**
     * POST /api/content/favorites/:id
     * Agregar a favoritos (RQ55)
     */
    static async add(req, res, next) {
        try {
            const userId = req.user.id;
            const { id } = req.params;

            // Verificar repositorio
            const repository = await Repository.findOne({
                where: { id_repositorio: id, activo: true, publico: true },
            });

            if (!repository) {
                return res.status(404).json({
                    success: false,
                    message: 'Repositorio no encontrado',
                });
            }

            // Verificar si ya existe
            const existing = await Favorite.findOne({
                where: { id_usuario: userId, id_repositorio: id },
            });

            if (existing) {
                return res.status(409).json({
                    success: false,
                    message: 'Este repositorio ya está en favoritos',
                });
            }

            // Crear favorito
            const favorite = await Favorite.create({
                id_usuario: userId,
                id_repositorio: id,
            });

            res.status(201).json({
                success: true,
                message: 'Repositorio agregado a favoritos',
                data: favorite,
            });
        } catch (error) {
            next(error);
        }
    }

    /**
     * DELETE /api/content/favorites/:id
     * Quitar de favoritos (RQ55)
     */
    static async remove(req, res, next) {
        try {
            const userId = req.user.id;
            const { id } = req.params;

            const favorite = await Favorite.findOne({
                where: { id_usuario: userId, id_repositorio: id },
            });

            if (!favorite) {
                return res.status(404).json({
                    success: false,
                    message: 'Favorito no encontrado',
                });
            }

            await favorite.destroy();

            res.status(200).json({
                success: true,
                message: 'Repositorio eliminado de favoritos',
            });
        } catch (error) {
            next(error);
        }
    }

    /**
     * GET /api/content/favorites/check/:id
     * Verificar si está en favoritos (RQ55)
     */
    static async check(req, res, next) {
        try {
            const userId = req.user.id;
            const { id } = req.params;

            const favorite = await Favorite.findOne({
                where: { id_usuario: userId, id_repositorio: id },
            });

            res.status(200).json({
                success: true,
                isFavorite: !!favorite,
                data: favorite || null,
            });
        } catch (error) {
            next(error);
        }
    }

    /**
     * GET /api/content/favorites/count
     * Contar mis favoritos
     */
    static async count(req, res, next) {
        try {
            const userId = req.user.id;

            const count = await Favorite.count({
                where: { id_usuario: userId },
                include: [{
                    model: Repository,
                    as: 'repositorio',
                    where: { activo: true },
                }],
            });

            res.status(200).json({
                success: true,
                count,
            });
        } catch (error) {
            next(error);
        }
    }
}

module.exports = FavoriteController;