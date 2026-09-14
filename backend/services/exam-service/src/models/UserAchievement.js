const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');

const UserAchievement = sequelize.define('user_achievements', {
    id_usuario_logro: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true,
    },
    id_usuario: {
        type: DataTypes.INTEGER,
        allowNull: false,
    },
    id_logro: {
        type: DataTypes.INTEGER,
        allowNull: false,
        references: {
            model: 'achievement_definitions',
            key: 'id_logro',
        },
    },
    origen: {
        type: DataTypes.STRING(80),
        allowNull: false,
        defaultValue: 'simulacro',
    },
    metadata: {
        type: DataTypes.JSONB,
        allowNull: false,
        defaultValue: {},
    },
    fecha_obtenido: {
        type: DataTypes.DATE,
        allowNull: false,
        defaultValue: DataTypes.NOW,
    },
}, {
    tableName: 'user_achievements',
    timestamps: true,
    indexes: [
        { fields: ['id_usuario'] },
        { unique: true, fields: ['id_usuario', 'id_logro'] },
    ],
});

module.exports = UserAchievement;
