const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');

const Lesson = sequelize.define('lecciones', {
    id_leccion: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true,
    },
    id_repositorio: {
        type: DataTypes.INTEGER,
        allowNull: false,
        references: {
            model: 'repositorios',
            key: 'id_repositorio',
        },
    },
    titulo: {
        type: DataTypes.STRING(200),
        allowNull: false,
    },
    descripcion: {
        type: DataTypes.TEXT,
        allowNull: true,
    },
    contenido: {
        type: DataTypes.TEXT,
        allowNull: false,
    },
    resumen_teorico: {
        type: DataTypes.TEXT,
        allowNull: true,
    },
    preguntas_respuestas: {
        type: DataTypes.JSONB,
        allowNull: false,
        defaultValue: [],
    },
    mapa_conceptual: {
        type: DataTypes.JSONB,
        allowNull: false,
        defaultValue: [],
    },
    recursos_multimedia: {
        type: DataTypes.JSONB,
        allowNull: false,
        defaultValue: [],
    },
    dificultad: {
        type: DataTypes.STRING(30),
        allowNull: false,
        defaultValue: 'basico',
    },
    duracion_minutos: {
        type: DataTypes.INTEGER,
        allowNull: false,
        defaultValue: 15,
    },
    orden: {
        type: DataTypes.INTEGER,
        allowNull: false,
        defaultValue: 0,
    },
    publicado: {
        type: DataTypes.BOOLEAN,
        allowNull: false,
        defaultValue: true,
    },
    activo: {
        type: DataTypes.BOOLEAN,
        allowNull: false,
        defaultValue: true,
    },
}, {
    tableName: 'lecciones',
    timestamps: true,
    createdAt: 'fecha_creacion',
    updatedAt: 'fecha_actualizacion',
    indexes: [
        { fields: ['id_repositorio'] },
        { fields: ['orden'] },
        { fields: ['publicado'] },
        { fields: ['activo'] },
    ],
});

module.exports = Lesson;
