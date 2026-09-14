const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');

const Comunidad = sequelize.define('comunidades', {
    id_comunidad: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true,
    },
    nombre: {
        type: DataTypes.STRING(100),
        allowNull: false,
        validate: {
            len: [3, 100],
        },
    },
    descripcion: {
        type: DataTypes.TEXT,
        allowNull: true,
    },
    icono_url: {
        type: DataTypes.STRING(255),
        allowNull: true,
    },
    materia: {
        type: DataTypes.STRING(100),
        allowNull: true,
    },
    profesor_id: {
        type: DataTypes.INTEGER,
        allowNull: false,
        comment: 'ID del usuario con rol docente que creó la comunidad',
    },
    puntos_prestigio: {
        type: DataTypes.INTEGER,
        defaultValue: 0,
        allowNull: false,
    },
    proximo_hito: {
        type: DataTypes.INTEGER,
        defaultValue: 100,
        allowNull: false,
    },
    es_publica: {
        type: DataTypes.BOOLEAN,
        defaultValue: true,
        allowNull: false,
    },
    activa: {
        type: DataTypes.BOOLEAN,
        defaultValue: true,
        allowNull: false,
    },
    fecha_creacion: {
        type: DataTypes.DATE,
        defaultValue: DataTypes.NOW,
        allowNull: false,
    },
    fecha_eliminacion: {
        type: DataTypes.DATE,
        allowNull: true,
    },
}, {
    tableName: 'comunidades',
    timestamps: false,
    indexes: [
        { fields: ['profesor_id'] },
        { fields: ['activa'] },
        { fields: ['es_publica'] },
        { fields: ['nombre'] },
    ],
});

module.exports = Comunidad;