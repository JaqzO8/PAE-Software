const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');

const Category = sequelize.define('categorias', {
    id_categoria: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true,
    },
    nombre: {
        type: DataTypes.STRING(100),
        allowNull: false,
        unique: true,
    },
    slug: {
        type: DataTypes.STRING(100),
        allowNull: false,
        unique: true,
    },
    descripcion: {
        type: DataTypes.TEXT,
        allowNull: true,
    },
    icono: {
        type: DataTypes.STRING(50),
        allowNull: true,
    },
    activa: {
        type: DataTypes.BOOLEAN,
        allowNull: false,
        defaultValue: true,
    },
    fecha_creacion: {
        type: DataTypes.DATE,
        allowNull: false,
        defaultValue: DataTypes.NOW,
    },
}, {
    tableName: 'categorias',
    timestamps: false,
    indexes: [
        { fields: ['slug'] },
        { fields: ['activa'] },
    ],
});

module.exports = Category;