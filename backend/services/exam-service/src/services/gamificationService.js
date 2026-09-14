const {
    AchievementDefinition,
    GamificationEvent,
    GamificationProfile,
    GamificationSetting,
    SimulacroAttempt,
    UserAchievement,
} = require('../models');
const AchievementService = require('./achievementService');
const config = require('../config/env');

const DEFAULT_ONBOARDING_STEPS = [
    {
        id: 'perfil_objetivo',
        title: 'Define tu meta',
        description: 'Revisa tu perfil y confirma la universidad o carrera objetivo.',
        route: '/perfil',
    },
    {
        id: 'primer_simulacro',
        title: 'Completa un simulacro',
        description: 'Haz tu primer intento para desbloquear diagnostico y recomendaciones.',
        route: '/aprendizaje/simulacros',
    },
    {
        id: 'repaso_guardado',
        title: 'Guarda una pregunta dificil',
        description: 'Usa el solucionario para crear tu lista personal de repaso.',
        route: '/aprendizaje/preguntas-guardadas',
    },
    {
        id: 'reto_en_vivo',
        title: 'Participa en una actividad en vivo',
        description: 'Responde una pregunta en desafio o trivia para ganar puntos por velocidad.',
        route: '/aprendizaje/desafios',
    },
];

const DEFAULT_GAMIFICATION_SETTINGS = {
    id_configuracion: 1,
    puntos_simulacro_completado: 15,
    puntos_precision_destacada: 20,
    umbral_precision_destacada: 80,
    ratio_puntos_en_vivo: 0.05,
    puntos_onboarding: 10,
    puntos_base_nivel: 100,
    incremento_puntos_nivel: 50,
    limite_ranking: 10,
    onboarding_steps: DEFAULT_ONBOARDING_STEPS,
};

const userDisplayName = (user = {}) => (
    [user.nombres, user.apellidos].filter(Boolean).join(' ').trim()
    || user.email
    || 'Usuario PAE'
);

const toFrontendSettings = (settings) => ({
    attemptCompletedPoints: Number(settings.puntos_simulacro_completado),
    highAccuracyBonusPoints: Number(settings.puntos_precision_destacada),
    highAccuracyThreshold: Number(settings.umbral_precision_destacada),
    livePointsRatio: Number(settings.ratio_puntos_en_vivo),
    onboardingStepPoints: Number(settings.puntos_onboarding),
    baseLevelPoints: Number(settings.puntos_base_nivel),
    levelPointsIncrement: Number(settings.incremento_puntos_nivel),
    leaderboardLimit: Number(settings.limite_ranking),
    onboardingSteps: Array.isArray(settings.onboarding_steps) && settings.onboarding_steps.length > 0
        ? settings.onboarding_steps
        : DEFAULT_ONBOARDING_STEPS,
});

const toDbSettings = (settings) => ({
    puntos_simulacro_completado: settings.attemptCompletedPoints,
    puntos_precision_destacada: settings.highAccuracyBonusPoints,
    umbral_precision_destacada: settings.highAccuracyThreshold,
    ratio_puntos_en_vivo: settings.livePointsRatio,
    puntos_onboarding: settings.onboardingStepPoints,
    puntos_base_nivel: settings.baseLevelPoints,
    incremento_puntos_nivel: settings.levelPointsIncrement,
    limite_ranking: settings.leaderboardLimit,
    onboarding_steps: settings.onboardingSteps,
});

const calculateLevel = (points, settings) => {
    let level = 1;
    let nextLevelAt = Number(settings.baseLevelPoints);
    const increment = Number(settings.levelPointsIncrement);

    while (points >= nextLevelAt) {
        level += 1;
        nextLevelAt += Number(settings.baseLevelPoints) + ((level - 1) * increment);
    }

    const previousLevelAt = level === 1 ? 0 : nextLevelAt - (Number(settings.baseLevelPoints) + ((level - 1) * increment));
    return {
        level,
        currentLevelStart: previousLevelAt,
        nextLevelAt,
        progressPercent: Math.min(100, Math.round(((points - previousLevelAt) / Math.max(1, nextLevelAt - previousLevelAt)) * 100)),
    };
};

