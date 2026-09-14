const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');

const LessonProgress = sequelize.define('progreso_lecciones', {
    id_progreso: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true,
    },
    id_leccion: {
        type: DataTypes.INTEGER,
        allowNull: false,
        references: {
            model: 'lecciones',
            key: 'id_leccion',
        },
    },
    id_usuario: {
        type: DataTypes.INTEGER,
        allowNull: false,
    },
    completada: {
        type: DataTypes.BOOLEAN,
        allowNull: false,
        defaultValue: false,
    },
    puntuacion: {
        type: DataTypes.DECIMAL(5, 2),
        allowNull: true,
    },
    tiempo_segundos: {
        type: DataTypes.INTEGER,
        allowNull: false,
        defaultValue: 0,
    },
    resumen_generado: {
        type: DataTypes.BOOLEAN,
        allowNull: false,
        defaultValue: false,
    },
    mapa_generado: {
        type: DataTypes.BOOLEAN,
        allowNull: false,
        defaultValue: false,
    },
    fecha_inicio: {
        type: DataTypes.DATE,
        allowNull: false,
        defaultValue: DataTypes.NOW,
    },
    fecha_completado: {
        type: DataTypes.DATE,
        allowNull: true,
    },
}, {
    tableName: 'progreso_lecciones',
    timestamps: true,
    createdAt: 'fecha_creacion',
    updatedAt: 'fecha_actualizacion',
    indexes: [
        { fields: ['id_leccion'] },
        { fields: ['id_usuario'] },
        { unique: true, fields: ['id_leccion', 'id_usuario'] },
    ],
});

module.exports = LessonProgress;
