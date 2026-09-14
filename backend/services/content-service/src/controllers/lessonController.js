const PDFDocument = require('pdfkit');
const { Lesson, LessonProgress, Repository, StudySetting } = require('../models');

const parseJsonArray = (value) => {
    if (!value) return [];
    if (Array.isArray(value)) return value;
    if (typeof value === 'string') {
        try {
            const parsed = JSON.parse(value);
            return Array.isArray(parsed) ? parsed : [];
        } catch (error) {
            return [];
        }
    }
    return [];
};

const getMinTrackedSeconds = async () => {
    const settings = await StudySetting.findByPk(1);
    return Number(settings?.segundos_minimos_seguimiento || 30);
};

class LessonController {
    static async _findLesson(id, options = {}) {
        const where = { id_leccion: id, activo: true };
        if (options.publishedOnly) where.publicado = true;

        return Lesson.findOne({
            where,
            include: [{
                model: Repository,
                as: 'repositorio',
                where: { activo: true },
            }],
        });
    }

    static async _findCompletedProgress(id_leccion, id_usuario) {
        return LessonProgress.findOne({
            where: { id_leccion, id_usuario, completada: true },
        });
    }

    static async _ensureCompleted(req, res, lesson) {
        const progress = await LessonController._findCompletedProgress(lesson.id_leccion, req.user.id);
        if (!progress) {
            res.status(403).json({
                success: false,
                message: 'Debes completar la leccion antes de acceder a esta funcion',
            });
            return null;
        }
        return progress;
    }

    static async list(req, res, next) {
        try {
            const { repositorio_id } = req.query;

            if (!repositorio_id) {
                return res.status(400).json({
                    success: false,
                    message: 'El ID del repositorio es requerido',
                });
            }

            const where = { id_repositorio: repositorio_id, activo: true };
            if (req.user?.rol !== 'docente' && req.user?.rol !== 'admin') {
                where.publicado = true;
            }

            const lessons = await Lesson.findAll({
                where,
                include: req.user?.id ? [{
                    model: LessonProgress,
                    as: 'progresos',
                    where: { id_usuario: req.user.id },
                    required: false,
                }] : [],
                order: [['orden', 'ASC'], ['fecha_creacion', 'ASC']],
            });

            return res.status(200).json({
                success: true,
                data: lessons,
            });
        } catch (error) {
            return next(error);
        }
    }

    static async getById(req, res, next) {
        try {
            const lesson = await LessonController._findLesson(req.params.id, {
                publishedOnly: req.user?.rol !== 'docente' && req.user?.rol !== 'admin',
            });

            if (!lesson) {
                return res.status(404).json({
                    success: false,
                    message: 'Leccion no encontrada',
                });
            }

            let progress = null;
            if (req.user?.id) {
                progress = await LessonProgress.findOne({
                    where: { id_leccion: lesson.id_leccion, id_usuario: req.user.id },
                });
            }

            return res.status(200).json({
                success: true,
                data: {
                    ...lesson.toJSON(),
                    progress,
                },
            });
        } catch (error) {
            return next(error);
        }
    }

    static async create(req, res, next) {
        try {
            const userId = req.user.id;
            const {
                id_repositorio,
                titulo,
                descripcion,
                contenido,
                resumen_teorico,
                preguntas_respuestas,
                mapa_conceptual,
                recursos_multimedia,
                dificultad,
                duracion_minutos,
                orden,
                publicado = true,
            } = req.body;

            if (!id_repositorio || !titulo || !contenido) {
                return res.status(400).json({
                    success: false,
                    message: 'Campos requeridos: id_repositorio, titulo, contenido',
                });
            }

            const repository = await Repository.findOne({
                where: { id_repositorio, id_profesor: userId, activo: true },
            });

            if (!repository) {
                return res.status(404).json({
                    success: false,
                    message: 'Repositorio no encontrado o no tienes permisos',
                });
            }

            const lesson = await Lesson.create({
                id_repositorio,
                titulo: titulo.trim(),
                descripcion: descripcion?.trim() || null,
                contenido: contenido.trim(),
                resumen_teorico: resumen_teorico?.trim() || null,
                preguntas_respuestas: parseJsonArray(preguntas_respuestas),
                mapa_conceptual: parseJsonArray(mapa_conceptual),
                recursos_multimedia: parseJsonArray(recursos_multimedia),
                dificultad: dificultad || 'basico',
                duracion_minutos: duracion_minutos ? parseInt(duracion_minutos, 10) : 15,
                orden: orden ? parseInt(orden, 10) : 0,
                publicado: publicado === true || publicado === 'true',
            });

            return res.status(201).json({
                success: true,
                message: 'Leccion creada exitosamente',
                data: lesson,
            });
        } catch (error) {
            return next(error);
        }
    }

