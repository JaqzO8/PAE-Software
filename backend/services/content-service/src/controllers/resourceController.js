const { Resource, Repository, OutboxEvent } = require('../models');
const { sequelize } = require('../config/database');
const crypto = require('crypto');
const path = require('path');
const fs = require('fs').promises;
const config = require('../config/env');
const { validateFileIntegrity } = require('../domain/contentPolicy');

const resourceAttributes = Resource.rawAttributes || {};
const fileSizeField = Object.keys(resourceAttributes).find((key) => (
    key !== 'url_archivo' && key !== 'extension' && key.endsWith('_archivo')
));

class ResourceController {
    static _temporaryLinkSecret() {
        if (!config.JWT_SECRET) throw new Error('JWT_SECRET required for temporary links');
        return config.JWT_SECRET;
    }

    static _signTemporaryAccess(resourceId, userId, role, expiresAt) {
        const payload = Buffer.from(JSON.stringify({ resourceId: String(resourceId), userId: String(userId), role, expiresAt }), 'utf8').toString('base64url');
        const signature = crypto.createHmac('sha256', ResourceController._temporaryLinkSecret()).update(payload).digest('base64url');
        return `${payload}.${signature}`;
    }

    static _verifyTemporaryAccess(token, resourceId) {
        try {
            const [payload, signature] = String(token).split('.');
            if (!payload || !signature) return null;
            const expected = crypto.createHmac('sha256', ResourceController._temporaryLinkSecret()).update(payload).digest('base64url');
            const actualBuffer = Buffer.from(signature);
            const expectedBuffer = Buffer.from(expected);
            if (actualBuffer.length !== expectedBuffer.length || !crypto.timingSafeEqual(actualBuffer, expectedBuffer)) return null;
            const data = JSON.parse(Buffer.from(payload, 'base64url').toString('utf8'));
            if (String(data.resourceId) !== String(resourceId) || !data.userId || Number(data.expiresAt) <= Date.now()) return null;
            return { id: data.userId, rol: data.role, temporaryAccess: true };
        } catch {
            return null;
        }
    }

    static temporaryAccess(req, res, next) {
        const user = ResourceController._verifyTemporaryAccess(req.query.access_token, req.params.id);
        if (!user || String(req.user?.id) !== String(user.id)) return res.status(401).json({ success: false, message: 'Enlace temporal inválido o vencido' });
        return next();
    }

    static _validateOptionalHttpUrl(value, fieldName) {
        if (!value) return;
        try {
            const parsed = new URL(String(value));
            if (!['http:', 'https:'].includes(parsed.protocol)) throw new Error('protocol');
        } catch {
            const error = new Error(`${fieldName} debe ser una URL HTTP o HTTPS válida`);
            error.status = 400;
            throw error;
        }
    }

    static _isOwnerOrAdmin(resource, user) {
        return user?.rol === 'admin' || (user?.id && resource?.repositorio
            && String(resource.repositorio.id_profesor) === String(user.id));
    }
    static async _findDownloadableResource(id) {
        return Resource.findOne({
            where: { id_recurso: id, activo: true },
            include: [{
                model: Repository,
                as: 'repositorio',
                where: { activo: true },
            }],
        });
    }

