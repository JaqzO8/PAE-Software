const { Op } = require('sequelize');
const { Repository, Favorite, Lesson, LessonProgress, StudySetting } = require('../models');

const DEFAULT_STUDY_SETTINGS = {
    restReminderMinutes: 30,
    longTimeMultiplier: 1.5,
    fastTimeMultiplier: 0.5,
    minTrackedSeconds: 30,
};

const toFrontendStudySettings = (settings) => ({
    restReminderMinutes: Number(settings.recordatorio_descanso_minutos),
    longTimeMultiplier: Number(settings.multiplicador_tiempo_largo),
    fastTimeMultiplier: Number(settings.multiplicador_tiempo_rapido),
    minTrackedSeconds: Number(settings.segundos_minimos_seguimiento),
});

const getStudySettings = async () => {
    const [settings] = await StudySetting.findOrCreate({
        where: { id_configuracion: 1 },
        defaults: { id_configuracion: 1 },
    });
    return toFrontendStudySettings(settings);
};

const clampNumber = (value, min, max, fallback) => {
    const parsed = Number(value);
    if (!Number.isFinite(parsed)) return fallback;
    return Math.min(max, Math.max(min, parsed));
};

const roundOneDecimal = (value) => Math.round(value * 10) / 10;

const buildLessonStudyAnalytics = (progressRows, settings) => {
    const completedRows = progressRows.filter((progress) => progress.completada);
    const totalSeconds = progressRows.reduce((sum, progress) => sum + Number(progress.tiempo_segundos || 0), 0);
    const completedSeconds = completedRows.reduce((sum, progress) => sum + Number(progress.tiempo_segundos || 0), 0);
    const averageLessonMinutes = completedRows.length
        ? Math.round((completedSeconds / completedRows.length) / 60)
        : 0;

    const longSessions = progressRows.filter((progress) => {
        const lessonMinutes = Number(progress.leccion?.duracion_minutos || 0);
        const expectedSeconds = Math.max(
            settings.restReminderMinutes * 60,
            Math.round(lessonMinutes * 60 * settings.longTimeMultiplier)
        );
        return Number(progress.tiempo_segundos || 0) >= expectedSeconds;
    }).length;

    const fastCompletions = completedRows.filter((progress) => {
        const lessonSeconds = Number(progress.leccion?.duracion_minutos || 0) * 60;
        if (!lessonSeconds) return false;
        return Number(progress.tiempo_segundos || 0) <= lessonSeconds * settings.fastTimeMultiplier;
    }).length;

    return {
        totalHours: roundOneDecimal(totalSeconds / 3600),
        completedLessons: completedRows.length,
        averageLessonMinutes,
        longSessions,
        fastCompletions,
        restReminderMinutes: settings.restReminderMinutes,
        recommendation: longSessions > 0
            ? 'Detectamos sesiones largas. Programa pausas breves para sostener la concentracion.'
            : fastCompletions > 0
                ? 'Algunas lecciones se completaron muy rapido. Revisa el resumen y solucionario antes de avanzar.'
                : 'Tu ritmo de estudio esta dentro del rango esperado.',
    };
};

class StatsController {
    static async getStudentStats(req, res, next) {
        try {
            const userId = req.user.id;
            const settings = await getStudySettings();

            const savedResources = await Favorite.count({
                where: { id_usuario: userId },
                include: [{
                    model: Repository,
                    as: 'repositorio',
                    where: { activo: true },
                }],
            });

            const activeCommunities = 0;

            const oneWeekAgo = new Date();
            oneWeekAgo.setDate(oneWeekAgo.getDate() - 7);

            const weeklyGrowth = await Favorite.count({
                where: {
                    id_usuario: userId,
                    fecha_creacion: { [Op.gte]: oneWeekAgo },
                },
            });

            const lessonProgress = await LessonProgress.findAll({
                where: { id_usuario: userId },
                include: [{
                    model: Lesson,
                    as: 'leccion',
                    where: { activo: true },
                    required: true,
                }],
            });
            const lessonStudy = buildLessonStudyAnalytics(lessonProgress, settings);

            res.status(200).json({
                success: true,
                data: {
                    savedResources,
                    activeCommunities,
                    studyHours: lessonStudy.totalHours,
                    weeklyGrowth,
                    lessonStudy,
                },
            });
        } catch (error) {
            next(error);
        }
    }

