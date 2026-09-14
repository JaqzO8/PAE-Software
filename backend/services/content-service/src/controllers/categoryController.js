const { Category, Tag } = require('../models');
const { Op } = require('sequelize');

class CategoryController {
    /**
     * GET /api/content/categories
     * Listar todas las categorías activas
     */
    static async list(req, res, next) {
        try {
            const categories = await Category.findAll({
                where: { activa: true },
                order: [['nombre', 'ASC']],
            });

            res.status(200).json({
                success: true,
                data: categories,
            });
        } catch (error) {
            next(error);
        }
    }

    /**
     * GET /api/content/tags
     * Listar tags más usados
     */
    static async listTags(req, res, next) {
        try {
            const { limit = 50 } = req.query;

            const tags = await Tag.findAll({
                order: [['cantidad_uso', 'DESC']],
                limit: parseInt(limit),
            });

            res.status(200).json({
                success: true,
                data: tags,
            });
        } catch (error) {
            next(error);
        }
    }

    /**
     * GET /api/content/tags/search
     * Buscar tags por nombre
     */
    static async searchTags(req, res, next) {
        try {
            const { q } = req.query;

            if (!q || q.length < 2) {
                return res.status(400).json({
                    success: false,
                    message: 'La búsqueda debe tener al menos 2 caracteres',
                });
            }

            const tags = await Tag.findAll({
                where: {
                    nombre: { [Op.iLike]: `%${q}%` },
                },
                limit: 20,
                order: [['cantidad_uso', 'DESC']],
            });

            res.status(200).json({
                success: true,
                data: tags,
            });
        } catch (error) {
            next(error);
        }
    }

    /**
     * POST /api/content/tags
     * Crear un nuevo tag (solo docentes)
     */
    static async createTag(req, res, next) {
        try {
            const { nombre } = req.body;

            if (!nombre) {
                return res.status(400).json({
                    success: false,
                    message: 'El nombre del tag es requerido',
                });
            }

            const slug = nombre.toLowerCase().replace(/\s+/g, '-');

            // Verificar si ya existe
            const existing = await Tag.findOne({ where: { slug } });
            if (existing) {
                return res.status(409).json({
                    success: false,
                    message: 'Este tag ya existe',
                    data: existing,
                });
            }

            const tag = await Tag.create({
                nombre: nombre.trim(),
                slug,
            });

            res.status(201).json({
                success: true,
                message: 'Tag creado exitosamente',
                data: tag,
            });
        } catch (error) {
            next(error);
        }
    }
}

module.exports = CategoryController;