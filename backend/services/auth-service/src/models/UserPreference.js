const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');
const Usuario = require('./Usuario');

const UserPreference = sequelize.define('preferencias_usuario', {
    id_preferencia: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true,
    },
    id_usuario: {
        type: DataTypes.INTEGER,
        allowNull: false,
        unique: true,
        references: {
            model: 'usuarios',
            key: 'id_usuario',
        },
    },
    tema: {
        type: DataTypes.STRING(20),
        allowNull: false,
        defaultValue: 'light',
        validate: {
            isIn: [['light', 'dark']],
        },
    },
    tamano_fuente: {
        type: DataTypes.STRING(20),
        allowNull: false,
        defaultValue: 'medium',
        validate: {
            isIn: [['small', 'medium', 'large']],
        },
    },
    reducir_movimiento: {
        type: DataTypes.BOOLEAN,
        allowNull: false,
        defaultValue: false,
    },
    alto_contraste: {
        type: DataTypes.BOOLEAN,
        allowNull: false,
        defaultValue: false,
    },
    notificaciones_email: {
        type: DataTypes.BOOLEAN,
        allowNull: false,
        defaultValue: true,
    },
    notificaciones_desafios: {
        type: DataTypes.BOOLEAN,
        allowNull: false,
        defaultValue: true,
    },
    notificaciones_comunidad: {
        type: DataTypes.BOOLEAN,
        allowNull: false,
        defaultValue: false,
    },
}, {
    tableName: 'preferencias_usuario',
    timestamps: true,
    indexes: [
        { fields: ['id_usuario'], unique: true },
        { fields: ['tema'] },
    ],
});

UserPreference.belongsTo(Usuario, { foreignKey: 'id_usuario', as: 'usuario' });
Usuario.hasOne(UserPreference, { foreignKey: 'id_usuario', as: 'preferencias' });

module.exports = UserPreference;
