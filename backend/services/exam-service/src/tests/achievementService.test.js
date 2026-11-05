jest.mock('../models', () => ({
    AchievementDefinition: { findAll: jest.fn() }, SimulacroAttempt: { count: jest.fn() },
    UserAchievement: { findOne: jest.fn(), create: jest.fn(), findAll: jest.fn() },
    LearningNotification: { create: jest.fn(), findAll: jest.fn(), findOne: jest.fn() },
}));
const { AchievementDefinition, SimulacroAttempt, UserAchievement, LearningNotification } = require('../models');
const Service = require('../services/achievementService');
const definition = { id_logro: 3, codigo: 'first', titulo: 'Primer intento', descripcion: 'Práctica completada', icono: 'star', puntos: 10, condicion: 'attempts_count', umbral: 1 };
beforeEach(() => {
    jest.resetAllMocks(); AchievementDefinition.findAll.mockResolvedValue([definition]);
    SimulacroAttempt.count.mockResolvedValue(1); UserAchievement.findOne.mockResolvedValue(null);
    UserAchievement.create.mockImplementation(async data => ({ ...data, id_usuario_logro: 9, fecha_obtenido: '2026-01-01' }));
});
test('earned achievement creates one user-scoped notification and frontend DTO', async () => {
    const result = await Service.evaluateUser(7, { id_intento: 8, total_preguntas: 10, correctas: 8 });
    expect(result).toEqual([{ id: '9', code: 'first', title: 'Primer intento', description: 'Práctica completada', icon: 'star', points: 10,
        earnedAt: '2026-01-01', metadata: { attemptsCount: 1, latestAccuracy: 80, attemptId: 8 } }]);
    expect(LearningNotification.create).toHaveBeenCalledWith(expect.objectContaining({ id_usuario: 7, tipo: 'logro', metadata: { achievementCode: 'first', points: 10 }, canal_email_pendiente: true }));
});
test('already earned awards do not create duplicate rewards or notifications', async () => {
    UserAchievement.findOne.mockResolvedValue({ id_usuario_logro: 9 });
    expect(await Service.evaluateUser(7)).toEqual([]); expect(UserAchievement.create).not.toHaveBeenCalled(); expect(LearningNotification.create).not.toHaveBeenCalled();
});
test.each([
    ['attempts_count', 2, undefined, 0], ['single_attempt_accuracy', 80, { total_preguntas: 5, correctas: 4 }, 1],
    ['single_attempt_accuracy', 81, { total_preguntas: 5, correctas: 4 }, 0],
    ['single_attempt_accuracy', 1, { total_preguntas: 0 }, 0], ['unknown-condition', 0, undefined, 0],
])('award condition %s with threshold %s is evaluated from persisted attempts', async (condicion, umbral, attempt, count) => {
    AchievementDefinition.findAll.mockResolvedValue([{ ...definition, condicion, umbral }]);
    expect(await Service.evaluateUser(7, attempt)).toHaveLength(count); expect(UserAchievement.create).toHaveBeenCalledTimes(count);
});
test('achievement listing preserves user scope and earned date', async () => {
    UserAchievement.findAll.mockResolvedValue([{ id_usuario_logro: 9, logro: definition, fecha_obtenido: '2026-01-01', metadata: {} }]);
    expect(await Service.listUserAchievements(7)).toEqual([expect.objectContaining({ id: '9', code: 'first', earnedAt: '2026-01-01' })]);
    expect(UserAchievement.findAll.mock.calls[0][0].where).toEqual({ id_usuario: 7 });
});
test('notifications map timestamps and never query another user', async () => {
    LearningNotification.findAll.mockResolvedValue([{ id_notificacion: 1, tipo: 'logro', leida: false, createdAt: 'today' }, { id_notificacion: 2, leida: true, created_at: 'yesterday' }]);
    const result = await Service.listNotifications(7);
    expect(result).toMatchObject([{ id: '1', type: 'logro', read: false, createdAt: 'today' }, { id: '2', read: true, createdAt: 'yesterday' }]);
    expect(LearningNotification.findAll.mock.calls[0][0]).toMatchObject({ where: { id_usuario: 7 }, limit: 50 });
});
test('read acknowledgements cannot update an inaccessible notification', async () => {
    LearningNotification.findOne.mockResolvedValue(null); expect(await Service.markNotificationRead(7, 8)).toBeNull();
    const item = { update: jest.fn() }; LearningNotification.findOne.mockResolvedValue(item);
    expect(await Service.markNotificationRead(7, 8)).toBe(item);
    expect(LearningNotification.findOne).toHaveBeenLastCalledWith({ where: { id_notificacion: 8, id_usuario: 7 } });
    expect(item.update).toHaveBeenCalledWith({ leida: true });
});
test('database failure is propagated without inventing an earned reward', async () => {
    const error = new Error('database unavailable'); UserAchievement.create.mockRejectedValue(error);
    await expect(Service.evaluateUser(7)).rejects.toBe(error); expect(LearningNotification.create).not.toHaveBeenCalled();
});
