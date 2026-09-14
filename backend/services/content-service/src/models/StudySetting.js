const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');

const StudySetting = sequelize.define('study_settings', {
    id_configuracion: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        defaultValue: 1,
    },
    recordatorio_descanso_minutos: {
        type: DataTypes.INTEGER,
        allowNull: false,
        defaultValue: 30,
    },
    multiplicador_tiempo_largo: {
        type: DataTypes.DECIMAL(4, 2),
        allowNull: false,
        defaultValue: 1.5,
    },
    multiplicador_tiempo_rapido: {
        type: DataTypes.DECIMAL(4, 2),
        allowNull: false,
        defaultValue: 0.5,
    },
    segundos_minimos_seguimiento: {
        type: DataTypes.INTEGER,
        allowNull: false,
        defaultValue: 30,
    },
}, {
    tableName: 'study_settings',
    timestamps: true,
});

module.exports = StudySetting;
