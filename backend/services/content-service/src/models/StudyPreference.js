const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');

const StudyPreference = sequelize.define('study_preferences', {
    id_preferencia: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true,
    },
    id_usuario: {
        type: DataTypes.INTEGER,
        allowNull: false,
        unique: true,
    },
    dias_preferidos: {
        type: DataTypes.JSONB,
        allowNull: false,
        defaultValue: [1, 2, 3, 4, 5],
    },
    hora_inicio: {
        type: DataTypes.STRING(5),
        allowNull: false,
        defaultValue: '18:00',
    },
    hora_fin: {
        type: DataTypes.STRING(5),
        allowNull: false,
        defaultValue: '21:00',
    },
    materias: {
        type: DataTypes.JSONB,
        allowNull: false,
        defaultValue: ['Matematicas', 'Comunicacion'],
    },
    recordatorios_activos: {
        type: DataTypes.BOOLEAN,
        allowNull: false,
        defaultValue: true,
    },
}, {
    tableName: 'study_preferences',
    timestamps: true,
    indexes: [
        { fields: ['id_usuario'] },
    ],
});

module.exports = StudyPreference;