    static async getTeacherStats(req, res, next) {
        try {
            const userId = req.user.id;
            const settings = await getStudySettings();

            const totalRepositories = await Repository.count({
                where: { id_profesor: userId, activo: true },
            });

            const activeStudents = await Favorite.count({
                distinct: true,
                col: 'id_usuario',
                include: [{
                    model: Repository,
                    as: 'repositorio',
                    where: { id_profesor: userId, activo: true },
                    attributes: [],
                }],
            });

            const lessonProgress = await LessonProgress.findAll({
                include: [{
                    model: Lesson,
                    as: 'leccion',
                    where: { activo: true },
                    required: true,
                    include: [{
                        model: Repository,
                        as: 'repositorio',
                        where: { id_profesor: userId, activo: true },
                        required: true,
                    }],
                }],
            });
            const lessonStudy = buildLessonStudyAnalytics(lessonProgress, settings);

            const pendingEvaluations = 5;
            const oneMonthAgo = new Date();
            oneMonthAgo.setMonth(oneMonthAgo.getMonth() - 1);

            const studentsLastMonth = await Favorite.count({
                distinct: true,
                col: 'id_usuario',
                include: [{
                    model: Repository,
                    as: 'repositorio',
                    where: { id_profesor: userId, activo: true },
                    attributes: [],
                }],
                where: {
                    fecha_creacion: { [Op.lt]: oneMonthAgo },
                },
            });

            const studentGrowth = studentsLastMonth > 0
                ? Math.round(((activeStudents - studentsLastMonth) / studentsLastMonth) * 100)
                : 0;

            res.status(200).json({
                success: true,
                data: {
                    activeStudents,
                    totalRepositories,
                    pendingEvaluations,
                    studentGrowth: Math.max(0, studentGrowth),
                    lessonStudy,
                    studySettings: settings,
                },
            });
        } catch (error) {
            next(error);
        }
    }

    static async getStudySettings(req, res, next) {
        try {
            const settings = await getStudySettings();
            res.status(200).json({ success: true, data: settings });
        } catch (error) {
            next(error);
        }
    }

    static async updateStudySettings(req, res, next) {
        try {
            const current = await getStudySettings();
            const nextSettings = {
                restReminderMinutes: clampNumber(
                    req.body.restReminderMinutes,
                    5,
                    120,
                    current.restReminderMinutes || DEFAULT_STUDY_SETTINGS.restReminderMinutes
                ),
                longTimeMultiplier: clampNumber(
                    req.body.longTimeMultiplier,
                    1,
                    5,
                    current.longTimeMultiplier || DEFAULT_STUDY_SETTINGS.longTimeMultiplier
                ),
                fastTimeMultiplier: clampNumber(
                    req.body.fastTimeMultiplier,
                    0.1,
                    1,
                    current.fastTimeMultiplier || DEFAULT_STUDY_SETTINGS.fastTimeMultiplier
                ),
                minTrackedSeconds: clampNumber(
                    req.body.minTrackedSeconds,
                    10,
                    600,
                    current.minTrackedSeconds || DEFAULT_STUDY_SETTINGS.minTrackedSeconds
                ),
            };

            const [settings] = await StudySetting.findOrCreate({
                where: { id_configuracion: 1 },
                defaults: { id_configuracion: 1 },
            });

            await settings.update({
                recordatorio_descanso_minutos: nextSettings.restReminderMinutes,
                multiplicador_tiempo_largo: nextSettings.longTimeMultiplier,
                multiplicador_tiempo_rapido: nextSettings.fastTimeMultiplier,
                segundos_minimos_seguimiento: nextSettings.minTrackedSeconds,
            });

            res.status(200).json({
                success: true,
                data: toFrontendStudySettings(settings),
            });
        } catch (error) {
            next(error);
        }
    }
}

module.exports = StatsController;
