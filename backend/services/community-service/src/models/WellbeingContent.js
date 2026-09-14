const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');

const WellbeingContent = sequelize.define('wellbeing_content', {
    id_contenido: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true,
    },
    tipo: {
        type: DataTypes.STRING(30),
        allowNull: false,
        validate: {
            isIn: [['descanso', 'orientacion', 'bienestar']],
        },
    },
    titulo: {
        type: DataTypes.STRING(160),
        allowNull: false,
    },
    descripcion: {
        type: DataTypes.TEXT,
        allowNull: false,
    },
    accion_label: {
        type: DataTypes.STRING(80),
        allowNull: true,
    },
    url: {
        type: DataTypes.STRING(500),
        allowNull: true,
    },
    duracion_minutos: {
        type: DataTypes.INTEGER,
        allowNull: true,
    },
    etiquetas: {
        type: DataTypes.JSONB,
        allowNull: false,
        defaultValue: [],
    },
    orden: {
        type: DataTypes.INTEGER,
        allowNull: false,
        defaultValue: 0,
    },
    activo: {
        type: DataTypes.BOOLEAN,
        allowNull: false,
        defaultValue: true,
    },
    fecha_publicacion: {
        type: DataTypes.DATE,
        allowNull: false,
        defaultValue: DataTypes.NOW,
    },
}, {
    tableName: 'wellbeing_content',
    timestamps: false,
    indexes: [
        { fields: ['tipo'] },
        { fields: ['activo'] },
        { fields: ['orden'] },
    ],
});

module.exports = WellbeingContent;
