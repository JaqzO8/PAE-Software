const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');

const RepositoryTag = sequelize.define('repositorio_tags', {
    id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true,
    },
    id_repositorio: {
        type: DataTypes.INTEGER,
        allowNull: false,
        references: {
            model: 'repositorios',
            key: 'id_repositorio',
        },
    },
    id_tag: {
        type: DataTypes.INTEGER,
        allowNull: false,
        references: {
            model: 'tags',
            key: 'id_tag',
        },
    },
}, {
    tableName: 'repositorio_tags',
    timestamps: false,
    indexes: [
        { fields: ['id_repositorio'] },
        { fields: ['id_tag'] },
        { 
            unique: true, 
            fields: ['id_repositorio', 'id_tag'],
            name: 'unique_repository_tag'
        },
    ],
});

module.exports = RepositoryTag;