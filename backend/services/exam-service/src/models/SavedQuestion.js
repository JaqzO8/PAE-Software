const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');

const SavedQuestion = sequelize.define('preguntas_guardadas', {
    id_guardado: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true,
    },
    id_usuario: {
        type: DataTypes.INTEGER,
        allowNull: false,
    },
    id_pregunta: {
        type: DataTypes.INTEGER,
        allowNull: false,
    },
}, {
    tableName: 'preguntas_guardadas',
    timestamps: true,
    indexes: [
        { unique: true, fields: ['id_usuario', 'id_pregunta'] },
    ],
});

module.exports = SavedQuestion;
