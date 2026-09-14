const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');

const InvitacionComunidad = sequelize.define('invitaciones_comunidad', {
    id_invitacion: {
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
    profesor_id: {
        type: DataTypes.INTEGER,
        allowNull: false,
        comment: 'Quien envía la invitación',
    },
    estudiante_id: {
        type: DataTypes.INTEGER,
        allowNull: false,
        comment: 'Usuario invitado',
    },
    estado: {
        type: DataTypes.STRING(20),
        allowNull: false,
        defaultValue: 'pendiente',
        validate: {
            isIn: [['pendiente', 'aceptada', 'rechazada', 'expirada']],
        },
    },
    fecha_invitacion: {
        type: DataTypes.DATE,
        defaultValue: DataTypes.NOW,
        allowNull: false,
    },
    fecha_respuesta: {
        type: DataTypes.DATE,
        allowNull: true,
    },
}, {
    tableName: 'invitaciones_comunidad',
    timestamps: false,
    indexes: [
        { fields: ['comunidad_id'] },
        { fields: ['estudiante_id'] },
        { fields: ['estado'] },
        { unique: true, fields: ['comunidad_id', 'estudiante_id'] },
    ],
});

module.exports = InvitacionComunidad;