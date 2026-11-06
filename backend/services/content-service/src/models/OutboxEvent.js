const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');

const OutboxEvent = sequelize.define('OutboxEvent', {
    event_id: {
        type: DataTypes.UUID,
        primaryKey: true,
    },
    event_type: {
        type: DataTypes.STRING(120),
        allowNull: false,
    },
    schema_version: {
        type: DataTypes.INTEGER,
        allowNull: false,
    },
    producer: {
        type: DataTypes.STRING(80),
        allowNull: false,
    },
    payload: {
        type: DataTypes.JSONB,
        allowNull: false,
    },
    status: {
        type: DataTypes.ENUM('pending', 'processing', 'published', 'failed'),
        allowNull: false,
        defaultValue: 'pending',
    },
    attempts: {
        type: DataTypes.INTEGER,
        allowNull: false,
        defaultValue: 0,
    },
    occurred_at: {
        type: DataTypes.DATE,
        allowNull: false,
    },
    published_at: {
        type: DataTypes.DATE,
        allowNull: true,
    },
    last_error: {
        type: DataTypes.STRING(500),
        allowNull: true,
    },
}, {
    tableName: 'content_outbox_events',
    timestamps: true,
    indexes: [
        { fields: ['status', 'created_at'] },
        { fields: ['status', 'updated_at'] },
        { unique: true, fields: ['event_id'] },
    ],
});

module.exports = OutboxEvent;
