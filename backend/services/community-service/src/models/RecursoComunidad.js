const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');

const RecursoComunidad = sequelize.define('recursos_comunidad', {
    id_recurso: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true,
    },
    comunidad_id: {
        type: DataTypes.INTEGER,
        allowNull: false,
        references: {
            model: 'comunidades',
            key: 'id_comunidad',
        },
    },
    profesor_id: {
        type: DataTypes.INTEGER,
        allowNull: false,
        comment: 'Solo profesores pueden subir recursos',
    },
    nombre_archivo: {
        type: DataTypes.STRING(255),
        allowNull: false,
    },
    url_archivo: {
        type: DataTypes.STRING(500),
        allowNull: false,
    },
    tipo_archivo: {
        type: DataTypes.STRING(50),
        defaultValue: 'application/pdf',
    },
    tamano_bytes: {
        type: DataTypes.INTEGER,
        allowNull: false,
    },
    descripcion: {
        type: DataTypes.TEXT,
        allowNull: true,
    },
    fecha_subida: {
        type: DataTypes.DATE,
        defaultValue: DataTypes.NOW,
        allowNull: false,
    },
}, {
    tableName: 'recursos_comunidad',
    timestamps: false,
    indexes: [
        { fields: ['comunidad_id'] },
        { fields: ['profesor_id'] },
        { fields: ['fecha_subida'] },
    ],
});

module.exports = RecursoComunidad;