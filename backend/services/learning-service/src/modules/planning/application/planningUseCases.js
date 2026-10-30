const {
    fail,
    positiveId,
    validateTimeZone,
    normalizeDays,
    validateStudyHours,
    transitionPomodoro,
    validateLessonCompletedEvent,
    DEFAULT_TIMEZONE,
} = require('../domain/planningPolicy');
const { createDailyMission, completeDailyMission } = require('../domain/dailyMissionPolicy');

const zonedDateParts = (date, timeZone) => {
    const parts = new Intl.DateTimeFormat('en-US', {
        timeZone, year: 'numeric', month: '2-digit', day: '2-digit',
        hour: '2-digit', minute: '2-digit', hourCycle: 'h23', weekday: 'short',
    }).formatToParts(date).reduce((result, part) => ({ ...result, [part.type]: part.value }), {});
    return parts;
};

const scheduledAtInZone = (date, time, timeZone) => {
    const localDate = zonedDateParts(date, timeZone);
    const [hour, minute] = time.split(':').map(Number);
    const targetLocalMs = Date.UTC(Number(localDate.year), Number(localDate.month) - 1, Number(localDate.day), hour, minute);
    const guess = new Date(targetLocalMs);
    const guessLocal = zonedDateParts(guess, timeZone);
    const guessLocalMs = Date.UTC(Number(guessLocal.year), Number(guessLocal.month) - 1, Number(guessLocal.day), Number(guessLocal.hour), Number(guessLocal.minute));
    return new Date(guess.getTime() + targetLocalMs - guessLocalMs);
};

/**
 * Casos de uso de Planificación de Estudio (Módulo 5 en learning-service).
 * Desacoplado de infraestructura y persistencia mediante puertos.
 *
 * Puertos requeridos:
 * - unitOfWork(async (repo) => ...): Transacción atómica.
 * - clock: { now: () => Date }
 */
