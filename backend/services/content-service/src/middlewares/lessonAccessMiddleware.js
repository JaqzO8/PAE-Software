const { Lesson, Repository } = require('../models');

// Authenticate before invoking this guard. Lesson reads include inline content,
// so their repository policy must apply before any controller returns it.
async function authorizeLessonRead(req, res, next) {
    try {
        if (!req.params.id && !req.query.repositorio_id) {
            return res.status(400).json({ success: false, message: 'El ID del repositorio es requerido' });
        }
        const lesson = req.params.id
            ? await Lesson.findOne({
                where: { id_leccion: req.params.id, activo: true },
                include: [{ model: Repository, as: 'repositorio', where: { activo: true } }],
            }) : null;
        const repository = req.params.id ? lesson?.repositorio
            : await Repository.findOne({ where: { id_repositorio: req.query.repositorio_id, activo: true } });
        const privileged = req.user?.rol === 'admin'
            || (req.user?.id && String(req.user.id) === String(repository?.id_profesor));
        if (!repository || ((repository.publico === false || lesson?.publicado === false) && !privileged)) {
            return res.status(404).json({ success: false, message: 'Lección o repositorio no encontrado' });
        }
        req.canViewLessonDrafts = Boolean(privileged);
        return next();
    } catch (error) { return next(error); }
}

module.exports = { authorizeLessonRead };
