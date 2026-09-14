const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');

const AnalyticsSetting = sequelize.define('analytics_settings', {
    id_configuracion: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        defaultValue: 1,
    },
    umbral_bajo_rendimiento: {
        type: DataTypes.INTEGER,
        allowNull: false,
        defaultValue: 60,
    },
    umbral_critico_rendimiento: {
        type: DataTypes.INTEGER,
        allowNull: false,
        defaultValue: 45,
    },
    intentos_minimos_alerta: {
        type: DataTypes.INTEGER,
        allowNull: false,
        defaultValue: 2,
    },
    preguntas_minimas_materia_debil: {
        type: DataTypes.INTEGER,
        allowNull: false,
        defaultValue: 2,
    },
    precision_objetivo: {
        type: DataTypes.INTEGER,
        allowNull: false,
        defaultValue: 70,
    },
    limite_historial_estudiante: {
        type: DataTypes.INTEGER,
        allowNull: false,
        defaultValue: 100,
    },
    limite_historial_cohorte: {
        type: DataTypes.INTEGER,
        allowNull: false,
        defaultValue: 500,
    },
}, {
    tableName: 'analytics_settings',
    timestamps: true,
});

module.exports = AnalyticsSetting;
