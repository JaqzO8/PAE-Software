const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');

const Amistad = sequelize.define('amistades', {
    id_amistad: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true,
    },
    usuario_solicitante_id: {
        type: DataTypes.INTEGER,
        allowNull: false,
    },
    usuario_receptor_id: {
        type: DataTypes.INTEGER,
        allowNull: false,
    },
    estado: {
        type: DataTypes.STRING(20),
        allowNull: false,
        defaultValue: 'pendiente',
        validate: {
            isIn: [['pendiente', 'aceptada', 'rechazada', 'bloqueada']],
        },
    },
    fecha_solicitud: {
        type: DataTypes.DATE,
        defaultValue: DataTypes.NOW,
        allowNull: false,
    },
    fecha_respuesta: {
        type: DataTypes.DATE,
        allowNull: true,
    },
}, {
    tableName: 'amistades',
    timestamps: false,
    indexes: [
        { fields: ['usuario_solicitante_id'] },
        { fields: ['usuario_receptor_id'] },
        { fields: ['estado'] },
    ],
});

module.exports = Amistad;