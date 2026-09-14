const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');

const PlanningSetting = sequelize.define('planning_settings', {
    id_configuracion: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        defaultValue: 1,
    },
    duracion_sesion_minutos: {
        type: DataTypes.INTEGER,
        allowNull: false,
        defaultValue: 50,
    },
    aviso_anticipado_minutos: {
        type: DataTypes.INTEGER,
        allowNull: false,
        defaultValue: 15,
    },
    pomodoro_enfoque_minutos: {
        type: DataTypes.INTEGER,
        allowNull: false,
        defaultValue: 25,
    },
    pomodoro_descanso_minutos: {
        type: DataTypes.INTEGER,
        allowNull: false,
        defaultValue: 5,
    },
    max_sesiones_dia: {
        type: DataTypes.INTEGER,
        allowNull: false,
        defaultValue: 3,
    },
}, {
    tableName: 'planning_settings',
    timestamps: true,
});

module.exports = PlanningSetting;
