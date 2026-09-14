const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');

const Repository = sequelize.define('repositorios', {
    id_repositorio: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true,
    },
    id_profesor: {
        type: DataTypes.INTEGER,
        allowNull: false,
        comment: 'ID del usuario profesor que creó el repositorio',
    },
    titulo: {
        type: DataTypes.STRING(200),
        allowNull: false,
    },
    descripcion: {
        type: DataTypes.TEXT,
        allowNull: true,
    },
    portada: {
        type: DataTypes.STRING(255),
        allowNull: true,
        comment: 'URL de la imagen de portada',
    },
    id_categoria: {
        type: DataTypes.INTEGER,
        allowNull: true,
        references: {
            model: 'categorias',
            key: 'id_categoria',
        },
    },
    publico: {
        type: DataTypes.BOOLEAN,
        allowNull: false,
        defaultValue: true,
    },
    destacado: {
        type: DataTypes.BOOLEAN,
        allowNull: false,
        defaultValue: false,
        comment: 'Repositorios destacados por administradores',
    },
    fecha_creacion: {
        type: DataTypes.DATE,
        allowNull: false,
        defaultValue: DataTypes.NOW,
    },
    fecha_actualizacion: {
        type: DataTypes.DATE,
        allowNull: true,
    },
    cantidad_vistas: {
        type: DataTypes.INTEGER,
        allowNull: false,
        defaultValue: 0,
    },
    cantidad_descargas: {
        type: DataTypes.INTEGER,
        allowNull: false,
        defaultValue: 0,
    },
    rating_promedio: {
        type: DataTypes.DECIMAL(3, 2),
        allowNull: false,
        defaultValue: 0.00,
        validate: {
            min: 0,
            max: 10,
        },
        comment: 'Calificación promedio de 1 a 10',
    },
    activo: {
        type: DataTypes.BOOLEAN,
        allowNull: false,
        defaultValue: true,
    },
}, {
    tableName: 'repositorios',
    timestamps: true,
    createdAt: 'fecha_creacion',
    updatedAt: 'fecha_actualizacion',
    indexes: [
        { fields: ['id_profesor'] },
        { fields: ['id_categoria'] },
        { fields: ['publico'] },
        { fields: ['destacado'] },
        { fields: ['cantidad_vistas'] },
        { fields: ['cantidad_descargas'] },
        { fields: ['rating_promedio'] },
        { fields: ['activo'] },
    ],
});

module.exports = Repository;