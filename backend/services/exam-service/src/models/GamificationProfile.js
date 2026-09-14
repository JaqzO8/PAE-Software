const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');

const GamificationProfile = sequelize.define('gamification_profiles', {
    id_perfil: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true,
    },
    id_usuario: {
        type: DataTypes.INTEGER,
        allowNull: false,
        unique: true,
    },
    display_name: {
        type: DataTypes.STRING(180),
        allowNull: false,
        defaultValue: 'Usuario PAE',
    },
    rol: {
        type: DataTypes.STRING(30),
        allowNull: false,
        defaultValue: 'estudiante',
    },
    puntos_total: {
        type: DataTypes.INTEGER,
        allowNull: false,
        defaultValue: 0,
    },
    nivel: {
        type: DataTypes.INTEGER,
        allowNull: false,
        defaultValue: 1,
    },
    racha_dias: {
        type: DataTypes.INTEGER,
        allowNull: false,
        defaultValue: 0,
    },
    ultima_actividad: {
        type: DataTypes.DATE,
        allowNull: true,
    },
    onboarding_completed_steps: {
        type: DataTypes.JSONB,
        allowNull: false,
        defaultValue: [],
    },
}, {
    tableName: 'gamification_profiles',
    timestamps: true,
    indexes: [
        { fields: ['id_usuario'], unique: true },
        { fields: ['puntos_total'] },
        { fields: ['nivel'] },
    ],
});

module.exports = GamificationProfile;
