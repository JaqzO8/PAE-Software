const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');

const Comment = sequelize.define('comentarios', {
    id_comentario: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true,
    },
    id_usuario: {
        type: DataTypes.INTEGER,
        allowNull: false,
        comment: 'ID del usuario que comenta',
    },
    id_repositorio: {
        type: DataTypes.INTEGER,
        allowNull: true,
        references: {
            model: 'repositorios',
            key: 'id_repositorio',
        },
    },
    id_recurso: {
        type: DataTypes.INTEGER,
        allowNull: true,
        references: {
            model: 'recursos',
            key: 'id_recurso',
        },
    },
    comentario: {
        type: DataTypes.TEXT,
        allowNull: false,
    },
    id_comentario_padre: {
        type: DataTypes.INTEGER,
        allowNull: true,
        references: {
            model: 'comentarios',
            key: 'id_comentario',
        },
        comment: 'Para respuestas a comentarios',
    },
    activo: {
        type: DataTypes.BOOLEAN,
        allowNull: false,
        defaultValue: true,
    },
}, {
    tableName: 'comentarios',
    timestamps: true,
    createdAt: 'fecha_creacion',
    updatedAt: 'fecha_actualizacion',
    indexes: [
        { fields: ['id_usuario'] },
        { fields: ['id_repositorio'] },
        { fields: ['id_recurso'] },
        { fields: ['id_comentario_padre'] },
        { fields: ['activo'] },
    ],
});

// Auto-referencia para respuestas
Comment.hasMany(Comment, { 
    foreignKey: 'id_comentario_padre', 
    as: 'respuestas' 
});
Comment.belongsTo(Comment, { 
    foreignKey: 'id_comentario_padre', 
    as: 'padre' 
});

module.exports = Comment;