const { Op } = require('sequelize');
const {
    Comunidad,
    MiembroComunidad,
    WellbeingContent,
    UniversityNews,
} = require('../models');
const {
    getCommunitySettings,
    updateCommunitySettings,
} = require('../services/communityConfigService');
const { buildCommunityPerformance } = require('../services/communityPerformanceService');

const groupContent = (contents) => contents.reduce((acc, item) => {
    const type = item.tipo;
    acc[type] = acc[type] || [];
    acc[type].push({
        id: item.id_contenido,
        type,
        title: item.titulo,
        description: item.descripcion,
        actionLabel: item.accion_label,
        url: item.url,
        durationMinutes: item.duracion_minutos,
        tags: item.etiquetas || [],
        publishedAt: item.fecha_publicacion,
    });
    return acc;
}, { descanso: [], orientacion: [], bienestar: [] });

const mapNews = (news) => news.map((item) => ({
    id: item.id_noticia,
    title: item.titulo,
    summary: item.resumen,
    university: item.universidad,
    category: item.categoria,
    url: item.url,
    publishedAt: item.fecha_publicacion,
}));

class CommunityHubController {
    static async getHub(req, res, next) {
        try {
            const settings = await getCommunitySettings();
            const [contents, news, memberships, ownedCommunities] = await Promise.all([
                WellbeingContent.findAll({
                    where: { activo: true },
                    order: [['tipo', 'ASC'], ['orden', 'ASC'], ['fecha_publicacion', 'DESC']],
                    limit: Number(settings.wellbeingItemsLimit),
                }),
                UniversityNews.findAll({
                    where: { activo: true },
                    order: [['fecha_publicacion', 'DESC']],
                    limit: Number(settings.universityNewsLimit),
                }),
                MiembroComunidad.findAll({
                    where: { usuario_id: req.user.id, activo: true },
                    include: [{ model: Comunidad, as: 'comunidad', where: { activa: true } }],
                    limit: 8,
                }),
                req.user.rol === 'docente'
                    ? Comunidad.findAll({
                        where: { profesor_id: req.user.id, activa: true },
                        order: [['fecha_creacion', 'DESC']],
                        limit: 8,
                    })
                    : Promise.resolve([]),
            ]);

            const userCommunities = req.user.rol === 'docente'
                ? ownedCommunities
                : memberships.map((membership) => membership.comunidad);

            res.status(200).json({
                success: true,
                settings,
                contents: groupContent(contents),
                news: mapNews(news),
                summary: {
                    communitiesCount: userCommunities.length,
                    restSessionMinutes: Number(settings.restSessionMinutes),
                    participationTarget: Number(settings.activeParticipationTargetPercent),
                },
            });
        } catch (error) {
            next(error);
        }
    }

    static async getNews(req, res, next) {
        try {
            const settings = await getCommunitySettings();
            const { university, category, search } = req.query;
            const where = { activo: true };

            if (university) where.universidad = { [Op.iLike]: `%${university}%` };
            if (category) where.categoria = { [Op.iLike]: `%${category}%` };
            if (search) {
                where[Op.or] = [
                    { titulo: { [Op.iLike]: `%${search}%` } },
                    { resumen: { [Op.iLike]: `%${search}%` } },
                ];
            }

            const news = await UniversityNews.findAll({
                where,
                order: [['fecha_publicacion', 'DESC']],
                limit: Number(settings.universityNewsLimit),
            });

            res.status(200).json({ success: true, news: mapNews(news) });
        } catch (error) {
            next(error);
        }
    }

    static async getSettings(req, res, next) {
        try {
            const settings = await getCommunitySettings();
            res.status(200).json({ success: true, settings });
        } catch (error) {
            next(error);
        }
    }

    static async updateSettings(req, res, next) {
        try {
            const allowed = [
                'restSessionMinutes',
                'wellbeingItemsLimit',
                'universityNewsLimit',
                'performanceWindowDays',
                'activeParticipationTargetPercent',
                'lowParticipationThreshold',
                'messageTargetPerMember',
                'resourceTargetPerCommunity',
                'challengeTargetPerMonth',
                'performanceWeights',
            ];
            const payload = Object.fromEntries(
                Object.entries(req.body || {}).filter(([key]) => allowed.includes(key))
            );
            const settings = await updateCommunitySettings(payload, req.user.id);
            res.status(200).json({ success: true, settings });
        } catch (error) {
            next(error);
        }
    }

    static async getPerformance(req, res, next) {
        try {
            const performance = await buildCommunityPerformance({
                communityId: req.params.id,
                user: req.user,
                token: req.token,
            });
            res.status(200).json({ success: true, performance });
        } catch (error) {
            if (error.status) {
                return res.status(error.status).json({
                    success: false,
                    message: error.message,
                });
            }
            next(error);
        }
    }
}

module.exports = CommunityHubController;
