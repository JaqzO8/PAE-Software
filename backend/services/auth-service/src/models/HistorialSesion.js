const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');
const Usuario = require('./Usuario');

const HistorialSesion = sequelize.define('historial_sesiones', {
    id_historial: {
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
    dispositivo: {
        type: DataTypes.STRING(100),
        allowNull: true,
    },
    ip_address: {
        type: DataTypes.STRING(45),
        allowNull: true,
    },
    fecha_acceso: {
        type: DataTypes.DATE,
        allowNull: false,
        defaultValue: DataTypes.NOW,
    },
    accion: {
        type: DataTypes.STRING(50),
        allowNull: false,
        validate: {
            isIn: [['login', 'logout', 'cambio_password', 'token_refresh']],
        },
    },
    exitoso: {
        type: DataTypes.BOOLEAN,
        allowNull: false,
        defaultValue: true,
    },
}, {
    tableName: 'historial_sesiones',
    timestamps: false,
    indexes: [
        { fields: ['id_usuario'] },
        { fields: ['fecha_acceso'] },
        { fields: ['accion'] },
    ],
});

// Relaciones
HistorialSesion.belongsTo(Usuario, { foreignKey: 'id_usuario', as: 'usuario' });

module.exports = HistorialSesion;