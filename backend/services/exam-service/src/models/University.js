const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');

const University = sequelize.define('universidades', {
    id_universidad: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true,
    },
    slug: {
        type: DataTypes.STRING(50),
        allowNull: false,
        unique: true,
    },
    nombre: {
        type: DataTypes.STRING(200),
        allowNull: false,
    },
    logo: {
        type: DataTypes.STRING(500),
        allowNull: true,
    },
    activo: {
        type: DataTypes.BOOLEAN,
        allowNull: false,
        defaultValue: true,
    },
}, {
    tableName: 'universidades',
    timestamps: true,
});

module.exports = University;
