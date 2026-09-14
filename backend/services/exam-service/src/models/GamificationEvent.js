const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');

const GamificationEvent = sequelize.define('gamification_events', {
    id_evento: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true,
    },
    id_usuario: {
        type: DataTypes.INTEGER,
        allowNull: false,
    },
    tipo: {
        type: DataTypes.STRING(60),
        allowNull: false,
    },
    puntos: {
        type: DataTypes.INTEGER,
        allowNull: false,
    },
    descripcion: {
        type: DataTypes.STRING(220),
        allowNull: false,
    },
    metadata: {
        type: DataTypes.JSONB,
        allowNull: false,
        defaultValue: {},
    },
    clave_idempotencia: {
        type: DataTypes.STRING(160),
        allowNull: true,
        unique: true,
    },
}, {
    tableName: 'gamification_events',
    timestamps: true,
    indexes: [
        { fields: ['id_usuario'] },
        { fields: ['tipo'] },
        { fields: ['created_at'] },
        { fields: ['clave_idempotencia'], unique: true },
    ],
});

module.exports = GamificationEvent;
