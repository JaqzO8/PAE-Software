const {
    AchievementDefinition,
    LearningNotification,
    SimulacroAttempt,
    UserAchievement,
} = require('../models');

const toFrontendAchievement = (userAchievement) => ({
    id: String(userAchievement.id_usuario_logro),
    code: userAchievement.logro.codigo,
    title: userAchievement.logro.titulo,
    description: userAchievement.logro.descripcion,
    icon: userAchievement.logro.icono,
    points: userAchievement.logro.puntos,
    earnedAt: userAchievement.fecha_obtenido,
    metadata: userAchievement.metadata,
});

const attemptAccuracy = (attempt) => {
    const total = Number(attempt.total_preguntas || 0);
    if (!total) return 0;
    return Math.round((Number(attempt.correctas || 0) / total) * 100);
};

class AchievementService {
    static async evaluateUser(userId, latestAttempt) {
        const definitions = await AchievementDefinition.findAll({
            where: { activo: true },
            order: [['id_logro', 'ASC']],
        });
        const attemptsCount = await SimulacroAttempt.count({
            where: { id_usuario: userId, estado: 'finalizado' },
        });
        const latestAccuracy = latestAttempt ? attemptAccuracy(latestAttempt) : 0;
        const newAchievements = [];

        for (const definition of definitions) {
            const alreadyEarned = await UserAchievement.findOne({
                where: { id_usuario: userId, id_logro: definition.id_logro },
            });
            if (alreadyEarned) continue;

            const threshold = Number(definition.umbral || 0);
            const reached = definition.condicion === 'attempts_count'
                ? attemptsCount >= threshold
                : definition.condicion === 'single_attempt_accuracy'
                    ? latestAccuracy >= threshold
                    : false;

            if (!reached) continue;

            const achievement = await UserAchievement.create({
                id_usuario: userId,
                id_logro: definition.id_logro,
                origen: 'simulacro',
                metadata: {
                    attemptsCount,
                    latestAccuracy,
                    attemptId: latestAttempt?.id_intento || null,
                },
            });
            achievement.logro = definition;

            await LearningNotification.create({
                id_usuario: userId,
                tipo: 'logro',
                titulo: `Logro desbloqueado: ${definition.titulo}`,
                mensaje: definition.descripcion,
                metadata: {
                    achievementCode: definition.codigo,
                    points: definition.puntos,
                },
                canal_email_pendiente: true,
            });

            newAchievements.push(toFrontendAchievement(achievement));
        }

        return newAchievements;
    }

    static async listUserAchievements(userId) {
        const achievements = await UserAchievement.findAll({
            where: { id_usuario: userId },
            include: [{ model: AchievementDefinition, as: 'logro' }],
            order: [['fecha_obtenido', 'DESC']],
        });

        return achievements.map(toFrontendAchievement);
    }

    static async listNotifications(userId) {
        const notifications = await LearningNotification.findAll({
            where: { id_usuario: userId },
            order: [['created_at', 'DESC']],
            limit: 50,
        });

        return notifications.map((notification) => ({
            id: String(notification.id_notificacion),
            type: notification.tipo,
            title: notification.titulo,
            message: notification.mensaje,
            read: notification.leida,
            emailPending: notification.canal_email_pendiente,
            metadata: notification.metadata,
            createdAt: notification.created_at || notification.createdAt,
        }));
    }

    static async markNotificationRead(userId, notificationId) {
        const notification = await LearningNotification.findOne({
            where: { id_notificacion: notificationId, id_usuario: userId },
        });

        if (!notification) return null;
        await notification.update({ leida: true });
        return notification;
    }
}

module.exports = AchievementService;
