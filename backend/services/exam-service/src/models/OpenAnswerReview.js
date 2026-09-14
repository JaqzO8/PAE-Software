const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');

const OpenAnswerReview = sequelize.define('revision_respuestas_abiertas', {
    id_revision: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true,
    },
    id_intento: {
        type: DataTypes.INTEGER,
        allowNull: false,
        references: {
            model: 'simulacro_intentos',
            key: 'id_intento',
        },
    },
    id_pregunta: {
        type: DataTypes.INTEGER,
        allowNull: false,
        references: {
            model: 'preguntas',
            key: 'id_pregunta',
        },
    },
    id_estudiante: {
        type: DataTypes.INTEGER,
        allowNull: false,
    },
    id_docente: {
        type: DataTypes.INTEGER,
        allowNull: true,
    },
    respuesta_texto: {
        type: DataTypes.TEXT,
        allowNull: false,
        defaultValue: '',
    },
    puntaje: {
        type: DataTypes.INTEGER,
        allowNull: true,
    },
    feedback: {
        type: DataTypes.TEXT,
        allowNull: true,
    },
    estado: {
        type: DataTypes.ENUM('pendiente', 'revisado'),
        allowNull: false,
        defaultValue: 'pendiente',
    },
    fecha_revision: {
        type: DataTypes.DATE,
        allowNull: true,
    },
}, {
    tableName: 'revision_respuestas_abiertas',
    timestamps: true,
    indexes: [
        { fields: ['id_intento'] },
        { fields: ['id_pregunta'] },
        { fields: ['id_estudiante'] },
        { fields: ['estado'] },
        { unique: true, fields: ['id_intento', 'id_pregunta'] },
    ],
});

module.exports = OpenAnswerReview;
