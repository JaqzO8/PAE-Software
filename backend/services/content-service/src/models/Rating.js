const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');

const Rating = sequelize.define('calificaciones', {
    id_calificacion: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true,
    },
    id_usuario: {
        type: DataTypes.INTEGER,
        allowNull: false,
        comment: 'ID del usuario que califica',
    },
    id_repositorio: {
        type: DataTypes.INTEGER,
        allowNull: false,
        references: {
            model: 'repositorios',
            key: 'id_repositorio',
        },
    },
    puntuacion: {
        type: DataTypes.INTEGER,
        allowNull: false,
        validate: {
            min: 1,
            max: 10,
        },
        comment: 'Calificación de 1 a 10',
    },
    comentario: {
        type: DataTypes.TEXT,
        allowNull: true,
    },
    fecha_creacion: {
        type: DataTypes.DATE,
        allowNull: false,
        defaultValue: DataTypes.NOW,
    },
    fecha_actualizacion: {
        type: DataTypes.DATE,
        allowNull: true,
    },
}, {
    tableName: 'calificaciones',
    timestamps: true,
    createdAt: 'fecha_creacion',
    updatedAt: 'fecha_actualizacion',
    indexes: [
        { fields: ['id_usuario'] },
        { fields: ['id_repositorio'] },
        { 
            unique: true, 
            fields: ['id_usuario', 'id_repositorio'],
            name: 'unique_user_repository_rating'
        },
    ],
});

module.exports = Rating;