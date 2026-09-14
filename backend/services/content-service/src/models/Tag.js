const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');

const Tag = sequelize.define('tags', {
    id_tag: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true,
    },
    nombre: {
        type: DataTypes.STRING(50),
        allowNull: false,
    },
    slug: {
        type: DataTypes.STRING(50),
        allowNull: false,
        unique: true,
    },
    cantidad_uso: {
        type: DataTypes.INTEGER,
        allowNull: false,
        defaultValue: 0,
        comment: 'Contador de veces que se usa este tag',
    },
    fecha_creacion: {
        type: DataTypes.DATE,
        allowNull: false,
        defaultValue: DataTypes.NOW,
    },
}, {
    tableName: 'tags',
    timestamps: false,
    indexes: [
        { fields: ['slug'] },
        { fields: ['cantidad_uso'] },
    ],
});

module.exports = Tag;