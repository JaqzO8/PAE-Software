const { test } = require('node:test');
const assert = require('node:assert/strict');
const { randomUUID } = require('node:crypto');
const {
    validateTimeZone,
    validateStudyHours,
    transitionPomodoro,
    validateLessonCompletedEvent,
    PlanningError,
} = require('../src/modules/planning/domain/planningPolicy');
const { createPlanningUseCases } = require('../src/modules/planning/application/planningUseCases');
const { createDailyMission, completeDailyMission } = require('../src/modules/planning/domain/dailyMissionPolicy');

test('planningPolicy: valida zona horaria y rango de horas de estudio', () => {
    assert.equal(validateTimeZone('America/Lima'), 'America/Lima');
    assert.throws(() => validateTimeZone('Invalid/Zone'), PlanningError);

    const validHours = validateStudyHours('17:00', '20:00');
    assert.equal(validHours.startTime, '17:00');
    assert.equal(validHours.endTime, '20:00');

    // Hora inicio posterior a fin
    assert.throws(() => validateStudyHours('22:00', '18:00'), PlanningError);
});

test('planningPolicy: transiciones de estado del Pomodoro (RQ59)', () => {
    assert.equal(transitionPomodoro('idle', 'start'), 'running');
    assert.equal(transitionPomodoro('running', 'pause'), 'paused');
    assert.equal(transitionPomodoro('paused', 'resume'), 'running');
    assert.equal(transitionPomodoro('running', 'finish'), 'completed');
    assert.equal(transitionPomodoro('completed', 'reset'), 'idle');

    // Intentar pausar un Pomodoro que no está corriendo
    assert.throws(() => transitionPomodoro('idle', 'pause'), PlanningError);
    // Intentar reanudar un Pomodoro que ya está corriendo
    assert.throws(() => transitionPomodoro('running', 'resume'), PlanningError);
});

test('planningUseCases: devuelve sugerencias de horario en la zona configurada (RQ54)', async () => {
    const useCases = createPlanningUseCases({
        unitOfWork: (cb) => cb({
            findOrCreatePreferences: async () => ({
                dias_preferidos: [1, 2, 3, 4, 5],
                hora_inicio: '18:00',
                hora_fin: '21:00',
                materias: ['Matemáticas'],
                recordatorios_activos: true,
                zona_horaria: 'America/Lima',
            }),
            findUpcomingReminders: async () => [],
            findCompletedSessionsCount: async () => 0,
        }),
        clock: { now: () => new Date('2026-10-25T12:00:00.000Z') },
    });

    const overview = await useCases.getOverview({ userId: 7, timeZone: 'America/Lima' });
    assert.ok(overview.suggestions.length > 0);
    assert.equal(overview.suggestions[0].subject, 'Matemáticas');
    assert.equal(overview.suggestions[0].durationMinutes, 50);
});

test('planningUseCases: normaliza segundos de Pomodoro antes de persistirlos', async () => {
    const recorded = [];
    const useCases = createPlanningUseCases({
        unitOfWork: (cb) => cb({ recordPomodoroTransition: async (entry) => recorded.push(entry) }),
        clock: { now: () => new Date('2026-10-25T12:00:00.000Z') },
    });

    const result = await useCases.handlePomodoro({ userId: 7, currentState: 'idle', action: 'start', secondsElapsed: -20 });
    assert.equal(result.secondsElapsed, 0);
    assert.equal(recorded[0].secondsElapsed, 0);
});

test('planningUseCases: claim atómico de recordatorios previene envíos duplicados por workers concurrentes (JUA-AC-04)', async () => {
    let reminderState = {
        id_recordatorio: 42,
        id_usuario: 5,
        titulo: 'Sesión Álgebra',
        programado_para: new Date('2026-10-25T15:00:00.000Z'),
        estado: 'pendiente',
        reclamado_por: null,
    };

    const mockRepo = {
        findReminderForUpdate: async (id) => (id === 42 ? { ...reminderState } : null),
        updateReminderStatus: async (id, status, extra = {}) => {
            if (id === 42) {
                reminderState = { ...reminderState, estado: status, ...extra };
            }
        },
    };

    const clock = { now: () => new Date('2026-10-25T14:45:00.000Z') };
    const useCases = createPlanningUseCases({
        unitOfWork: (cb) => cb(mockRepo),
        clock,
    });

    // Worker 1 reclama el recordatorio
    const claim1 = await useCases.claimReminderOccurrence({ reminderId: 42, workerId: 'worker-node-1' });
    assert.equal(claim1.claimed, true);
    assert.equal(reminderState.estado, 'reclamado');
    assert.equal(reminderState.reclamado_por, 'worker-node-1');

    // Worker 2 intenta reclamar el MISMO recordatorio concurrentemente
    const claim2 = await useCases.claimReminderOccurrence({ reminderId: 42, workerId: 'worker-node-2' });
    assert.equal(claim2.claimed, false);
    assert.equal(claim2.reason, 'NOT_PENDING');
    assert.equal(claim2.currentStatus, 'reclamado');
});