    static async update(req, res, next) {
        try {
            const lesson = await LessonController._findLesson(req.params.id);

            if (!lesson) {
                return res.status(404).json({
                    success: false,
                    message: 'Leccion no encontrada',
                });
            }

            if (String(lesson.repositorio.id_profesor) !== String(req.user.id)) {
                return res.status(403).json({
                    success: false,
                    message: 'No tienes permisos para editar esta leccion',
                });
            }

            const allowed = [
                'titulo', 'descripcion', 'contenido', 'resumen_teorico',
                'dificultad', 'duracion_minutos', 'orden', 'publicado',
            ];
            const updates = {};
            allowed.forEach((key) => {
                if (req.body[key] !== undefined) updates[key] = req.body[key];
            });
            ['preguntas_respuestas', 'mapa_conceptual', 'recursos_multimedia'].forEach((key) => {
                if (req.body[key] !== undefined) updates[key] = parseJsonArray(req.body[key]);
            });

            await lesson.update(updates);

            return res.status(200).json({
                success: true,
                message: 'Leccion actualizada exitosamente',
                data: lesson,
            });
        } catch (error) {
            return next(error);
        }
    }

    static async delete(req, res, next) {
        try {
            const lesson = await LessonController._findLesson(req.params.id);

            if (!lesson) {
                return res.status(404).json({
                    success: false,
                    message: 'Leccion no encontrada',
                });
            }

            if (String(lesson.repositorio.id_profesor) !== String(req.user.id)) {
                return res.status(403).json({
                    success: false,
                    message: 'No tienes permisos para eliminar esta leccion',
                });
            }

            await lesson.update({ activo: false });

            return res.status(200).json({
                success: true,
                message: 'Leccion eliminada exitosamente',
            });
        } catch (error) {
            return next(error);
        }
    }

    static async start(req, res, next) {
        try {
            const lesson = await LessonController._findLesson(req.params.id, { publishedOnly: true });

            if (!lesson) {
                return res.status(404).json({
                    success: false,
                    message: 'Leccion no encontrada',
                });
            }

            const [progress] = await LessonProgress.findOrCreate({
                where: { id_leccion: lesson.id_leccion, id_usuario: req.user.id },
                defaults: { id_leccion: lesson.id_leccion, id_usuario: req.user.id },
            });

            return res.status(200).json({
                success: true,
                data: progress,
            });
        } catch (error) {
            return next(error);
        }
    }

    static async complete(req, res, next) {
        try {
            const lesson = await LessonController._findLesson(req.params.id, { publishedOnly: true });

            if (!lesson) {
                return res.status(404).json({
                    success: false,
                    message: 'Leccion no encontrada',
                });
            }

            const { puntuacion, tiempo_segundos } = req.body;
            const [progress] = await LessonProgress.findOrCreate({
                where: { id_leccion: lesson.id_leccion, id_usuario: req.user.id },
                defaults: { id_leccion: lesson.id_leccion, id_usuario: req.user.id },
            });

            await progress.update({
                completada: true,
                puntuacion: puntuacion !== undefined ? puntuacion : progress.puntuacion,
                tiempo_segundos: tiempo_segundos
                    ? Math.max(parseInt(tiempo_segundos, 10), Number(progress.tiempo_segundos || 0))
                    : progress.tiempo_segundos,
                fecha_completado: new Date(),
            });

            return res.status(200).json({
                success: true,
                message: 'Leccion completada',
                data: progress,
            });
        } catch (error) {
            return next(error);
        }
    }

