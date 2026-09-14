const { Op } = require('sequelize');
const { PlanningSetting, StudyPreference, StudyReminder } = require('../models');

const toFrontendSettings = (settings) => ({
    sessionDurationMinutes: Number(settings.duracion_sesion_minutos),
    reminderLeadMinutes: Number(settings.aviso_anticipado_minutos),
    pomodoroFocusMinutes: Number(settings.pomodoro_enfoque_minutos),
    pomodoroBreakMinutes: Number(settings.pomodoro_descanso_minutos),
    maxSessionsPerDay: Number(settings.max_sesiones_dia),
});

const getPlanningSettings = async () => {
    const [settings] = await PlanningSetting.findOrCreate({
        where: { id_configuracion: 1 },
        defaults: { id_configuracion: 1 },
    });
    return toFrontendSettings(settings);
};

const clampInteger = (value, min, max, fallback) => {
    const parsed = Number.parseInt(value, 10);
    if (!Number.isFinite(parsed)) return fallback;
    return Math.min(max, Math.max(min, parsed));
};

const normalizeDays = (days) => {
    if (!Array.isArray(days)) return [1, 2, 3, 4, 5];
    const unique = [...new Set(days.map((day) => Number(day)).filter((day) => day >= 0 && day <= 6))];
    return unique.length ? unique.sort((a, b) => a - b) : [1, 2, 3, 4, 5];
};

const normalizeTime = (value, fallback) => (/^\d{2}:\d{2}$/.test(String(value || '')) ? value : fallback);

const toPreferencePayload = (preference) => ({
    preferredDays: preference.dias_preferidos,
    startTime: preference.hora_inicio,
    endTime: preference.hora_fin,
    subjects: preference.materias,
    remindersEnabled: preference.recordatorios_activos,
});

const buildSlotDate = (baseDate, time) => {
    const [hour, minute] = time.split(':').map(Number);
    const date = new Date(baseDate);
    date.setHours(hour, minute, 0, 0);
    return date;
};

const generateSuggestions = (preference, settings, daysAhead = 7) => {
    const suggestions = [];
    const subjects = Array.isArray(preference.materias) && preference.materias.length
        ? preference.materias
        : ['Matematicas'];
    const preferredDays = normalizeDays(preference.dias_preferidos);
    const today = new Date();

    for (let offset = 0; offset < daysAhead; offset += 1) {
        const day = new Date(today);
        day.setDate(today.getDate() + offset);
        if (!preferredDays.includes(day.getDay())) continue;

        const start = buildSlotDate(day, preference.hora_inicio);
        const endLimit = buildSlotDate(day, preference.hora_fin);
        if (start <= new Date()) start.setDate(start.getDate() + (offset === 0 ? 1 : 0));

        let current = new Date(start);
        let sessions = 0;
        while (
            current < endLimit
            && sessions < settings.maxSessionsPerDay
            && suggestions.length < daysAhead * settings.maxSessionsPerDay
        ) {
            const subject = subjects[(suggestions.length) % subjects.length];
            suggestions.push({
                title: `Sesion de ${subject}`,
                subject,
                scheduledAt: current.toISOString(),
                durationMinutes: settings.sessionDurationMinutes,
                reminderAt: new Date(current.getTime() - settings.reminderLeadMinutes * 60000).toISOString(),
            });
            current = new Date(current.getTime() + settings.sessionDurationMinutes * 60000);
            sessions += 1;
        }
    }

    return suggestions.slice(0, 12);
};

class PlanningController {
    static async getOverview(req, res, next) {
        try {
            const settings = await getPlanningSettings();
            const [preference] = await StudyPreference.findOrCreate({
                where: { id_usuario: req.user.id },
                defaults: { id_usuario: req.user.id },
            });
            const reminders = await StudyReminder.findAll({
                where: {
                    id_usuario: req.user.id,
                    programado_para: { [Op.gte]: new Date() },
                },
                order: [['programado_para', 'ASC']],
                limit: 20,
            });

            res.status(200).json({
                success: true,
                data: {
                    settings,
                    preference: toPreferencePayload(preference),
                    suggestions: generateSuggestions(preference, settings),
                    reminders,
                },
            });
        } catch (error) {
            next(error);
        }
    }

