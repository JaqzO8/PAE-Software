const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');

const Question = sequelize.define('preguntas', {
    id_pregunta: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true,
    },
    id_universidad: {
        type: DataTypes.INTEGER,
        allowNull: true,
        references: {
            model: 'universidades',
            key: 'id_universidad',
        },
    },
    materia: {
        type: DataTypes.STRING(100),
        allowNull: false,
    },
    tema: {
        type: DataTypes.STRING(150),
        allowNull: true,
    },
    dificultad: {
        type: DataTypes.ENUM('facil', 'medio', 'dificil'),
        allowNull: false,
        defaultValue: 'medio',
    },
    tipo: {
        type: DataTypes.ENUM('opcion_multiple', 'abierta'),
        allowNull: false,
        defaultValue: 'opcion_multiple',
    },
    enunciado: {
        type: DataTypes.TEXT,
        allowNull: false,
    },
    opciones: {
        type: DataTypes.JSONB,
        allowNull: false,
        defaultValue: [],
    },
    respuesta_correcta: {
        type: DataTypes.INTEGER,
        allowNull: true,
    },
    respuesta_texto: {
        type: DataTypes.TEXT,
        allowNull: true,
    },
    explicacion: {
        type: DataTypes.TEXT,
        allowNull: true,
    },
    etiquetas: {
        type: DataTypes.JSONB,
        allowNull: false,
        defaultValue: [],
    },
    id_creador: {
        type: DataTypes.INTEGER,
        allowNull: true,
    },
    activa: {
        type: DataTypes.BOOLEAN,
        allowNull: false,
        defaultValue: true,
    },
}, {
    tableName: 'preguntas',
    timestamps: true,
    indexes: [
        { fields: ['id_universidad'] },
        { fields: ['materia'] },
        { fields: ['dificultad'] },
        { fields: ['tipo'] },
        { fields: ['activa'] },
    ],
});

module.exports = Question;
