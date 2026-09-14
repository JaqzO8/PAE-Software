const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');

const CommunitySetting = sequelize.define('community_settings', {
    id_setting: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true,
    },
    clave: {
        type: DataTypes.STRING(80),
        allowNull: false,
        unique: true,
    },
    valor: {
        type: DataTypes.JSONB,
        allowNull: false,
    },
    descripcion: {
        type: DataTypes.TEXT,
        allowNull: true,
    },
    editable: {
        type: DataTypes.BOOLEAN,
        allowNull: false,
        defaultValue: true,
    },
    actualizado_por: {
        type: DataTypes.INTEGER,
        allowNull: true,
    },
    fecha_actualizacion: {
        type: DataTypes.DATE,
        allowNull: false,
        defaultValue: DataTypes.NOW,
    },
}, {
    tableName: 'community_settings',
    timestamps: false,
    indexes: [{ fields: ['clave'], unique: true }],
});

module.exports = CommunitySetting;
