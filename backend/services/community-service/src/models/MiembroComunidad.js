const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');

const MiembroComunidad = sequelize.define('miembros_comunidad', {
    id_miembro: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true,
    },
    comunidad_id: {
        type: DataTypes.INTEGER,
        allowNull: false,
        references: {
            model: 'comunidades',
            key: 'id_comunidad',
        },
    },
    usuario_id: {
        type: DataTypes.INTEGER,
        allowNull: false,
        comment: 'ID del usuario (de auth-service)',
    },
    rol_comunidad: {
        type: DataTypes.STRING(20),
        allowNull: false,
        defaultValue: 'miembro',
        validate: {
            isIn: [['profesor', 'miembro', 'moderador']],
        },
    },
    puntos_individuales: {
        type: DataTypes.INTEGER,
        defaultValue: 0,
        allowNull: false,
    },
    activo: {
        type: DataTypes.BOOLEAN,
        defaultValue: true,
        allowNull: false,
    },
    fecha_union: {
        type: DataTypes.DATE,
        defaultValue: DataTypes.NOW,
        allowNull: false,
    },
    fecha_expulsion: {
        type: DataTypes.DATE,
        allowNull: true,
    },
    motivo_expulsion: {
        type: DataTypes.TEXT,
        allowNull: true,
    },
}, {
    tableName: 'miembros_comunidad',
    timestamps: false,
    indexes: [
        { fields: ['comunidad_id'] },
        { fields: ['usuario_id'] },
        { fields: ['activo'] },
        { unique: true, fields: ['comunidad_id', 'usuario_id'] },
    ],
});

module.exports = MiembroComunidad;