test('planningUseCases: cancelación de recordatorios y aislamiento entre usuarios (JUA-AC-05)', async () => {
    const reminders = new Map([
        [101, { id_recordatorio: 101, id_usuario: 1, estado: 'pendiente' }],
        [102, { id_recordatorio: 102, id_usuario: 2, estado: 'pendiente' }],
    ]);

    const mockRepo = {
        findReminder: async (id) => reminders.get(id),
        updateReminderStatus: async (id, status) => {
            const r = reminders.get(id);
            if (r) r.estado = status;
        },
    };

    const useCases = createPlanningUseCases({
        unitOfWork: (cb) => cb(mockRepo),
    });

    // Usuario 1 intenta cancelar recordatorio de Usuario 2 -> debe denegarse (403)
    await assert.rejects(
        () => useCases.cancelSession({ userId: 1, reminderId: 102 }),
        (err) => err.status === 403
    );

    // Usuario 1 cancela su propio recordatorio -> permitido
    const result = await useCases.cancelSession({ userId: 1, reminderId: 101 });
    assert.equal(result.estado, 'cancelado');
    assert.equal(reminders.get(101).estado, 'cancelado');
});

test('planningUseCases: consumidor de LeccionCompletada.v1 proyecta progreso (JUA-12)', async () => {
    let savedProjection = null;
    const mockRepo = {
        recordLessonCompletionProjection: async (data) => {
            savedProjection = data;
            return { id: 1, ...data };
        },
    };

    const clock = { now: () => new Date('2026-10-25T16:00:00.000Z') };
    const useCases = createPlanningUseCases({
        unitOfWork: (cb) => cb(mockRepo),
        clock,
    });

    const validEvent = {
        eventId: randomUUID(),
        type: 'LeccionCompletada.v1',
        schemaVersion: 1,
        producer: 'content',
        occurredAt: '2026-10-25T15:59:50.000Z',
        correlationId: randomUUID(),
        data: {
            lessonId: 12,
            repositoryId: 4,
            userId: 9,
            completedAt: '2026-10-25T15:59:50.000Z',
        },
    };

    const res = await useCases.onLessonCompleted(validEvent);
    assert.equal(res.lessonId, 12);
    assert.equal(savedProjection.userId, 9);
});

test('planningUseCases: genera recordatorios idempotentes respetando zona horaria (RQ48/RQ54)', async () => {
    const created = [];
    const repo = {
        findOrCreatePreferences: async () => ({
            dias_preferidos: [1], hora_inicio: '18:00', hora_fin: '21:00',
            materias: ['Matemáticas'], recordatorios_activos: true, zona_horaria: 'America/Lima',
        }),
        findUpcomingReminders: async () => created,
        createReminder: async (data) => { const result = { id_recordatorio: created.length + 1, ...data }; created.push(result); return result; },
    };
    const useCases = createPlanningUseCases({
        unitOfWork: (callback) => callback(repo),
        clock: { now: () => new Date('2026-10-26T12:00:00.000Z') },
    });
    const first = await useCases.generateReminders({ userId: 9, timeZone: 'America/Lima' });
    const second = await useCases.generateReminders({ userId: 9, timeZone: 'America/Lima' });
    assert.equal(first.length, 1);
    assert.equal(second.length, 0);
    assert.match(first[0].programado_para.toISOString(), /T23:00:00\.000Z$/);
});

test('dailyMissionPolicy: crea una misión estable por usuario/día y completa de forma idempotente (RQ80)', () => {
    const mission = createDailyMission({ userId: 9, date: '2026-10-26', lessonIds: [3, 3, 4], questionCount: 5 });
    assert.equal(mission.lessonIds.length, 2);
    const completed = completeDailyMission(mission, { userId: 9, idempotencyKey: mission.id });
    const replay = completeDailyMission(completed, { userId: 9, idempotencyKey: mission.id });
    assert.equal(completed.status, 'completed');
    assert.equal(replay.replayed, true);
});
