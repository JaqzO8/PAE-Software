const { Repository, Resource, Category, Tag, Rating } = require('../models');
const { Op } = require('sequelize');

class RepositoryController {
    /**
     * GET /api/content/repositories/explore
     * Explorar repositorios públicos con filtros avanzados
     */
    static async explore(req, res, next) {
        try {
            const { 
                page = 1, 
                limit = 20,
                search,
                categoria,
                tags,
                orderBy = 'rating_promedio',
            } = req.query;

            const offset = (page - 1) * limit;
            const where = { activo: true, publico: true };

            if (categoria) where.id_categoria = categoria;
            if (search) {
                where[Op.or] = [
                    { titulo: { [Op.iLike]: `%${search}%` } },
                    { descripcion: { [Op.iLike]: `%${search}%` } },
                ];
            }

            const include = [
                { 
                    model: Category, 
                    as: 'categoria', 
                    attributes: ['id_categoria', 'nombre', 'slug', 'icono'] 
                },
                { 
                    model: Tag, 
                    as: 'tags', 
                    attributes: ['id_tag', 'nombre', 'slug'], 
                    through: { attributes: [] } 
                },
            ];

            // Filtro por tags
            if (tags) {
                const tagArray = tags.split(',').map(t => t.trim());
                where['$tags.slug$'] = { [Op.in]: tagArray };
            }

            const { count, rows } = await Repository.findAndCountAll({
                where,
                include,
                limit: parseInt(limit),
                offset: parseInt(offset),
                order: [[orderBy, 'DESC']],
                distinct: true,
                subQuery: false,
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
            });
        } catch (error) {
            next(error);
        }
    }

    /**
     * GET /api/content/repositories/popular
     * Obtener repositorios más visitados/descargados
     */
    static async getPopular(req, res, next) {
        try {
            const { limit = 10, orderBy = 'cantidad_vistas' } = req.query;

            const repositories = await Repository.findAll({
                where: { activo: true, publico: true },
                include: [
                    { model: Category, as: 'categoria', attributes: ['id_categoria', 'nombre', 'icono'] },
                    { model: Tag, as: 'tags', attributes: ['id_tag', 'nombre', 'slug'], through: { attributes: [] } },
                ],
                order: [[orderBy, 'DESC']],
                limit: parseInt(limit),
            });

            res.status(200).json({
                success: true,
                data: repositories,
            });
        } catch (error) {
            next(error);
        }
    }

    /**
     * GET /api/content/repositories/destacados
     * Obtener repositorios destacados por administradores
     */
    static async getFeatured(req, res, next) {
        try {
            const { limit = 6 } = req.query;

            const repositories = await Repository.findAll({
                where: { activo: true, publico: true, destacado: true },
                include: [
                    { model: Category, as: 'categoria' },
                    { model: Tag, as: 'tags', through: { attributes: [] } },
                ],
                order: [['rating_promedio', 'DESC']],
                limit: parseInt(limit),
            });

            res.status(200).json({
                success: true,
                data: repositories,
            });
        } catch (error) {
            next(error);
        }
    }

    /**
     * GET /api/content/repositories/my
     * Mis repositorios (solo docentes)
     */
    static async myRepositories(req, res, next) {
        try {
            const userId = req.user.id;
            const { page = 1, limit = 20 } = req.query;
            const offset = (page - 1) * limit;

            console.log('🔍 Buscando repositorios del usuario:', userId);

            const { count, rows } = await Repository.findAndCountAll({
                where: { 
                    id_profesor: userId,
                    activo: true 
                },
                include: [
                    { 
                        model: Category, 
                        as: 'categoria',
                        attributes: ['id_categoria', 'nombre', 'slug', 'icono']
                    },
                    { 
                        model: Tag, 
                        as: 'tags',
                        attributes: ['id_tag', 'nombre', 'slug'],
                        through: { attributes: [] } 
                    },
                    { 
                        model: Resource, 
                        as: 'recursos', 
                        where: { activo: true },
                        required: false,
                        attributes: ['id_recurso', 'tipo_recurso'],
                    },
                ],
                limit: parseInt(limit),
                offset: parseInt(offset),
                order: [['fecha_creacion', 'DESC']],
            });

            console.log(`✅ Encontrados ${count} repositorios para el usuario ${userId}`);

            res.status(200).json({
                success: true,
                data: rows,
                pagination: {
                    page: parseInt(page),
                    limit: parseInt(limit),
                    total: count,
                    totalPages: Math.ceil(count / limit),
                },
            });
        } catch (error) {
            console.error('❌ Error en myRepositories:', error);
            next(error);
        }
    }

