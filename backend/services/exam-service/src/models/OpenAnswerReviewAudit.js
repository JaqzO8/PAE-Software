const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');

const OpenAnswerReviewAudit = sequelize.define('revision_respuestas_abiertas_audit', {
    id_auditoria: { type: DataTypes.BIGINT, primaryKey: true, autoIncrement: true },
    id_revision: { type: DataTypes.INTEGER, allowNull: false },
    version: { type: DataTypes.INTEGER, allowNull: false },
    id_revisor: { type: DataTypes.INTEGER, allowNull: false },
    puntaje: { type: DataTypes.INTEGER, allowNull: false },
    feedback: { type: DataTypes.TEXT, allowNull: true },
    fecha: { type: DataTypes.DATE, allowNull: false, defaultValue: DataTypes.NOW },
}, {
    tableName: 'revision_respuestas_abiertas_audit',
    timestamps: false,
    indexes: [{ unique: true, fields: ['id_revision', 'version'] }],
});

module.exports = OpenAnswerReviewAudit;
