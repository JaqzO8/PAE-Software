const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');

const Resource = sequelize.define('recursos', {
    id_recurso: {
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
    tipo_recurso: {
        type: DataTypes.STRING(50),
        allowNull: false,
        validate: {
            isIn: [['pdf', 'video', 'audio', 'imagen', 'enlace', 'otro']],
        },
    },
    url_archivo: {
        type: DataTypes.STRING(500),
        allowNull: true,
        comment: 'Ruta del archivo subido',
    },
    url_externa: {
        type: DataTypes.STRING(500),
        allowNull: true,
        comment: 'URL externa (YouTube, Google Drive, etc)',
    },
    tamaño_archivo: {
        type: DataTypes.BIGINT,
        allowNull: true,
        comment: 'Tamaño en bytes',
    },
    extension: {
        type: DataTypes.STRING(10),
        allowNull: true,
    },
    orden: {
        type: DataTypes.INTEGER,
        allowNull: false,
        defaultValue: 0,
        comment: 'Orden de visualización',
    },
    descargas: {
        type: DataTypes.INTEGER,
        allowNull: false,
        defaultValue: 0,
    },
    fecha_subida: {
        type: DataTypes.DATE,
        allowNull: false,
        defaultValue: DataTypes.NOW,
    },
    activo: {
        type: DataTypes.BOOLEAN,
        allowNull: false,
        defaultValue: true,
    },
}, {
    tableName: 'recursos',
    timestamps: false,
    indexes: [
        { fields: ['id_repositorio'] },
        { fields: ['tipo_recurso'] },
        { fields: ['activo'] },
        { fields: ['orden'] },
    ],
});

module.exports = Resource;