    /**
     * GET /api/content/repositories/:id
     * Obtener un repositorio por ID con todos sus recursos y calificaciones
     */
    static async getById(req, res, next) {
        try {
            const { id } = req.params;
            const userId = req.user?.id;

            const repository = await Repository.findOne({
                where: { id_repositorio: id, activo: true, publico: true },
                include: [
                    { model: Category, as: 'categoria' },
                    { model: Tag, as: 'tags', through: { attributes: [] } },
                    { 
                        model: Resource, 
                        as: 'recursos', 
                        where: { activo: true },
                        required: false,
                        order: [['orden', 'ASC'], ['fecha_subida', 'DESC']],
                    },
                    {
                        model: Rating,
                        as: 'calificaciones',
                        limit: 5,
                        order: [['fecha_creacion', 'DESC']],
                        attributes: ['id_calificacion', 'id_usuario', 'puntuacion', 'comentario', 'fecha_creacion'],
                    },
                ],
            });

            if (!repository) {
                return res.status(404).json({
                    success: false,
                    message: 'Repositorio no encontrado',
                });
            }

            // Incrementar vistas
            await repository.increment('cantidad_vistas');

            // Verificar si es favorito del usuario actual
            let isFavorite = false;
            if (userId) {
                const { Favorite } = require('../models');
                const fav = await Favorite.findOne({
                    where: { id_usuario: userId, id_repositorio: id },
                });
                isFavorite = !!fav;
            }

            // Obtener calificación del usuario actual
            let myRating = null;
            if (userId) {
                myRating = await Rating.findOne({
                    where: { id_usuario: userId, id_repositorio: id },
                });
            }

            res.status(200).json({
                success: true,
                data: {
                    ...repository.toJSON(),
                    isFavorite,
                    myRating,
                },
            });
        } catch (error) {
            next(error);
        }
    }

    /**
     * POST /api/content/repositories
     * Crear un nuevo repositorio
     */
    static async create(req, res, next) {
        try {
            const userId = req.user.id;
            const { titulo, descripcion, id_categoria, tags, publico = true } = req.body;

            console.log('📦 Creando repositorio:', { titulo, archivo: req.file?.filename });

            if (!titulo || !id_categoria) {
                return res.status(400).json({
                    success: false,
                    message: 'El título y la categoría son requeridos',
                });
            }

            // ✅ CORRECCIÓN: Construir ruta correcta de la portada
            let portadaPath = null;
            if (req.file) {
                // La ruta debe ser relativa a /uploads
                portadaPath = `/uploads/resources/images/${req.file.filename}`;
                console.log('🖼️ Portada guardada en:', portadaPath);
            }

            // Parsear tags si viene como string JSON
            let parsedTags = tags;
            if (typeof tags === 'string') {
                try {
                    parsedTags = JSON.parse(tags);
                } catch (e) {
                    parsedTags = [];
                }
            }

            // Crear repositorio
            const repository = await Repository.create({
                id_profesor: userId,
                titulo: titulo.trim(),
                descripcion: descripcion?.trim() || null,
                id_categoria: id_categoria || null,
                publico: publico === 'true' || publico === true,
                portada: portadaPath,
            });

            // Asociar tags
            if (parsedTags && Array.isArray(parsedTags) && parsedTags.length > 0) {
                const tagInstances = await Promise.all(
                    parsedTags.map(async (tagName) => {
                        const slug = tagName.toLowerCase().trim().replace(/\s+/g, '-');
                        const [tag] = await Tag.findOrCreate({
                            where: { slug },
                            defaults: { nombre: tagName.trim(), slug },
                        });
                        await tag.increment('cantidad_uso');
                        return tag;
                    })
                );
                await repository.setTags(tagInstances);
            }

            // Recargar con relaciones
            await repository.reload({
                include: [
                    { model: Category, as: 'categoria' },
                    { model: Tag, as: 'tags', through: { attributes: [] } },
                ],
            });

            console.log('✅ Repositorio creado:', repository.id_repositorio);

            res.status(201).json({
                success: true,
                message: 'Repositorio creado exitosamente',
                data: repository,
            });
        } catch (error) {
            console.error('❌ Error creando repositorio:', error);
            next(error);
        }
    }