const attemptAccuracy = (attempt) => {
    const total = Number(attempt.total_preguntas || 0);
    if (!total) return 0;
    return Math.round((Number(attempt.correctas || 0) / total) * 100);
};

const cacheStore = {
    summary: new Map(),
    leaderboard: new Map(),
};

const getCache = (store, key) => {
    const cached = store.get(key);
    if (!cached || cached.expiresAt <= Date.now()) {
        store.delete(key);
        return null;
    }
    return cached.value;
};

const setCache = (store, key, value, ttlSeconds) => {
    if (ttlSeconds <= 0) return;
    store.set(key, {
        value,
        expiresAt: Date.now() + ttlSeconds * 1000,
    });
};

const clearUserCache = (userId) => {
    cacheStore.summary.delete(String(userId));
    cacheStore.leaderboard.clear();
};

class GamificationService {
    static async getSettings() {
        const [settings] = await GamificationSetting.findOrCreate({
            where: { id_configuracion: 1 },
            defaults: DEFAULT_GAMIFICATION_SETTINGS,
        });
        return toFrontendSettings(settings);
    }

    static async updateSettings(payload) {
        const current = await GamificationService.getSettings();
        const sanitized = {
            ...current,
            ...payload,
            onboardingSteps: Array.isArray(payload.onboardingSteps) && payload.onboardingSteps.length > 0
                ? payload.onboardingSteps
                : current.onboardingSteps,
        };

        const bounded = {
            attemptCompletedPoints: Math.min(200, Math.max(0, Number(sanitized.attemptCompletedPoints))),
            highAccuracyBonusPoints: Math.min(300, Math.max(0, Number(sanitized.highAccuracyBonusPoints))),
            highAccuracyThreshold: Math.min(100, Math.max(50, Number(sanitized.highAccuracyThreshold))),
            livePointsRatio: Math.min(1, Math.max(0, Number(sanitized.livePointsRatio))),
            onboardingStepPoints: Math.min(100, Math.max(0, Number(sanitized.onboardingStepPoints))),
            baseLevelPoints: Math.min(1000, Math.max(50, Number(sanitized.baseLevelPoints))),
            levelPointsIncrement: Math.min(500, Math.max(0, Number(sanitized.levelPointsIncrement))),
            leaderboardLimit: Math.min(50, Math.max(3, Number(sanitized.leaderboardLimit))),
            onboardingSteps: sanitized.onboardingSteps,
        };

        const [settings] = await GamificationSetting.findOrCreate({
            where: { id_configuracion: 1 },
            defaults: { id_configuracion: 1, ...toDbSettings(bounded) },
        });
        await settings.update(toDbSettings(bounded));
        cacheStore.summary.clear();
        cacheStore.leaderboard.clear();
        return bounded;
    }

    static async getOrCreateProfile(user) {
        const settings = await GamificationService.getSettings();
        const [profile] = await GamificationProfile.findOrCreate({
            where: { id_usuario: user.id },
            defaults: {
                id_usuario: user.id,
                display_name: userDisplayName(user),
                rol: user.rol || 'estudiante',
                puntos_total: 0,
                nivel: 1,
            },
        });

        const levelInfo = calculateLevel(Number(profile.puntos_total), settings);
        const updates = {};
        if (profile.display_name !== userDisplayName(user)) updates.display_name = userDisplayName(user);
        if (profile.rol !== (user.rol || 'estudiante')) updates.rol = user.rol || 'estudiante';
        if (profile.nivel !== levelInfo.level) updates.nivel = levelInfo.level;
        if (Object.keys(updates).length > 0) await profile.update(updates);

        return profile.reload();
    }