    static async updatePreference(req, res, next) {
        try {
            const [preference] = await StudyPreference.findOrCreate({
                where: { id_usuario: req.user.id },
                defaults: { id_usuario: req.user.id },
            });

            await preference.update({
                dias_preferidos: normalizeDays(req.body.preferredDays),
                hora_inicio: normalizeTime(req.body.startTime, preference.hora_inicio),
                hora_fin: normalizeTime(req.body.endTime, preference.hora_fin),
                materias: Array.isArray(req.body.subjects) && req.body.subjects.length
                    ? req.body.subjects.map((subject) => String(subject).trim()).filter(Boolean).slice(0, 8)
                    : preference.materias,
                recordatorios_activos: req.body.remindersEnabled !== false,
            });

            res.status(200).json({ success: true, data: toPreferencePayload(preference) });
        } catch (error) {
            next(error);
        }
    }

    static async generateReminders(req, res, next) {
        try {
            const settings = await getPlanningSettings();
            const [preference] = await StudyPreference.findOrCreate({
                where: { id_usuario: req.user.id },
                defaults: { id_usuario: req.user.id },
            });
            const suggestions = generateSuggestions(preference, settings);
            const created = [];

            for (const suggestion of suggestions) {
                const [reminder] = await StudyReminder.findOrCreate({
                    where: {
                        id_usuario: req.user.id,
                        programado_para: new Date(suggestion.scheduledAt),
                        materia: suggestion.subject,
                    },
                    defaults: {
                        id_usuario: req.user.id,
                        titulo: suggestion.title,
                        materia: suggestion.subject,
                        programado_para: new Date(suggestion.scheduledAt),
                        duracion_minutos: suggestion.durationMinutes,
                        origen: 'sugerido',
                    },
                });
                created.push(reminder);
            }

            res.status(201).json({ success: true, data: created });
        } catch (error) {
            next(error);
        }
    }

    static async updateReminderStatus(req, res, next) {
        try {
            const reminder = await StudyReminder.findOne({
                where: { id_recordatorio: req.params.id, id_usuario: req.user.id },
            });
            if (!reminder) {
                return res.status(404).json({ success: false, message: 'Recordatorio no encontrado' });
            }

            const status = ['pendiente', 'completado', 'omitido'].includes(req.body.status)
                ? req.body.status
                : 'pendiente';
            await reminder.update({ estado: status });
            return res.status(200).json({ success: true, data: reminder });
        } catch (error) {
            return next(error);
        }
    }

    static async updateSettings(req, res, next) {
        try {
            const current = await getPlanningSettings();
            const nextSettings = {
                sessionDurationMinutes: clampInteger(req.body.sessionDurationMinutes, 15, 180, current.sessionDurationMinutes),
                reminderLeadMinutes: clampInteger(req.body.reminderLeadMinutes, 0, 120, current.reminderLeadMinutes),
                pomodoroFocusMinutes: clampInteger(req.body.pomodoroFocusMinutes, 10, 90, current.pomodoroFocusMinutes),
                pomodoroBreakMinutes: clampInteger(req.body.pomodoroBreakMinutes, 3, 30, current.pomodoroBreakMinutes),
                maxSessionsPerDay: clampInteger(req.body.maxSessionsPerDay, 1, 8, current.maxSessionsPerDay),
            };
            const [settings] = await PlanningSetting.findOrCreate({
                where: { id_configuracion: 1 },
                defaults: { id_configuracion: 1 },
            });
            await settings.update({
                duracion_sesion_minutos: nextSettings.sessionDurationMinutes,
                aviso_anticipado_minutos: nextSettings.reminderLeadMinutes,
                pomodoro_enfoque_minutos: nextSettings.pomodoroFocusMinutes,
                pomodoro_descanso_minutos: nextSettings.pomodoroBreakMinutes,
                max_sesiones_dia: nextSettings.maxSessionsPerDay,
            });
            res.status(200).json({ success: true, data: toFrontendSettings(settings) });
        } catch (error) {
            next(error);
        }
    }
}

module.exports = PlanningController;
