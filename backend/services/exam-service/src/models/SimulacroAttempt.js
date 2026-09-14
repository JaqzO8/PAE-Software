const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');

const SimulacroAttempt = sequelize.define('simulacro_intentos', {
    id_intento: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true,
    },
    id_usuario: {
        type: DataTypes.INTEGER,
        allowNull: false,
    },
    id_universidad: {
        type: DataTypes.INTEGER,
        allowNull: true,
    },
    dificultad: {
        type: DataTypes.STRING(30),
        allowNull: false,
    },
    preguntas: {
        type: DataTypes.JSONB,
        allowNull: false,
        defaultValue: [],
    },
    respuestas: {
        type: DataTypes.JSONB,
        allowNull: false,
        defaultValue: [],
    },
    estado: {
        type: DataTypes.ENUM('en_progreso', 'finalizado', 'abandonado'),
        allowNull: false,
        defaultValue: 'en_progreso',
    },
    limite_segundos: {
        type: DataTypes.INTEGER,
        allowNull: false,
    },
    tiempo_usado: {
        type: DataTypes.INTEGER,
        allowNull: false,
        defaultValue: 0,
    },
    puntaje: {
        type: DataTypes.INTEGER,
        allowNull: true,
    },
    correctas: {
        type: DataTypes.INTEGER,
        allowNull: true,
    },
    total_preguntas: {
        type: DataTypes.INTEGER,
        allowNull: false,
        defaultValue: 0,
    },
    fecha_inicio: {
        type: DataTypes.DATE,
        allowNull: false,
        defaultValue: DataTypes.NOW,
    },
    fecha_fin: {
        type: DataTypes.DATE,
        allowNull: true,
    },
}, {
    tableName: 'simulacro_intentos',
    timestamps: true,
    indexes: [
        { fields: ['id_usuario'] },
        { fields: ['estado'] },
        { fields: ['id_universidad'] },
    ],
});

module.exports = SimulacroAttempt;
