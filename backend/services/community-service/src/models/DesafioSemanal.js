const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');

const DesafioSemanal = sequelize.define('desafios_semanales', {
    id_desafio: {
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
    nombre: {
        type: DataTypes.STRING(200),
        allowNull: false,
    },
    descripcion: {
        type: DataTypes.TEXT,
        allowNull: true,
    },
    fecha_inicio: {
        type: DataTypes.DATE,
        allowNull: false,
    },
    fecha_fin: {
        type: DataTypes.DATE,
        allowNull: false,
    },
    activo: {
        type: DataTypes.BOOLEAN,
        defaultValue: true,
        allowNull: false,
    },
    completado: {
        type: DataTypes.BOOLEAN,
        defaultValue: false,
    },
    fecha_creacion: {
        type: DataTypes.DATE,
        defaultValue: DataTypes.NOW,
    },
}, {
    tableName: 'desafios_semanales',
    timestamps: false,
    indexes: [
        { fields: ['comunidad_id'] },
        { fields: ['activo'] },
        { fields: ['fecha_inicio'] },
        { fields: ['fecha_fin'] },
    ],
});

module.exports = DesafioSemanal;