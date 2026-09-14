const { RecursoComunidad, Comunidad, MiembroComunidad } = require('../models');
const fs = require('fs').promises;
const path = require('path');

class ResourceController {
    // POST /api/community/:id/resources - Subir PDF (solo docentes)
    static async upload(req, res, next) {
        try {
            const { id } = req.params;
            const { descripcion } = req.body;
            const userId = req.user.id;

            if (!req.file) {
                return res.status(400).json({ success: false, message: 'Archivo requerido' });
            }

            const community = await Comunidad.findByPk(id);
            if (!community || !community.activa) {
                await fs.unlink(req.file.path);
                return res.status(404).json({ success: false, message: 'Comunidad no encontrada' });
            }

            if (String(community.profesor_id) !== String(userId)) {
                await fs.unlink(req.file.path);
                return res.status(403).json({ success: false, message: 'Solo profesores pueden subir recursos' });
            }

            const resource = await RecursoComunidad.create({
                comunidad_id: id,
                profesor_id: userId,
                nombre_archivo: req.file.originalname,
                url_archivo: `/uploads/${req.file.filename}`,
                tipo_archivo: req.file.mimetype,
                tamano_bytes: req.file.size,
                descripcion: descripcion || null,
            });

            res.status(201).json({
                success: true,
                resource: {
                    id: resource.id_recurso,
                    nombre: resource.nombre_archivo,
                    url: resource.url_archivo,
                    descripcion: resource.descripcion,
                    fecha_subida: resource.fecha_subida,
                },
            });
        } catch (error) {
            if (req.file) await fs.unlink(req.file.path).catch(() => {});
            next(error);
        }
    }

    // GET /api/community/:id/resources - Listar recursos
    static async list(req, res, next) {
        try {
            const { id } = req.params;
            const userId = req.user.id;

            const member = await MiembroComunidad.findOne({
                where: { comunidad_id: id, usuario_id: userId, activo: true },
            });

            if (!member) {
                return res.status(403).json({ success: false, message: 'No eres miembro' });
            }

            const resources = await RecursoComunidad.findAll({
                where: { comunidad_id: id },
                order: [['fecha_subida', 'DESC']],
            });

            res.status(200).json({ success: true, resources });
        } catch (error) {
            next(error);
        }
    }

    // DELETE /api/community/:id/resources/:resourceId - Eliminar recurso
    static async delete(req, res, next) {
        try {
            const { id, resourceId } = req.params;
            const userId = req.user.id;

            const resource = await RecursoComunidad.findOne({
                where: { id_recurso: resourceId, comunidad_id: id },
            });

            if (!resource) {
                return res.status(404).json({ success: false, message: 'Recurso no encontrado' });
            }

            if (String(resource.profesor_id) !== String(userId)) {
                return res.status(403).json({ success: false, message: 'No autorizado' });
            }

            const filePath = path.join(__dirname, '../../uploads', path.basename(resource.url_archivo));
            await fs.unlink(filePath).catch(() => {});
            await resource.destroy();

            res.status(200).json({ success: true, message: 'Recurso eliminado' });
        } catch (error) {
            next(error);
        }
    }
}

module.exports = ResourceController;
