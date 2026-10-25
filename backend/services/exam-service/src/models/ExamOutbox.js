const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');

const ExamOutbox = sequelize.define('exam_outbox', {
    event_id: { type: DataTypes.UUID, primaryKey: true },
    aggregate_id: { type: DataTypes.STRING(100), allowNull: false },
    event_type: { type: DataTypes.STRING(120), allowNull: false },
    payload: { type: DataTypes.JSONB, allowNull: false },
    created_at: { type: DataTypes.DATE, allowNull: false, defaultValue: DataTypes.NOW },
    published_at: { type: DataTypes.DATE, allowNull: true },
    attempts: { type: DataTypes.INTEGER, allowNull: false, defaultValue: 0 },
}, {
    tableName: 'exam_outbox',
    timestamps: false,
    indexes: [{ fields: ['created_at'], where: { published_at: null } }],
});

module.exports = ExamOutbox;
