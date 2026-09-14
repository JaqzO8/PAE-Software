const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');
const Usuario = require('./Usuario');

const Sesion = sequelize.define('sesiones', {
    id_sesion: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true,
    },
    id_usuario: {
        type: DataTypes.INTEGER,
        allowNull: false,
        references: {
            model: 'usuarios',
            key: 'id_usuario',
        },
    },
    token_sesion: {
        type: DataTypes.STRING(255),
        allowNull: false,
        unique: true,
    },
    dispositivo: {
        type: DataTypes.STRING(100),
        allowNull: true,
    },
    ip_address: {
        type: DataTypes.STRING(45),
        allowNull: true,
    },
    user_agent: {
        type: DataTypes.TEXT,
        allowNull: true,
    },
    fecha_inicio: {
        type: DataTypes.DATE,
        allowNull: false,
        defaultValue: DataTypes.NOW,
    },
    fecha_ultimo_acceso: {
        type: DataTypes.DATE,
        allowNull: false,
        defaultValue: DataTypes.NOW,
    },
    activa: {
        type: DataTypes.BOOLEAN,
        allowNull: false,
        defaultValue: true,
    },
}, {
    tableName: 'sesiones',
    timestamps: false,
    indexes: [
        { fields: ['id_usuario'] },
        { fields: ['token_sesion'] },
        { fields: ['activa'] },
    ],
});

// Relaciones
Sesion.belongsTo(Usuario, { foreignKey: 'id_usuario', as: 'usuario' });

module.exports = Sesion;