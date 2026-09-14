const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');

const TriviaMatch = sequelize.define('partidas_trivia', {
    id_partida: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true,
    },
    id_sala: {
        type: DataTypes.INTEGER,
        allowNull: false,
        references: {
            model: 'salas_trivia',
            key: 'id_sala',
        },
    },
    preguntas: {
        type: DataTypes.JSONB,
        allowNull: false,
        defaultValue: [],
    },
    pregunta_actual: {
        type: DataTypes.INTEGER,
        allowNull: false,
        defaultValue: 0,
    },
    respuestas: {
        type: DataTypes.JSONB,
        allowNull: false,
        defaultValue: [],
    },
    marcador: {
        type: DataTypes.JSONB,
        allowNull: false,
        defaultValue: [],
    },
    estado: {
        type: DataTypes.ENUM('waiting', 'playing', 'finished'),
        allowNull: false,
        defaultValue: 'waiting',
    },
    tiempo_por_pregunta: {
        type: DataTypes.INTEGER,
        allowNull: false,
        defaultValue: 30,
    },
    pregunta_inicia_en: {
        type: DataTypes.DATE,
        allowNull: true,
    },
    inicia_en: {
        type: DataTypes.DATE,
        allowNull: true,
    },
    finaliza_en: {
        type: DataTypes.DATE,
        allowNull: true,
    },
}, {
    tableName: 'partidas_trivia',
    timestamps: true,
    indexes: [
        { fields: ['id_sala'] },
        { fields: ['estado'] },
    ],
});

module.exports = TriviaMatch;
