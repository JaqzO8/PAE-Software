const express = require('express');

function createPlanningRoutes({ planningUseCases, authenticate }) {
    const router = express.Router();
    router.use(authenticate);
    const call = (handler) => async (req, res, next) => {
        try { res.json({ success: true, data: await handler(req) }); } catch (error) { next(error); }
    };
    router.get('/', call(async (req) => {
        const result = await planningUseCases.getOverview({ userId: req.user.id, timeZone: req.query.timeZone });
        return {
            settings: result.settings,
            preference: result.preferences,
            suggestions: result.suggestions || [],
            reminders: result.upcomingReminders,
        };
    }));
    router.put('/preferences', call(async (req) => {
        const result = await planningUseCases.updatePreferences({ userId: req.user.id, ...req.body });
        return {
            preferredDays: result.dias_preferidos,
            startTime: result.hora_inicio,
            endTime: result.hora_fin,
            subjects: result.materias,
            remindersEnabled: result.recordatorios_activos,
            timeZone: result.zona_horaria,
        };
    }));
    router.post('/reminders', call((req) => planningUseCases.scheduleSession({ userId: req.user.id, ...req.body })));
    router.post('/reminders/generate', call(async (req) => {
        return planningUseCases.generateReminders({ userId: req.user.id, timeZone: req.body?.timeZone });
    }));
    router.patch('/reminders/:id/cancel', call((req) => planningUseCases.cancelSession({ userId: req.user.id, reminderId: req.params.id })));
    router.patch('/reminders/:id/status', call((req) => planningUseCases.updateReminderStatus({ userId: req.user.id, reminderId: req.params.id, status: req.body.status })));
    router.post('/pomodoro', call((req) => planningUseCases.handlePomodoro({ userId: req.user.id, currentState: req.body.currentState, action: req.body.action, secondsElapsed: req.body.secondsElapsed })));
    router.post('/missions/daily', call((req) => planningUseCases.createMission({ userId: req.user.id, ...req.body })));
    router.post('/missions/:id/complete', call((req) => planningUseCases.completeMission({ userId: req.user.id, missionId: req.params.id })));
    return router;
}

module.exports = { createPlanningRoutes };