    static async awardPoints({ user, type, points, description, metadata = {}, idempotencyKey }) {
        const amount = Math.max(0, Math.round(Number(points || 0)));
        if (amount <= 0) return null;

        if (idempotencyKey) {
            const existing = await GamificationEvent.findOne({ where: { clave_idempotencia: idempotencyKey } });
            if (existing) return null;
        }

        const profile = await GamificationService.getOrCreateProfile(user);
        const settings = await GamificationService.getSettings();
        const event = await GamificationEvent.create({
            id_usuario: user.id,
            tipo: type,
            puntos: amount,
            descripcion: description,
            metadata,
            clave_idempotencia: idempotencyKey || null,
        });

        const totalPoints = Number(profile.puntos_total) + amount;
        const levelInfo = calculateLevel(totalPoints, settings);
        await profile.update({
            puntos_total: totalPoints,
            nivel: levelInfo.level,
            ultima_actividad: new Date(),
        });
        clearUserCache(user.id);

        return {
            event,
            profile: await profile.reload(),
            levelInfo,
        };
    }

    static async processSimulacroSubmission(user, attempt, newAchievements = []) {
        const settings = await GamificationService.getSettings();
        const accuracy = attemptAccuracy(attempt);
        const events = [];

        const completed = await GamificationService.awardPoints({
            user,
            type: 'simulacro',
            points: settings.attemptCompletedPoints,
            description: 'Simulacro completado',
            metadata: { attemptId: attempt.id_intento, accuracy },
            idempotencyKey: `simulacro:${attempt.id_intento}:completed`,
        });
        if (completed) events.push(completed.event);

        if (accuracy >= settings.highAccuracyThreshold) {
            const bonus = await GamificationService.awardPoints({
                user,
                type: 'bono_precision',
                points: settings.highAccuracyBonusPoints,
                description: `Bono por precision de ${accuracy}%`,
                metadata: { attemptId: attempt.id_intento, accuracy },
                idempotencyKey: `simulacro:${attempt.id_intento}:accuracy-bonus`,
            });
            if (bonus) events.push(bonus.event);
        }

        for (const achievement of newAchievements) {
            const awarded = await GamificationService.awardPoints({
                user,
                type: 'logro',
                points: achievement.points,
                description: `Medalla desbloqueada: ${achievement.title}`,
                metadata: { achievementCode: achievement.code },
                idempotencyKey: `achievement:${user.id}:${achievement.code}`,
            });
            if (awarded) events.push(awarded.event);
        }

        return GamificationService.getSummary(user, events.length);
    }

    static async awardLiveAnswer(user, payload, source) {
        if (!payload.correct) return null;
        const settings = await GamificationService.getSettings();
        const points = Math.max(1, Math.round(Number(payload.points || 0) * settings.livePointsRatio));
        const idempotencyKey = `${source}:${payload.matchId}:${payload.questionId}:${user.id}`;

        const result = await GamificationService.awardPoints({
            user,
            type: source,
            points,
            description: source === 'trivia' ? 'Respuesta correcta en trivia' : 'Respuesta correcta en desafio',
            metadata: payload,
            idempotencyKey,
        });

        return result ? {
            pointsAwarded: points,
            totalPoints: result.profile.puntos_total,
            level: result.profile.nivel,
        } : null;
    }

    static async completeOnboardingStep(user, stepId) {
        const settings = await GamificationService.getSettings();
        const validStep = settings.onboardingSteps.find((step) => step.id === stepId);
        if (!validStep) {
            const error = new Error('Paso de onboarding no encontrado');
            error.status = 404;
            throw error;
        }

        const profile = await GamificationService.getOrCreateProfile(user);
        const completed = Array.isArray(profile.onboarding_completed_steps)
            ? profile.onboarding_completed_steps
            : [];

        if (!completed.includes(stepId)) {
            await profile.update({ onboarding_completed_steps: [...completed, stepId] });
            await GamificationService.awardPoints({
                user,
                type: 'onboarding',
                points: settings.onboardingStepPoints,
                description: `Onboarding completado: ${validStep.title}`,
                metadata: { stepId },
                idempotencyKey: `onboarding:${user.id}:${stepId}`,
            });
        }

        return GamificationService.getSummary(user);
    }

