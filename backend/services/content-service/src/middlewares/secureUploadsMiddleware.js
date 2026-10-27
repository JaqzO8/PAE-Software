const path = require('path');
const fs = require('fs');
const { verifySession } = require('./authMiddleware');
const { Op } = require('sequelize');
const config = require('../config/env');
const { Resource, Repository } = require('../models');

/**
 * Middleware para asegurar que los archivos estáticos en /uploads no expongan
 * material privado de repositorios o lecciones a accesos anónimos o estudiantes no autorizados.
 */
async function secureUploadsMiddleware(req, res, next) {
    try {
        const uploadRoot = path.resolve(config.UPLOAD_PATH);
        // Prevenir path traversal
        const cleanSubpath = req.path.replace(/^\/+/, '');
        const requestedFilePath = path.resolve(uploadRoot, cleanSubpath);

        const relativePath = path.relative(uploadRoot, requestedFilePath);
        if (relativePath.startsWith('..') || path.isAbsolute(relativePath)) {
            return res.status(403).json({
                success: false,
                message: 'Acceso no permitido: ruta inválida',
            });
        }

        if (!fs.existsSync(requestedFilePath)) {
            return res.status(404).json({
                success: false,
                message: 'Archivo no encontrado',
                path: req.url,
            });
        }

        const normalizedUrl = `/uploads/${cleanSubpath.replace(/\\/g, '/')}`;
        const filename = path.basename(requestedFilePath);

        // 1. Si es portada de repositorio público y activo -> permitir
        if (cleanSubpath.startsWith('resources/images') || cleanSubpath.startsWith('covers')) {
            const publicRepoCover = await Repository.findOne({
                where: {
                    activo: true,
                    publico: true,
                    [Op.or]: [
                        { portada: normalizedUrl },
                        { portada: { [Op.like]: `%${filename}` } },
                    ],
                },
            });

            if (publicRepoCover) {
                return res.sendFile(requestedFilePath);
            }
        }

        // 2. Buscar si el archivo corresponde a un recurso académico registrado
        const resource = await Resource.findOne({
            where: {
                activo: true,
                [Op.or]: [
                    { url_archivo: normalizedUrl },
                    { url_archivo: { [Op.like]: `%${filename}` } },
                ],
            },
            include: [{
                model: Repository,
                as: 'repositorio',
                where: { activo: true },
            }],
        });

        // 3. Los borradores nunca se sirven por URL directa; los privados además
        // requieren autorización del propietario/admin.
        if (resource && (resource.publicado === false || resource.repositorio.publico === false)) {
            let token = null;
            const authHeader = req.headers.authorization;
            if (authHeader && authHeader.startsWith('Bearer ')) {
                token = authHeader.substring(7);
            }

            if (!token) {
                return res.status(401).json({
                    success: false,
                    message: 'Autenticación requerida para acceder a este recurso privado',
                });
            }

            try {
                const decoded = await verifySession(token);
                if (String(decoded.id) !== String(resource.repositorio.id_profesor) && decoded.rol !== 'admin') {
                    return res.status(403).json({
                        success: false,
                        message: resource.publicado === false
                            ? 'No tienes permisos para acceder a un borrador'
                            : 'No tienes permisos para acceder a este recurso privado',
                    });
                }
            } catch (err) {
                return res.status(err.status === 503 ? 503 : 401).json({
                    success: false,
                    message: err.status === 503 ? 'Servicio de identidad no disponible' : 'Sesión inválida',
                });
            }
        }

        // 4. Si el archivo está en resources/pdfs y no tiene recurso público registrado o no está autenticado
        if (cleanSubpath.startsWith('resources/pdfs')) {
            if (!resource) {
                return res.status(403).json({
                    success: false,
                    message: 'Acceso restringido a documentos privados',
                });
            }
        }

        // 5. Servir archivo de forma segura con headers de seguridad
        res.setHeader('Cross-Origin-Resource-Policy', 'cross-origin');
        return res.sendFile(requestedFilePath);
    } catch (error) {
        return next(error);
    }
}

module.exports = { secureUploadsMiddleware };
