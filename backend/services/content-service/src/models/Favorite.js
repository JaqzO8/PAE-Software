const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');

const Favorite = sequelize.define('favoritos', {
    id_favorito: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true,
    },
    id_usuario: {
        type: DataTypes.INTEGER,
        allowNull: false,
        comment: 'ID del usuario',
    },
    id_repositorio: {
        type: DataTypes.INTEGER,
        allowNull: false,
        references: {
            model: 'repositorios',
            key: 'id_repositorio',
        },
    },
    fecha_creacion: {
        type: DataTypes.DATE,
        allowNull: false,
        defaultValue: DataTypes.NOW,
    },
}, {
    tableName: 'favoritos',
    timestamps: false,
    indexes: [
        { fields: ['id_usuario'] },
        { fields: ['id_repositorio'] },
        { 
            unique: true, 
            fields: ['id_usuario', 'id_repositorio'],
            name: 'unique_user_repository_favorite'
        },
    ],
});

module.exports = Favorite;