    static _getLocalFilePath(resource) {
        if (!resource.url_archivo) {
            return null;
        }

        const resourcePath = resource.url_archivo.replace(/^\/?uploads\//, '');
        const uploadRoot = path.resolve(config.UPLOAD_PATH);
        const filePath = path.resolve(uploadRoot, resourcePath);

        const relativePath = path.relative(uploadRoot, filePath);
        if (relativePath.startsWith('..') || path.isAbsolute(relativePath)) {
            return null;
        }

        return filePath;
    }

    static _applyUploadedFile(resourceData, file, checksum) {
        resourceData.url_archivo = `/uploads/resources/${ResourceController._getSubfolder(file.mimetype)}/${file.filename}`;
        resourceData.extension = path.extname(file.originalname);
        resourceData.checksum_sha256 = checksum;

        if (fileSizeField) {
            resourceData[fileSizeField] = file.size;
        }
    }

    static async _validateUploadedFile(file) {
        try {
            const buffer = await fs.readFile(file.path);
            validateFileIntegrity({
                ...file,
                buffer,
                originalname: file.originalname,
            });
            return crypto.createHash('sha256').update(buffer).digest('hex');
        } catch (error) {
            try { await fs.unlink(file.path); } catch (cleanupError) { if (cleanupError.code !== 'ENOENT') error.cleanupError = cleanupError.message; }
            throw error;
        }
    }

    static async _verifyFileChecksum(resource, filePath) {
        if (!resource.checksum_sha256) return true;
        const actualChecksum = crypto.createHash('sha256').update(await fs.readFile(filePath)).digest('hex');
        if (actualChecksum === resource.checksum_sha256) return true;
        const error = new Error('La integridad del archivo no pudo ser verificada');
        error.status = 409;
        error.code = 'FILE_CHECKSUM_MISMATCH';
        throw error;
    }

    /**
     * GET /api/content/resources
     * Listar recursos de un repositorio
     */
    static async list(req, res, next) {
        try {
            const { repositorio_id, tipo } = req.query;

            if (!repositorio_id) {
                return res.status(400).json({
                    success: false,
                    message: 'El ID del repositorio es requerido',
                });
            }

            const where = { id_repositorio: repositorio_id, activo: true };
            if (tipo) where.tipo_recurso = tipo;

            const repository = await Repository.findOne({
                where: { id_repositorio: repositorio_id, activo: true },
            });
            if (!repository) return res.status(404).json({ success: false, message: 'Repositorio no encontrado' });
            const canViewDrafts = req.user?.rol === 'admin'
                || String(req.user?.id) === String(repository.id_profesor);
            const resources = await Resource.findAll({
                where,
                order: [['orden', 'ASC'], ['fecha_subida', 'DESC']],
            });

            // Recursos históricos sin la columna nueva se consideran publicados;
            // solo el valor explícito false representa un borrador.
            const visibleResources = canViewDrafts ? resources : resources.filter((resource) => resource.publicado !== false);
            return res.status(200).json({
                success: true,
                data: visibleResources,
            });
        } catch (error) {
            return next(error);
        }
    }

    /**
     * GET /api/content/resources/:id
     * Obtener recurso por ID
     */
    static async getById(req, res, next) {
        try {
            const { id } = req.params;

            const resource = await Resource.findOne({
                where: { id_recurso: id, activo: true },
                include: [{
                    model: Repository,
                    as: 'repositorio',
                    attributes: ['id_repositorio', 'titulo', 'id_profesor'],
                }],
            });

            if (!resource) {
                return res.status(404).json({
                    success: false,
                    message: 'Recurso no encontrado',
                });
            }

            if (resource.publicado === false && !ResourceController._isOwnerOrAdmin(resource, req.user)) {
                return res.status(404).json({ success: false, message: 'Recurso no encontrado' });
            }

            return res.status(200).json({
                success: true,
                data: resource,
            });
        } catch (error) {
            return next(error);
        }
    }

    /**
     * POST /api/content/resources
     * Crear recurso (RQ14, RQ38)
     */
    static async create(req, res, next) {
        try {
            const userId = req.user.id;
            const {
                id_repositorio,
                titulo,
                descripcion,
                tipo_recurso,
                url_externa,
                orden,
                fuente_url,
                licencia,
            } = req.body;

            if (!id_repositorio || !titulo || !tipo_recurso) {
                return res.status(400).json({
                    success: false,
                    message: 'Campos requeridos: id_repositorio, titulo, tipo_recurso',
                });
            }

            ResourceController._validateOptionalHttpUrl(url_externa, 'url_externa');
            ResourceController._validateOptionalHttpUrl(fuente_url, 'fuente_url');

            const repository = await Repository.findOne({
                where: { id_repositorio, id_profesor: userId, activo: true },
            });

            if (!repository) {
                return res.status(404).json({
                    success: false,
                    message: 'Repositorio no encontrado o no tienes permisos',
                });
            }

            const resourceData = {
                id_repositorio,
                titulo: titulo.trim(),
                descripcion: descripcion?.trim() || null,
                tipo_recurso,
                orden: orden ? parseInt(orden, 10) : 0,
                fuente_url: fuente_url?.trim() || null,
                licencia: licencia?.trim() || null,
            };

            if (url_externa) {
                resourceData.url_externa = url_externa;
            }

            if (req.file) {
                const checksum = await ResourceController._validateUploadedFile(req.file);
                ResourceController._applyUploadedFile(resourceData, req.file, checksum);
            } else if (!url_externa) {
                return res.status(400).json({
                    success: false,
                    message: 'Debes subir un archivo o proporcionar una URL externa',
                });
            }

            const resource = await Resource.create(resourceData);

            return res.status(201).json({
                success: true,
                message: 'Recurso creado exitosamente',
                data: resource,
            });
        } catch (error) {
            return next(error);
        }
    }

    static async publish(req, res, next) {
        try {
            const resource = await Resource.findOne({
                where: { id_recurso: req.params.id, activo: true },
                include: [{ model: Repository, as: 'repositorio' }],
            });
            if (!resource) return res.status(404).json({ success: false, message: 'Recurso no encontrado' });
            if (!ResourceController._isOwnerOrAdmin(resource, req.user)) {
                return res.status(403).json({ success: false, message: 'Solo el propietario puede publicar este recurso' });
            }
            if (resource.estado_editorial && resource.estado_editorial !== 'aprobado') {
                return res.status(409).json({ success: false, message: 'El recurso requiere aprobación editorial antes de publicarse' });
            }
            if (!resource.url_archivo && !resource.url_externa) {
                return res.status(409).json({ success: false, message: 'El recurso no tiene material válido para publicar' });
            }
            if (resource.url_archivo) {
                const filePath = ResourceController._getLocalFilePath(resource);
                if (!filePath) return res.status(409).json({ success: false, message: 'La ruta del archivo no es válida para publicar' });
                try {
                    await fs.access(filePath);
                    await ResourceController._verifyFileChecksum(resource, filePath);
                } catch (error) {
                    if (error.code === 'FILE_CHECKSUM_MISMATCH') {
                        return res.status(409).json({ success: false, message: error.message });
                    }
                    return res.status(409).json({ success: false, message: 'El archivo no está disponible para publicar' });
                }
            }
            if (resource.publicado) {
                return res.status(200).json({ success: true, message: 'El recurso ya estaba publicado', data: resource, replayed: true });
            }
            const publishedAt = new Date();
            await sequelize.transaction(async (transaction) => {
                await resource.update({ publicado: true, fecha_publicacion: publishedAt }, { transaction });
                await OutboxEvent.create({
                    event_id: crypto.randomUUID(),
                    event_type: 'RecursoPublicado.v1',
                    schema_version: 1,
                    producer: 'content',
                    payload: {
                        resourceId: String(resource.id_recurso),
                        repositoryId: String(resource.id_repositorio),
                        teacherId: String(resource.repositorio.id_profesor),
                        title: resource.titulo,
                        resourceType: resource.tipo_recurso,
                        isPublic: resource.repositorio.publico,
                        correlationId: crypto.randomUUID(),
                    },
                    status: 'pending',
                    occurred_at: publishedAt,
                }, { transaction });
            });
            return res.status(200).json({ success: true, message: 'Recurso publicado', data: resource });
        } catch (error) {
            return next(error);
        }
    }

    static async editorialReview(req, res, next) {
        try {
            const resource = await Resource.findOne({ where: { id_recurso: req.params.id, activo: true }, include: [{ model: Repository, as: 'repositorio' }] });
            if (!resource) return res.status(404).json({ success: false, message: 'Recurso no encontrado' });
            if (!ResourceController._isOwnerOrAdmin(resource, req.user)) return res.status(403).json({ success: false, message: 'Solo el propietario o administrador puede revisar' });
            const status = String(req.body.estado || '').toLowerCase();
            if (!['aprobado', 'rechazado', 'pendiente'].includes(status)) return res.status(400).json({ success: false, message: 'Estado editorial inválido' });
            await resource.update({ estado_editorial: status, revisor_editorial_id: req.user.id, fecha_revision: new Date() });
            return res.status(200).json({ success: true, data: resource });
        } catch (error) { return next(error); }
    }

    /**
     * PUT /api/content/resources/:id
     * Actualizar recurso
     */
    static async update(req, res, next) {
        try {
            const { id } = req.params;
            const userId = req.user.id;
            const { titulo, descripcion, url_externa, orden } = req.body;

            const resource = await Resource.findOne({
                where: { id_recurso: id, activo: true },
                include: [{ model: Repository, as: 'repositorio' }],
            });

            if (!resource) {
                return res.status(404).json({
                    success: false,
                    message: 'Recurso no encontrado',
                });
            }

            if (resource.publicado === false && !ResourceController._isOwnerOrAdmin(resource, req.user)) {
                return res.status(404).json({ success: false, message: 'Recurso no encontrado' });
            }

            if (String(resource.repositorio.id_profesor) !== String(userId)) {
                return res.status(403).json({
                    success: false,
                    message: 'No tienes permisos para editar este recurso',
                });
            }

            const updateData = {};
            if (titulo) updateData.titulo = titulo.trim();
            if (descripcion !== undefined) updateData.descripcion = descripcion?.trim() || null;
            if (url_externa !== undefined) updateData.url_externa = url_externa || null;
            if (orden !== undefined) updateData.orden = parseInt(orden, 10);

            if (req.file) {
                const checksum = await ResourceController._validateUploadedFile(req.file);
                if (resource.url_archivo) {
                    const oldPath = ResourceController._getLocalFilePath(resource);
                    if (oldPath) {
                        try {
                            await fs.unlink(oldPath);
                        } catch (err) {
                            if (err.code !== 'ENOENT') {
                                console.error('Error eliminando archivo anterior:', err);
                            }
                        }
                    }
                }

                ResourceController._applyUploadedFile(updateData, req.file, checksum);
            }

            await resource.update(updateData);

            return res.status(200).json({
                success: true,
                message: 'Recurso actualizado exitosamente',
                data: resource,
            });
        } catch (error) {
            return next(error);
        }
    }

    /**
     * DELETE /api/content/resources/:id
     * Eliminar recurso (soft delete)
     */
    static async delete(req, res, next) {
        try {
            const { id } = req.params;
            const userId = req.user.id;

            const resource = await Resource.findOne({
                where: { id_recurso: id, activo: true },
                include: [{ model: Repository, as: 'repositorio' }],
            });

            if (!resource) {
                return res.status(404).json({
                    success: false,
                    message: 'Recurso no encontrado',
                });
            }

            if (String(resource.repositorio.id_profesor) !== String(userId)) {
                return res.status(403).json({
                    success: false,
                    message: 'No tienes permisos para eliminar este recurso',
                });
            }

            await resource.update({ activo: false });

            return res.status(200).json({
                success: true,
                message: 'Recurso eliminado exitosamente',
            });
        } catch (error) {
            return next(error);
        }
    }

    /**
     * POST /api/content/resources/:id/download
     * Registrar y preparar descarga (RQ43)
     */
    static async download(req, res, next) {
        try {
            const { id } = req.params;
            const resource = await ResourceController._findDownloadableResource(id);

            if (!resource) {
                return res.status(404).json({
                    success: false,
                    message: 'Recurso no encontrado',
                });
            }

            if (resource.publicado === false && !ResourceController._isOwnerOrAdmin(resource, req.user)) {
                return res.status(404).json({ success: false, message: 'Recurso no encontrado' });
            }

            // Si el repositorio es privado, validar pertenencia
            if (resource.repositorio.publico === false) {
                const userId = req.user?.id;
                const isOwner = userId && String(resource.repositorio.id_profesor) === String(userId);
                const isAdmin = req.user?.rol === 'admin';
                if (!isOwner && !isAdmin) {
                    return res.status(403).json({
                        success: false,
                        message: 'No tienes permisos para descargar este recurso privado',
                    });
                }
            }

            if (resource.url_externa) {
                await resource.increment('descargas');
                await resource.repositorio.increment('cantidad_descargas');
                return res.status(200).json({
                    success: true,
                    type: 'external',
                    url: resource.url_externa,
                    filename: resource.titulo,
                });
            }

            if (!resource.url_archivo) {
                return res.status(404).json({
                    success: false,
                    message: 'El recurso no tiene archivo asociado',
                });
            }

            const filePath = ResourceController._getLocalFilePath(resource);

            if (!filePath) {
                return res.status(400).json({
                    success: false,
                    message: 'Ruta de archivo invalida',
                });
            }

            try {
                await fs.access(filePath);
            } catch (error) {
                return res.status(404).json({
                    success: false,
                    message: 'Archivo no encontrado en el servidor',
                });
            }

            await ResourceController._verifyFileChecksum(resource, filePath);
            await resource.increment('descargas');
            await resource.repositorio.increment('cantidad_descargas');

            const expiresAt = Date.now() + config.RESOURCE_LINK_TTL_SECONDS * 1000;
            return res.status(200).json({
                success: true,
                type: 'file',
                downloadUrl: `/content/resources/${resource.id_recurso}/file?access_token=${encodeURIComponent(ResourceController._signTemporaryAccess(resource.id_recurso, req.user.id, req.user.rol, expiresAt))}`,
                expiresAt: new Date(expiresAt).toISOString(),
                filename: `${resource.titulo}${resource.extension || ''}`,
            });
        } catch (error) {
            return next(error);
        }
    }

    /**
     * GET /api/content/resources/:id/file
     * Enviar archivo local autenticado
     */
    static async streamFile(req, res, next) {
        try {
            const { id } = req.params;
            const resource = await ResourceController._findDownloadableResource(id);

            if (!resource || !resource.url_archivo) {
                return res.status(404).json({
                    success: false,
                    message: 'Archivo no encontrado',
                });
            }

            if (resource.publicado === false && !ResourceController._isOwnerOrAdmin(resource, req.user)) {
                return res.status(404).json({ success: false, message: 'Archivo no encontrado' });
            }

            // Si el repositorio es privado, validar pertenencia
            if (resource.repositorio.publico === false) {
                const userId = req.user?.id;
                const isOwner = userId && String(resource.repositorio.id_profesor) === String(userId);
                const isAdmin = req.user?.rol === 'admin';
                if (!isOwner && !isAdmin) {
                    return res.status(403).json({
                        success: false,
                        message: 'No tienes permisos para acceder a este recurso privado',
                    });
                }
            }

            const filePath = ResourceController._getLocalFilePath(resource);

            if (!filePath) {
                return res.status(400).json({
                    success: false,
                    message: 'Ruta de archivo invalida',
                });
            }

            try {
                await fs.access(filePath);
            } catch (error) {
                return res.status(404).json({
                    success: false,
                    message: 'Archivo no encontrado en el servidor',
                });
            }

            await ResourceController._verifyFileChecksum(resource, filePath);

            const filename = `${resource.titulo}${resource.extension || ''}`.replace(/[^\w.\- ]+/g, '_');
            res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);

            return res.sendFile(filePath, (err) => {
                if (err) {
                    next(err);
                }
            });
        } catch (error) {
            return next(error);
        }
    }

    static _getSubfolder(mimetype) {
        if (mimetype.startsWith('application/pdf')) return 'pdfs';
        if (mimetype.startsWith('video/')) return 'videos';
        if (mimetype.startsWith('audio/')) return 'audios';
        if (mimetype.startsWith('image/')) return 'images';
        return 'others';
    }
}

module.exports = ResourceController;
