const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');

const UniversityNews = sequelize.define('university_news', {
    id_noticia: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true,
    },
    titulo: {
        type: DataTypes.STRING(180),
        allowNull: false,
    },
    resumen: {
        type: DataTypes.TEXT,
        allowNull: false,
    },
    universidad: {
        type: DataTypes.STRING(120),
        allowNull: false,
    },
    categoria: {
        type: DataTypes.STRING(80),
        allowNull: false,
        defaultValue: 'admision',
    },
    url: {
        type: DataTypes.STRING(500),
        allowNull: true,
    },
    fecha_publicacion: {
        type: DataTypes.DATE,
        allowNull: false,
        defaultValue: DataTypes.NOW,
    },
    activo: {
        type: DataTypes.BOOLEAN,
        allowNull: false,
        defaultValue: true,
    },
}, {
    tableName: 'university_news',
    timestamps: false,
    indexes: [
        { fields: ['universidad'] },
        { fields: ['categoria'] },
        { fields: ['activo'] },
        { fields: ['fecha_publicacion'] },
    ],
});

module.exports = UniversityNews;
