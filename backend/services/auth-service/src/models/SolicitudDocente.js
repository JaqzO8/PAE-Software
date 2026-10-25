const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');
const Usuario = require('./Usuario');

const SolicitudDocente = sequelize.define('solicitudes_docente', {
    id_solicitud: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true,
    },
    usuario_id: {
        type: DataTypes.INTEGER,
        allowNull: false,
        references: {
            model: 'usuarios',
            key: 'id_usuario',
        },
    },
    institucion: {
        type: DataTypes.STRING(200),
        allowNull: false,
    },
    evidencia: {
        type: DataTypes.TEXT,
        allowNull: true,
    },
    estado: {
        type: DataTypes.STRING(30),
        allowNull: false,
        defaultValue: 'pendiente',
        validate: {
            isIn: [['pendiente', 'aprobada', 'rechazada']],
        },
    },
    revisado_por: {
        type: DataTypes.INTEGER,
        allowNull: true,
    },
    motivo_rechazo: {
        type: DataTypes.TEXT,
        allowNull: true,
    },
    fecha_solicitud: {
        type: DataTypes.DATE,
        allowNull: false,
        defaultValue: DataTypes.NOW,
    },
    fecha_revision: {
        type: DataTypes.DATE,
        allowNull: true,
    },
}, {
    tableName: 'solicitudes_docente',
    timestamps: false,
});

SolicitudDocente.belongsTo(Usuario, { foreignKey: 'usuario_id', as: 'usuario' });

module.exports = SolicitudDocente;
