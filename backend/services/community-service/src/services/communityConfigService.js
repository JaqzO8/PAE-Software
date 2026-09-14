const { CommunitySetting } = require('../models');

const DEFAULT_SETTINGS = {
    restSessionMinutes: 8,
    wellbeingItemsLimit: 12,
    universityNewsLimit: 8,
    performanceWindowDays: 30,
    activeParticipationTargetPercent: 70,
    lowParticipationThreshold: 40,
    messageTargetPerMember: 3,
    resourceTargetPerCommunity: 5,
    challengeTargetPerMonth: 2,
    performanceWeights: {
        participation: 45,
        messages: 25,
        resources: 15,
        challenges: 15,
    },
};

const DEFAULT_SETTING_ROWS = [
    {
        clave: 'community_experience',
        valor: DEFAULT_SETTINGS,
        descripcion: 'Reglas parametrizadas para bienestar, noticias y rendimiento comunitario.',
    },
];

const mergeSettings = (stored = {}) => ({
    ...DEFAULT_SETTINGS,
    ...stored,
    performanceWeights: {
        ...DEFAULT_SETTINGS.performanceWeights,
        ...(stored.performanceWeights || {}),
    },
});

const getCommunitySettings = async () => {
    const setting = await CommunitySetting.findOne({ where: { clave: 'community_experience' } });
    return mergeSettings(setting?.valor || {});
};

const updateCommunitySettings = async (payload, userId) => {
    const current = await getCommunitySettings();
    const nextSettings = mergeSettings({
        ...current,
        ...payload,
        performanceWeights: {
            ...current.performanceWeights,
            ...(payload.performanceWeights || {}),
        },
    });

    const [setting, created] = await CommunitySetting.findOrCreate({
        where: { clave: 'community_experience' },
        defaults: {
            valor: nextSettings,
            descripcion: 'Reglas parametrizadas para bienestar, noticias y rendimiento comunitario.',
            actualizado_por: userId,
            fecha_actualizacion: new Date(),
        },
    });

    if (!created) {
        await setting.update({
            valor: nextSettings,
            actualizado_por: userId,
            fecha_actualizacion: new Date(),
        });
    }

    return nextSettings;
};

module.exports = {
    DEFAULT_SETTINGS,
    DEFAULT_SETTING_ROWS,
    getCommunitySettings,
    updateCommunitySettings,
};
