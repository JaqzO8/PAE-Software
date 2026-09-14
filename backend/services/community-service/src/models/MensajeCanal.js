const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');

const MensajeCanal = sequelize.define('mensajes_canal', {
    id_mensaje: {
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
        comment: 'ID del usuario que envió el mensaje',
    },
    contenido: {
        type: DataTypes.TEXT,
        allowNull: false,
        validate: {
            len: [1, 2000],
        },
    },
    fecha_envio: {
        type: DataTypes.DATE,
        defaultValue: DataTypes.NOW,
        allowNull: false,
    },
    editado: {
        type: DataTypes.BOOLEAN,
        defaultValue: false,
    },
    fecha_edicion: {
        type: DataTypes.DATE,
        allowNull: true,
    },
}, {
    tableName: 'mensajes_canal',
    timestamps: false,
    indexes: [
        { fields: ['comunidad_id'] },
        { fields: ['usuario_id'] },
        { fields: ['fecha_envio'] },
    ],
});

module.exports = MensajeCanal;