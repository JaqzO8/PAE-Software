jest.mock('../../models', () => ({
    PlanningSetting: { findOrCreate: jest.fn() },
    StudyPreference: { findOrCreate: jest.fn() },
    StudyReminder: { findAll: jest.fn(), findOrCreate: jest.fn(), findOne: jest.fn(), update: jest.fn() },
}));
const { PlanningSetting, StudyPreference, StudyReminder } = require('../../models');
const controller = require('../../controllers/planningController');
let settings, preference, req, res, next;
const row = values => { const item = { ...values }; item.update = jest.fn(async changes => Object.assign(item, changes)); return item; };
beforeEach(() => {
    jest.resetAllMocks();
    jest.useFakeTimers().setSystemTime(new Date('2026-11-02T00:00:00Z'));
    settings = row({ duracion_sesion_minutos: 30, aviso_anticipado_minutos: 10,
        pomodoro_enfoque_minutos: 25, pomodoro_descanso_minutos: 5, max_sesiones_dia: 2 });
    preference = row({ dias_preferidos: [0, 1, 2, 3, 4, 5, 6], hora_inicio: '15:00', hora_fin: '17:00',
        materias: ['Matemática', 'Física'], recordatorios_activos: true, zona_horaria: 'America/Lima' });
    PlanningSetting.findOrCreate.mockResolvedValue([settings]);
    StudyPreference.findOrCreate.mockResolvedValue([preference]);
    StudyReminder.findAll.mockResolvedValue([]);
    req = { user: { id: 42 }, params: { id: '9' }, body: {} };
    res = { status: jest.fn().mockReturnThis(), json: jest.fn() }; next = jest.fn();
});
afterEach(() => jest.useRealTimers());

test('overview bounds study load, alternates subjects and reads only the current user', async () => {
    await controller.getOverview(req, res, next);
    expect(next).not.toHaveBeenCalled();
    expect(StudyReminder.findAll.mock.calls[0][0].where).toMatchObject({ id_usuario: 42, estado: 'pendiente' });
    const { suggestions, preference: result } = res.json.mock.calls[0][0].data;
    expect(result.timeZone).toBe('America/Lima');
    expect(suggestions).toHaveLength(12);
    expect(suggestions.slice(0, 2).map(item => item.subject)).toEqual(['Matemática', 'Física']);
    for (const item of suggestions) {
        expect(new Date(item.scheduledAt).getTime() - new Date(item.reminderAt).getTime()).toBe(600000);
        expect(item.durationMinutes).toBe(30);
    }
});

test('invalid optional preferences normalize safely and changed schedules cancel future reminders', async () => {
    req.body = { preferredDays: [6, 2, 2, -1, 8], startTime: 'bad', subjects: [' Física ', ''], timeZone: 'invalid/zone', userId: 99 };
    await controller.updatePreference(req, res, next);
    expect(preference).toMatchObject({ dias_preferidos: [2, 6], hora_inicio: '15:00', materias: ['Física'], zona_horaria: 'America/Lima' });
    expect(StudyPreference.findOrCreate.mock.calls[0][0].where).toEqual({ id_usuario: 42 });
    expect(StudyReminder.update.mock.calls[0][0]).toEqual({ estado: 'omitido' });
    expect(StudyReminder.update.mock.calls[0][1].where.id_usuario).toBe(42);
});

test('unchanged schedules retain reminders while disabling notifications cancels them', async () => {
    req.body = { preferredDays: preference.dias_preferidos, startTime: '15:00', endTime: '17:00', timeZone: 'America/Lima' };
    await controller.updatePreference(req, res, next);
    expect(StudyReminder.update).not.toHaveBeenCalled();
    req.body.remindersEnabled = false;
    await controller.updatePreference(req, res, next);
    expect(StudyReminder.update).toHaveBeenCalledTimes(1);
});

test.each([undefined, [], [99]])('empty or invalid days fall back to weekdays: %j', async preferredDays => {
    req.body = { preferredDays };
    await controller.updatePreference(req, res, next);
    expect(preference.dias_preferidos).toEqual([1, 2, 3, 4, 5]);
});

test('suggested reminders use a user/date/subject key to avoid duplicate inserts', async () => {
    preference.materias = [];
    StudyReminder.findOrCreate.mockImplementation(async ({ where, defaults }) => [{ ...defaults, ...where }]);
    await controller.generateReminders(req, res, next);
    expect(res.status).toHaveBeenCalledWith(201);
    const data = res.json.mock.calls[0][0].data;
    expect(data).toHaveLength(12);
    expect(data.every(item => item.id_usuario === 42 && item.materia === 'Matematicas')).toBe(true);
    expect(StudyReminder.findOrCreate.mock.calls[0][0].where).toEqual({ id_usuario: 42, programado_para: expect.any(Date), materia: 'Matematicas' });
});

test.each(['cancelReminder', 'updateReminderStatus'])('%s hides another user’s reminder', async method => {
    StudyReminder.findOne.mockResolvedValue(null);
    await controller[method](req, res, next);
    expect(StudyReminder.findOne).toHaveBeenCalledWith({ where: { id_recordatorio: '9', id_usuario: 42 } });
    expect(res.status).toHaveBeenCalledWith(404);
});

test.each([
    ['updateReminderStatus', 'pendiente', 'completado', 200, 'completado'],
    ['updateReminderStatus', 'completado', 'pendiente', 409, null],
    ['updateReminderStatus', 'pendiente', 'invalid', 200, 'pendiente'],
    ['cancelReminder', 'pendiente', undefined, 200, 'omitido'],
    ['cancelReminder', 'completado', undefined, 409, null],
])('%s applies valid transitions from %s to %s', async (method, estado, status, code, expected) => {
    const reminder = row({ estado }); StudyReminder.findOne.mockResolvedValue(reminder); req.body.status = status;
    await controller[method](req, res, next);
    expect(res.status).toHaveBeenCalledWith(code);
    if (expected) expect(reminder.estado).toBe(expected);
    else expect(reminder.update).not.toHaveBeenCalled();
});

test('settings clamp duration and workload and preserve valid defaults for non-numeric input', async () => {
    req.body = { sessionDurationMinutes: 999, reminderLeadMinutes: -1, pomodoroFocusMinutes: 'x', pomodoroBreakMinutes: 1, maxSessionsPerDay: 20 };
    await controller.updateSettings(req, res, next);
    expect(res.json.mock.calls[0][0].data).toEqual({ sessionDurationMinutes: 180, reminderLeadMinutes: 0,
        pomodoroFocusMinutes: 25, pomodoroBreakMinutes: 3, maxSessionsPerDay: 8 });
});

test.each(['getOverview', 'updatePreference', 'generateReminders', 'updateReminderStatus', 'cancelReminder', 'updateSettings'])('%s forwards database errors without claiming success', async method => {
    const error = new Error('database unavailable');
    PlanningSetting.findOrCreate.mockRejectedValue(error); StudyPreference.findOrCreate.mockRejectedValue(error); StudyReminder.findOne.mockRejectedValue(error);
    await controller[method](req, res, next);
    expect(next).toHaveBeenCalledWith(error);
    expect(res.json).not.toHaveBeenCalled();
});
