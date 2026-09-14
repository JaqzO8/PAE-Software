const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');
const Usuario = require('./Usuario');

const SupportTicket = sequelize.define('tickets_soporte', {
    id_ticket: {
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
    asunto: {
        type: DataTypes.STRING(160),
        allowNull: false,
    },
    descripcion: {
        type: DataTypes.TEXT,
        allowNull: false,
    },
    categoria: {
        type: DataTypes.STRING(40),
        allowNull: false,
        defaultValue: 'tecnico',
        validate: {
            isIn: [['tecnico', 'cuenta', 'privacidad', 'contenido', 'accesibilidad']],
        },
    },
    prioridad: {
        type: DataTypes.STRING(20),
        allowNull: false,
        defaultValue: 'media',
        validate: {
            isIn: [['baja', 'media', 'alta']],
        },
    },
    estado: {
        type: DataTypes.STRING(20),
        allowNull: false,
        defaultValue: 'abierto',
        validate: {
            isIn: [['abierto', 'en_revision', 'resuelto', 'cerrado']],
        },
    },
    respuesta: {
        type: DataTypes.TEXT,
        allowNull: true,
    },
    fecha_respuesta: {
        type: DataTypes.DATE,
        allowNull: true,
    },
}, {
    tableName: 'tickets_soporte',
    timestamps: true,
    indexes: [
        { fields: ['id_usuario'] },
        { fields: ['estado'] },
        { fields: ['categoria'] },
        { fields: ['prioridad'] },
    ],
});

SupportTicket.belongsTo(Usuario, { foreignKey: 'id_usuario', as: 'usuario' });
Usuario.hasMany(SupportTicket, { foreignKey: 'id_usuario', as: 'tickets_soporte' });

module.exports = SupportTicket;