    static async trackTime(req, res, next) {
        try {
            const lesson = await LessonController._findLesson(req.params.id, { publishedOnly: true });

            if (!lesson) {
                return res.status(404).json({
                    success: false,
                    message: 'Leccion no encontrada',
                });
            }

            const minTrackedSeconds = await getMinTrackedSeconds();
            const elapsedSeconds = Math.max(0, parseInt(req.body.tiempo_segundos, 10) || 0);
            const [progress] = await LessonProgress.findOrCreate({
                where: { id_leccion: lesson.id_leccion, id_usuario: req.user.id },
                defaults: { id_leccion: lesson.id_leccion, id_usuario: req.user.id },
            });
            if (elapsedSeconds < minTrackedSeconds) {
                return res.status(200).json({
                    success: true,
                    data: progress,
                });
            }

            await progress.update({
                tiempo_segundos: Math.max(Number(progress.tiempo_segundos || 0), elapsedSeconds),
            });

            return res.status(200).json({
                success: true,
                data: progress,
            });
        } catch (error) {
            return next(error);
        }
    }

    static async summary(req, res, next) {
        try {
            const lesson = await LessonController._findLesson(req.params.id, { publishedOnly: true });
            if (!lesson) return res.status(404).json({ success: false, message: 'Leccion no encontrada' });

            const progress = await LessonController._ensureCompleted(req, res, lesson);
            if (!progress) return null;

            await progress.update({ resumen_generado: true });

            return res.status(200).json({
                success: true,
                data: {
                    id_leccion: lesson.id_leccion,
                    titulo: lesson.titulo,
                    resumen_teorico: lesson.resumen_teorico || lesson.contenido.slice(0, 900),
                },
            });
        } catch (error) {
            return next(error);
        }
    }

    static async solution(req, res, next) {
        try {
            const lesson = await LessonController._findLesson(req.params.id, { publishedOnly: true });
            if (!lesson) return res.status(404).json({ success: false, message: 'Leccion no encontrada' });

            const progress = await LessonController._ensureCompleted(req, res, lesson);
            if (!progress) return null;

            return res.status(200).json({
                success: true,
                data: {
                    id_leccion: lesson.id_leccion,
                    titulo: lesson.titulo,
                    preguntas_respuestas: lesson.preguntas_respuestas,
                },
            });
        } catch (error) {
            return next(error);
        }
    }

    static async conceptMap(req, res, next) {
        try {
            const lesson = await LessonController._findLesson(req.params.id, { publishedOnly: true });
            if (!lesson) return res.status(404).json({ success: false, message: 'Leccion no encontrada' });

            const progress = await LessonController._ensureCompleted(req, res, lesson);
            if (!progress) return null;

            await progress.update({ mapa_generado: true });

            return res.status(200).json({
                success: true,
                data: {
                    id_leccion: lesson.id_leccion,
                    titulo: lesson.titulo,
                    mapa_conceptual: lesson.mapa_conceptual,
                },
            });
        } catch (error) {
            return next(error);
        }
    }

    static async downloadMaterial(req, res, next) {
        try {
            const lesson = await LessonController._findLesson(req.params.id, { publishedOnly: true });
            if (!lesson) return res.status(404).json({ success: false, message: 'Leccion no encontrada' });

            const progress = await LessonController._ensureCompleted(req, res, lesson);
            if (!progress) return null;

            const doc = new PDFDocument({ margin: 48 });
            const filename = `${lesson.titulo}.pdf`.replace(/[^\w.\- ]+/g, '_');

            res.setHeader('Content-Type', 'application/pdf');
            res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);

            doc.pipe(res);
            doc.fontSize(18).text(lesson.titulo, { underline: true });
            doc.moveDown();
            if (lesson.descripcion) {
                doc.fontSize(11).fillColor('#555').text(lesson.descripcion);
                doc.moveDown();
            }
            doc.fillColor('#111').fontSize(14).text('Contenido de la leccion');
            doc.moveDown(0.5);
            doc.fontSize(11).text(lesson.contenido);
            doc.moveDown();
            doc.fontSize(14).text('Resumen teorico');
            doc.moveDown(0.5);
            doc.fontSize(11).text(lesson.resumen_teorico || lesson.contenido.slice(0, 900));
            doc.end();
            return null;
        } catch (error) {
            return next(error);
        }
    }
}

module.exports = LessonController;