    static async syncProfileFromHistory(user) {
        await GamificationService.getOrCreateProfile(user);
        const attempts = await SimulacroAttempt.findAll({
            where: { id_usuario: user.id, estado: 'finalizado' },
            order: [['fecha_fin', 'ASC']],
        });
        for (const attempt of attempts) {
            await GamificationService.processSimulacroSubmission(user, attempt, []);
        }

        const achievements = await UserAchievement.findAll({
            where: { id_usuario: user.id },
            include: [{ model: AchievementDefinition, as: 'logro' }],
        });
        for (const achievement of achievements) {
            await GamificationService.awardPoints({
                user,
                type: 'logro',
                points: achievement.logro?.puntos || 0,
                description: `Medalla desbloqueada: ${achievement.logro?.titulo || 'Logro'}`,
                metadata: { achievementCode: achievement.logro?.codigo },
                idempotencyKey: `achievement:${user.id}:${achievement.logro?.codigo}`,
            });
        }

        return GamificationService.getSummary(user);
    }

    static async getSummary(user, newEventsCount = 0) {
        const cacheKey = String(user.id);
        if (newEventsCount === 0) {
            const cached = getCache(cacheStore.summary, cacheKey);
            if (cached) return cached;
        }

        const [profile, settings, achievements, recentEvents] = await Promise.all([
            GamificationService.getOrCreateProfile(user),
            GamificationService.getSettings(),
            AchievementService.listUserAchievements(user.id),
            GamificationEvent.findAll({
                where: { id_usuario: user.id },
                order: [['created_at', 'DESC']],
                limit: 10,
            }),
        ]);

        const levelInfo = calculateLevel(Number(profile.puntos_total), settings);
        const completedSteps = Array.isArray(profile.onboarding_completed_steps)
            ? profile.onboarding_completed_steps
            : [];

        const summary = {
            profile: {
                userId: String(profile.id_usuario),
                displayName: profile.display_name,
                role: profile.rol,
                totalPoints: Number(profile.puntos_total),
                level: Number(profile.nivel),
                streakDays: Number(profile.racha_dias),
                lastActivity: profile.ultima_actividad,
                levelProgress: levelInfo,
            },
            achievements,
            onboarding: settings.onboardingSteps.map((step) => ({
                ...step,
                completed: completedSteps.includes(step.id),
                points: settings.onboardingStepPoints,
            })),
            recentEvents: recentEvents.map((event) => ({
                id: String(event.id_evento),
                type: event.tipo,
                points: event.puntos,
                description: event.descripcion,
                metadata: event.metadata,
                createdAt: event.created_at || event.createdAt,
            })),
            newEventsCount,
        };

        if (newEventsCount === 0) {
            setCache(cacheStore.summary, cacheKey, summary, config.GAMIFICATION_SUMMARY_CACHE_TTL_SECONDS);
        }

        return summary;
    }

    static async getLeaderboard(limit) {
        const settings = await GamificationService.getSettings();
        const normalizedLimit = Math.min(50, Math.max(3, Number(limit || settings.leaderboardLimit)));
        const cacheKey = String(normalizedLimit);
        const cached = getCache(cacheStore.leaderboard, cacheKey);
        if (cached) return cached;

        const profiles = await GamificationProfile.findAll({
            order: [['puntos_total', 'DESC'], ['nivel', 'DESC'], ['updated_at', 'ASC']],
            limit: normalizedLimit,
        });

        const leaderboard = profiles.map((profile, index) => ({
            rank: index + 1,
            userId: String(profile.id_usuario),
            displayName: profile.display_name,
            role: profile.rol,
            totalPoints: Number(profile.puntos_total),
            level: Number(profile.nivel),
            lastActivity: profile.ultima_actividad,
        }));

        setCache(cacheStore.leaderboard, cacheKey, leaderboard, config.GAMIFICATION_LEADERBOARD_CACHE_TTL_SECONDS);
        return leaderboard;
    }
}

module.exports = GamificationService;
