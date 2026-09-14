const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');

const StudyReminder = sequelize.define('study_reminders', {
    id_recordatorio: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true,
    },
    id_usuario: {
        type: DataTypes.INTEGER,
        allowNull: false,
    },
    titulo: {
        type: DataTypes.STRING(180),
        allowNull: false,
    },
    materia: {
        type: DataTypes.STRING(120),
        allowNull: true,
    },
    programado_para: {
        type: DataTypes.DATE,
        allowNull: false,
    },
    duracion_minutos: {
        type: DataTypes.INTEGER,
        allowNull: false,
        defaultValue: 50,
    },
    estado: {
        type: DataTypes.ENUM('pendiente', 'completado', 'omitido'),
        allowNull: false,
        defaultValue: 'pendiente',
    },
    origen: {
        type: DataTypes.STRING(40),
        allowNull: false,
        defaultValue: 'sugerido',
    },
}, {
    tableName: 'study_reminders',
    timestamps: true,
    indexes: [
        { fields: ['id_usuario'] },
        { fields: ['programado_para'] },
        { fields: ['estado'] },
    ],
});

module.exports = StudyReminder;
