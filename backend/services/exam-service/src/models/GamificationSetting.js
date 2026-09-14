const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');

const GamificationSetting = sequelize.define('gamification_settings', {
    id_configuracion: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        defaultValue: 1,
    },
    puntos_simulacro_completado: {
        type: DataTypes.INTEGER,
        allowNull: false,
        defaultValue: 15,
    },
    puntos_precision_destacada: {
        type: DataTypes.INTEGER,
        allowNull: false,
        defaultValue: 20,
    },
    umbral_precision_destacada: {
        type: DataTypes.INTEGER,
        allowNull: false,
        defaultValue: 80,
    },
    ratio_puntos_en_vivo: {
        type: DataTypes.DECIMAL(4, 2),
        allowNull: false,
        defaultValue: 0.05,
    },
    puntos_onboarding: {
        type: DataTypes.INTEGER,
        allowNull: false,
        defaultValue: 10,
    },
    puntos_base_nivel: {
        type: DataTypes.INTEGER,
        allowNull: false,
        defaultValue: 100,
    },
    incremento_puntos_nivel: {
        type: DataTypes.INTEGER,
        allowNull: false,
        defaultValue: 50,
    },
    limite_ranking: {
        type: DataTypes.INTEGER,
        allowNull: false,
        defaultValue: 10,
    },
    onboarding_steps: {
        type: DataTypes.JSONB,
        allowNull: false,
        defaultValue: [],
    },
}, {
    tableName: 'gamification_settings',
    timestamps: true,
});

module.exports = GamificationSetting;
