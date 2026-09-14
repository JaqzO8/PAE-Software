const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');

const AchievementDefinition = sequelize.define('achievement_definitions', {
    id_logro: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true,
    },
    codigo: {
        type: DataTypes.STRING(80),
        allowNull: false,
        unique: true,
    },
    titulo: {
        type: DataTypes.STRING(160),
        allowNull: false,
    },
    descripcion: {
        type: DataTypes.TEXT,
        allowNull: false,
    },
    icono: {
        type: DataTypes.STRING(40),
        allowNull: false,
        defaultValue: 'trophy',
    },
    condicion: {
        type: DataTypes.STRING(80),
        allowNull: false,
    },
    umbral: {
        type: DataTypes.INTEGER,
        allowNull: false,
        defaultValue: 1,
    },
    puntos: {
        type: DataTypes.INTEGER,
        allowNull: false,
        defaultValue: 10,
    },
    activo: {
        type: DataTypes.BOOLEAN,
        allowNull: false,
        defaultValue: true,
    },
}, {
    tableName: 'achievement_definitions',
    timestamps: true,
});

module.exports = AchievementDefinition;