function createPlanningUseCases({ unitOfWork, clock = { now: () => new Date() } }) {
    const defaultSettings = {
        sessionDurationMinutes: 50,
        reminderLeadMinutes: 15,
        pomodoroFocusMinutes: 25,
        pomodoroBreakMinutes: 5,
        maxSessionsPerDay: 4,
    };

const buildStudySuggestions = (preferences, now, timeZone) => {
    const suggestions = [];
    for (let offset = 1; offset <= 7; offset += 1) {
        const date = new Date(now);
        date.setUTCDate(date.getUTCDate() + offset);
        const local = zonedDateParts(date, timeZone);
        const weekday = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].indexOf(local.weekday);
        if (!preferences.dias_preferidos.includes(weekday)) continue;
        const scheduledAt = scheduledAtInZone(date, preferences.hora_inicio, timeZone);
        const subject = preferences.materias[0] || 'estudio';
        suggestions.push({
            title: `Sesión de ${subject}`,
            subject,
            scheduledAt: scheduledAt.toISOString(),
            durationMinutes: defaultSettings.sessionDurationMinutes,
            reminderAt: new Date(scheduledAt.getTime() - defaultSettings.reminderLeadMinutes * 60000).toISOString(),
        });
    }
    return suggestions;
};

    return {
        /**
         * Obtener vista general de planificación (preferencias, recordatorios y sugerencias)
         */
        getOverview: async ({ userId, timeZone = DEFAULT_TIMEZONE }) => {
            const uid = positiveId(userId);
            const validTz = validateTimeZone(timeZone);

            return unitOfWork(async (repo) => {
                const preference = await repo.findOrCreatePreferences(uid, {
                    id_usuario: uid,
                    dias_preferidos: [1, 2, 3, 4, 5],
                    hora_inicio: '18:00',
                    hora_fin: '21:00',
                    materias: ['Matematicas', 'Comunicacion'],
                    recordatorios_activos: true,
                    zona_horaria: validTz,
                });

                const activeReminders = await repo.findUpcomingReminders(uid, clock.now());
                const completedSessions = await repo.findCompletedSessionsCount(uid);

                return {
                    settings: defaultSettings,
                    preferences: {
                        preferredDays: preference.dias_preferidos,
                        startTime: preference.hora_inicio,
                        endTime: preference.hora_fin,
                        subjects: preference.materias,
                        remindersEnabled: preference.recordatorios_activos,
                        timeZone: preference.zona_horaria || validTz,
                    },
                    upcomingReminders: activeReminders,
                    suggestions: buildStudySuggestions(preference, clock.now(), validTz),
                    completedSessionsCount: completedSessions,
                };
            });
        },

        /**
         * Actualizar preferencias de estudio del estudiante
         */
        updatePreferences: async ({
            userId,
            preferredDays,
            startTime,
            endTime,
            subjects,
            remindersEnabled = true,
            timeZone = DEFAULT_TIMEZONE,
        }) => {
            const uid = positiveId(userId);
            const validTz = validateTimeZone(timeZone);
            const { startTime: cleanStart, endTime: cleanEnd } = validateStudyHours(startTime, endTime);
            const cleanDays = normalizeDays(preferredDays);

            const cleanSubjects = Array.isArray(subjects) && subjects.length > 0
                ? subjects.map((s) => String(s).trim()).filter(Boolean)
                : ['General'];

            return unitOfWork(async (repo) => {
                const updated = await repo.savePreferences(uid, {
                    id_usuario: uid,
                    dias_preferidos: cleanDays,
                    hora_inicio: cleanStart,
                    hora_fin: cleanEnd,
                    materias: cleanSubjects,
                    recordatorios_activos: Boolean(remindersEnabled),
                    zona_horaria: validTz,
                });

                // Si se desactivaron los recordatorios, cancelar ocurrencias pendientes para no enviar avisos obsoletos
                if (!remindersEnabled) {
                    await repo.cancelPendingReminders(uid);
                }

                return updated;
            });
        },

        /**
         * Programar una sesión o recordatorio de estudio
         */
        scheduleSession: async ({
            userId,
            title,
            subject = null,
            scheduledAt,
            durationMinutes = 50,
            origin = 'manual',
            timeZone = DEFAULT_TIMEZONE,
        }) => {
            const uid = positiveId(userId);
            validateTimeZone(timeZone);

            if (!title || typeof title !== 'string' || !title.trim()) {
                fail('INVALID_SESSION_TITLE', 'El título de la sesión es requerido');
            }

            const scheduleDate = new Date(scheduledAt);
            if (Number.isNaN(scheduleDate.getTime()) || scheduleDate <= clock.now()) {
                fail('INVALID_SCHEDULE_DATE', 'La fecha programada debe ser en el futuro');
            }

            return unitOfWork(async (repo) => {
                return repo.createReminder({
                    id_usuario: uid,
                    titulo: title.trim(),
                    materia: subject ? String(subject).trim() : null,
                    programado_para: scheduleDate,
                    duracion_minutos: Math.max(10, Math.min(240, Number(durationMinutes) || 50)),
                    estado: 'pendiente',
                    origen: origin || 'manual',
                });
            });
        },

        generateReminders: async ({ userId, timeZone = DEFAULT_TIMEZONE }) => {
            const uid = positiveId(userId);
            const validTz = validateTimeZone(timeZone);
            return unitOfWork(async (repo) => {
                const preferences = await repo.findOrCreatePreferences(uid, {
                    id_usuario: uid,
                    dias_preferidos: [1, 2, 3, 4, 5],
                    hora_inicio: '18:00',
                    hora_fin: '21:00',
                    materias: ['General'],
                    recordatorios_activos: true,
                    zona_horaria: validTz,
                });
                if (!preferences.recordatorios_activos) return [];
                const existing = await repo.findUpcomingReminders(uid, clock.now());
                const existingKeys = new Set(existing.map((item) => `${new Date(item.programado_para).toISOString()}|${item.titulo}`));
                const generated = [];
                for (let offset = 1; offset <= 7; offset += 1) {
                    const date = new Date(clock.now());
                    date.setUTCDate(date.getUTCDate() + offset);
                    const local = zonedDateParts(date, validTz);
                    const weekday = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].indexOf(local.weekday);
                    if (!preferences.dias_preferidos.includes(weekday)) continue;
                    const scheduledAt = scheduledAtInZone(date, preferences.hora_inicio, validTz);
                    const title = `Sesión de ${preferences.materias[0] || 'estudio'}`;
                    const key = `${scheduledAt.toISOString()}|${title}`;
                    if (existingKeys.has(key)) continue;
                    const reminder = await repo.createReminder({
                        id_usuario: uid,
                        titulo: title,
                        materia: preferences.materias[0] || null,
                        programado_para: scheduledAt,
                        duracion_minutos: defaultSettings.sessionDurationMinutes,
                        estado: 'pendiente',
                        origen: 'preferencias',
                        zona_horaria: validTz,
                    });
                    generated.push(reminder);
                    existingKeys.add(key);
                }
                return generated;
            });
        },

        /**
         * Cancelar una sesión o recordatorio de estudio (JUA-AC-05)
         * Invalida la ocurrencia para que ningún worker la procese ni envíe avisos obsoletos.
         */
        cancelSession: async ({ userId, reminderId }) => {
            const uid = positiveId(userId);
            const rid = positiveId(reminderId);

            return unitOfWork(async (repo) => {
                const reminder = await repo.findReminder(rid);
                if (!reminder) {
                    fail('REMINDER_NOT_FOUND', 'Recordatorio no encontrado', 404);
                }
                if (Number(reminder.id_usuario) !== uid) {
                    fail('FORBIDDEN_REMINDER', 'No puedes cancelar recordatorios de otro usuario', 403);
                }

                await repo.updateReminderStatus(rid, 'cancelado');
                return { id_recordatorio: rid, estado: 'cancelado' };
            });
        },

        updateReminderStatus: async ({ userId, reminderId, status }) => {
            const uid = positiveId(userId);
            const rid = positiveId(reminderId);
            if (!['pendiente', 'completado', 'omitido'].includes(status)) fail('INVALID_REMINDER_STATUS', 'Estado de recordatorio inválido');
            return unitOfWork(async (repo) => {
                const reminder = await repo.findReminder(rid);
                if (!reminder) fail('REMINDER_NOT_FOUND', 'Recordatorio no encontrado', 404);
                if (Number(reminder.id_usuario) !== uid) fail('FORBIDDEN_REMINDER', 'No puedes modificar recordatorios de otro usuario', 403);
                return repo.updateReminderStatus(rid, status === 'completado' ? 'enviado' : status === 'omitido' ? 'cancelado' : status);
            });
        },

        createMission: async ({ userId, date, lessonIds, questionCount = 5 }) => {
            const mission = createDailyMission({ userId, date, lessonIds, questionCount });
            return unitOfWork(async (repo) => repo.saveDailyMission(mission));
        },

        completeMission: async ({ userId, missionId }) => unitOfWork(async (repo) => {
            const mission = await repo.findDailyMission(missionId);
            const completed = completeDailyMission(mission, { userId, idempotencyKey: missionId });
            if (!completed.replayed) await repo.completeDailyMission(missionId, completed.completedAt);
            return completed;
        }),

        /**
         * Reclamar ocurrencia de recordatorio de forma atómica para workers concurrentes (JUA-AC-04)
         * Si dos workers intentan procesar el mismo recordatorio, solo uno obtiene el lock y claim=true.
         */
        claimReminderOccurrence: async ({ reminderId, workerId }) => {
            const rid = positiveId(reminderId);
            if (!workerId || typeof workerId !== 'string') {
                fail('INVALID_WORKER_ID', 'workerId es requerido para reclamar ocurrencia');
            }

            return unitOfWork(async (repo) => {
                const reminder = await repo.findReminderForUpdate(rid);
                if (!reminder) return { claimed: false, reason: 'NOT_FOUND' };
                if (reminder.estado !== 'pendiente') {
                    return { claimed: false, reason: 'NOT_PENDING', currentStatus: reminder.estado };
                }

                await repo.updateReminderStatus(rid, 'reclamado', {
                    reclamado_por: workerId,
                    reclamado_en: clock.now(),
                });

                return {
                    claimed: true,
                    reminder: {
                        id_recordatorio: reminder.id_recordatorio,
                        id_usuario: reminder.id_usuario,
                        titulo: reminder.titulo,
                        programado_para: reminder.programado_para,
                    },
                };
            });
        },

        /**
         * Registrar resultado de envío de recordatorio
         */
        completeReminderDelivery: async ({ reminderId, success, error = null }) => {
            const rid = positiveId(reminderId);
            return unitOfWork(async (repo) => {
                const newStatus = success ? 'enviado' : 'fallido';
                await repo.updateReminderStatus(rid, newStatus, {
                    fecha_entrega: clock.now(),
                    error_entrega: error ? String(error).slice(0, 255) : null,
                });
                return { id_recordatorio: rid, estado: newStatus };
            });
        },

        /**
         * Gestión de Pomodoro (JUA-14, RQ59)
         */
        handlePomodoro: async ({ userId, currentState, action, secondsElapsed = 0 }) => {
            positiveId(userId);
            const nextState = transitionPomodoro(currentState, action);
            const normalizedSeconds = Math.max(0, Math.min(86400, Number(secondsElapsed) || 0));
            const result = {
                previousState: currentState,
                currentState: nextState,
                secondsElapsed: normalizedSeconds,
                updatedAt: clock.now().toISOString(),
            };
            return unitOfWork(async (repo) => {
                if (repo.recordPomodoroTransition) {
                    await repo.recordPomodoroTransition({ userId: Number(userId), ...result, action, occurredAt: clock.now() });
                }
                return result;
            });
        },

        /**
         * Consumidor durable de evento LeccionCompletada.v1 (JUA-12)
         * Proyecta el progreso de lección en el módulo de aprendizaje sin escribir a Contenido.
         */
        onLessonCompleted: async (event) => {
            validateLessonCompletedEvent(event);
            const { lessonId, userId, repositoryId, completedAt } = event.data;

            return unitOfWork(async (repo) => {
                return repo.recordLessonCompletionProjection({
                    lessonId: positiveId(lessonId),
                    userId: positiveId(userId),
                    repositoryId: positiveId(repositoryId),
                    completedAt: completedAt || clock.now().toISOString(),
                    receivedAt: clock.now().toISOString(),
                });
            });
        },
    };
}

module.exports = { createPlanningUseCases };
