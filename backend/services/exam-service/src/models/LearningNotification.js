const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');

const LearningNotification = sequelize.define('learning_notifications', {
    id_notificacion: {
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
        defaultValue: 'logro',
    },
    titulo: {
        type: DataTypes.STRING(180),
        allowNull: false,
    },
    mensaje: {
        type: DataTypes.TEXT,
        allowNull: false,
    },
    metadata: {
        type: DataTypes.JSONB,
        allowNull: false,
        defaultValue: {},
    },
    leida: {
        type: DataTypes.BOOLEAN,
        allowNull: false,
        defaultValue: false,
    },
    canal_email_pendiente: {
        type: DataTypes.BOOLEAN,
        allowNull: false,
        defaultValue: false,
    },
}, {
    tableName: 'learning_notifications',
    timestamps: true,
    indexes: [
        { fields: ['id_usuario'] },
        { fields: ['leida'] },
        { fields: ['tipo'] },
    ],
});

module.exports = LearningNotification;