    /**
     * PUT /api/content/repositories/:id
     * Actualizar repositorio
     */
    static async update(req, res, next) {
        try {
            const { id } = req.params;
            const userId = req.user.id;
            const { titulo, descripcion, id_categoria, tags, publico } = req.body;

            const repository = await Repository.findOne({
                where: { id_repositorio: id, id_profesor: userId, activo: true },
            });

            if (!repository) {
                return res.status(404).json({
                    success: false,
                    message: 'Repositorio no encontrado o no tienes permisos',
                });
            }

            // ✅ CORRECCIÓN: Construir ruta correcta si hay nueva portada
            let portadaPath = repository.portada;
            if (req.file) {
                portadaPath = `/uploads/resources/images/${req.file.filename}`;
                console.log('🖼️ Nueva portada:', portadaPath);
            }

            // Parsear tags si viene como string JSON
            let parsedTags = tags;
            if (typeof tags === 'string') {
                try {
                    parsedTags = JSON.parse(tags);
                } catch (e) {
                    parsedTags = undefined;
                }
            }

            // Actualizar campos
            await repository.update({
                titulo: titulo?.trim() || repository.titulo,
                descripcion: descripcion?.trim() || repository.descripcion,
                id_categoria: id_categoria !== undefined ? id_categoria : repository.id_categoria,
                publico: publico !== undefined ? (publico === 'true' || publico === true) : repository.publico,
                portada: portadaPath,
            });

            // Actualizar tags
            if (parsedTags && Array.isArray(parsedTags)) {
                const tagInstances = await Promise.all(
                    parsedTags.map(async (tagName) => {
                        const slug = tagName.toLowerCase().trim().replace(/\s+/g, '-');
                        const [tag] = await Tag.findOrCreate({
                            where: { slug },
                            defaults: { nombre: tagName.trim(), slug },
                        });
                        await tag.increment('cantidad_uso');
                        return tag;
                    })
                );
                await repository.setTags(tagInstances);
            }

            await repository.reload({
                include: [
                    { model: Category, as: 'categoria' },
                    { model: Tag, as: 'tags', through: { attributes: [] } },
                ],
            });

            res.status(200).json({
                success: true,
                message: 'Repositorio actualizado exitosamente',
                data: repository,
            });
        } catch (error) {
            next(error);
        }
    }

    /**
     * DELETE /api/content/repositories/:id
     * Eliminar repositorio (soft delete)
     */
    static async delete(req, res, next) {
        try {
            const { id } = req.params;
            const userId = req.user.id;

            const repository = await Repository.findOne({
                where: { id_repositorio: id, id_profesor: userId },
            });

            if (!repository) {
                return res.status(404).json({
                    success: false,
                    message: 'Repositorio no encontrado o no tienes permisos',
                });
            }

            await repository.update({ activo: false });

            res.status(200).json({
                success: true,
                message: 'Repositorio eliminado exitosamente',
            });
        } catch (error) {
            next(error);
        }
    }
}

module.exports = RepositoryController;
