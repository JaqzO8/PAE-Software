const { Op } = require('sequelize');
const axios = require('axios');
const config = require('../config/env');
const {
    Comunidad,
    MiembroComunidad,
    MensajeCanal,
    RecursoComunidad,
    DesafioSemanal,
} = require('../models');
const { getCommunitySettings } = require('./communityConfigService');

const clamp = (value, min = 0, max = 100) => Math.min(max, Math.max(min, Math.round(value)));

const sameId = (left, right) => String(left) === String(right);

const fetchUserInfo = async (userId, token) => {
    try {
        const response = await axios.get(`${config.AUTH_SERVICE_URL}/api/auth/user/${userId}`, {
            headers: { Authorization: `Bearer ${token}` },
        });
        return response.data.user;
    } catch (error) {
        return null;
    }
};

const formatUserName = (user) => {
    if (!user) return 'Usuario desconocido';
    return `${user.nombres || ''} ${user.apellidos || ''}`.trim() || user.email || 'Usuario desconocido';
};

const canAccessCommunityPerformance = async (community, user) => {
    if (!community) return false;
    if (user.rol === 'admin' || sameId(community.profesor_id, user.id)) return true;

    const member = await MiembroComunidad.findOne({
        where: {
            comunidad_id: community.id_comunidad,
            usuario_id: user.id,
            activo: true,
        },
    });

    return Boolean(member);
};

const buildCommunityPerformance = async ({ communityId, user, token }) => {
    const community = await Comunidad.findOne({
        where: { id_comunidad: communityId, activa: true },
    });

    if (!community) {
        const error = new Error('Comunidad no encontrada');
        error.status = 404;
        throw error;
    }

    const canAccess = await canAccessCommunityPerformance(community, user);
    if (!canAccess) {
        const error = new Error('No tienes acceso al rendimiento de esta comunidad');
        error.status = 403;
        throw error;
    }

    const settings = await getCommunitySettings();
    const since = new Date();
    since.setDate(since.getDate() - Number(settings.performanceWindowDays));

    const [
        members,
        totalMessages,
        recentMessages,
        resourcesCount,
        challengesCount,
    ] = await Promise.all([
        MiembroComunidad.findAll({
            where: { comunidad_id: communityId, activo: true },
            order: [['puntos_individuales', 'DESC'], ['fecha_union', 'ASC']],
        }),
        MensajeCanal.count({ where: { comunidad_id: communityId } }),
        MensajeCanal.findAll({
            where: {
                comunidad_id: communityId,
                fecha_envio: { [Op.gte]: since },
            },
            order: [['fecha_envio', 'DESC']],
        }),
        RecursoComunidad.count({ where: { comunidad_id: communityId } }),
        DesafioSemanal.count({
            where: {
                comunidad_id: communityId,
                fecha_inicio: { [Op.gte]: since },
            },
        }),
    ]);

    const activeUserIds = new Set(recentMessages.map((message) => String(message.usuario_id)));
    const messageCountByUser = recentMessages.reduce((acc, message) => {
        const key = String(message.usuario_id);
        acc[key] = (acc[key] || 0) + 1;
        return acc;
    }, {});

    const participantCount = members.length || 1;
    const participationRate = clamp((activeUserIds.size / participantCount) * 100);
    const messageTarget = Math.max(1, participantCount * Number(settings.messageTargetPerMember));
    const messagesRate = clamp((recentMessages.length / messageTarget) * 100);
    const resourcesRate = clamp((resourcesCount / Number(settings.resourceTargetPerCommunity)) * 100);
    const challengesRate = clamp((challengesCount / Number(settings.challengeTargetPerMonth)) * 100);
    const weights = settings.performanceWeights;
    const score = clamp(
        (participationRate * weights.participation +
            messagesRate * weights.messages +
            resourcesRate * weights.resources +
            challengesRate * weights.challenges) /
        (weights.participation + weights.messages + weights.resources + weights.challenges)
    );

    const topMemberIds = Object.entries(messageCountByUser)
        .sort((a, b) => b[1] - a[1])
        .slice(0, 5);

    const topContributors = await Promise.all(topMemberIds.map(async ([userId, messages]) => {
        const userInfo = await fetchUserInfo(userId, token);
        return {
            id: userId,
            name: formatUserName(userInfo),
            messages,
            avatar: userInfo?.avatar || null,
        };
    }));

    const recommendedActions = [];
    if (participationRate < Number(settings.lowParticipationThreshold)) {
        recommendedActions.push('Abrir una pregunta semanal para activar a miembros silenciosos.');
    }
    if (resourcesRate < 60) {
        recommendedActions.push('Compartir al menos un recurso guia antes del siguiente desafio.');
    }
    if (challengesRate < 60) {
        recommendedActions.push('Programar un desafio corto para sostener la colaboracion.');
    }
    if (recommendedActions.length === 0) {
        recommendedActions.push('Mantener el ritmo actual y reconocer a los miembros mas activos.');
    }

    const status = score >= 80 ? 'alto' : score >= 55 ? 'estable' : 'en_riesgo';

    return {
        windowDays: Number(settings.performanceWindowDays),
        score,
        status,
        totals: {
            members: members.length,
            activeMembers: activeUserIds.size,
            messages: totalMessages,
            recentMessages: recentMessages.length,
            resources: resourcesCount,
            challenges: challengesCount,
        },
        rates: {
            participation: participationRate,
            messages: messagesRate,
            resources: resourcesRate,
            challenges: challengesRate,
        },
        thresholds: {
            activeParticipationTargetPercent: Number(settings.activeParticipationTargetPercent),
            lowParticipationThreshold: Number(settings.lowParticipationThreshold),
        },
        topContributors,
        recommendedActions,
    };
};

module.exports = {
    buildCommunityPerformance,
};
