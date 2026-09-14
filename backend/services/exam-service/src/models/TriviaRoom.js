const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');

const TriviaRoom = sequelize.define('salas_trivia', {
    id_sala: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true,
    },
    id_anfitrion: {
        type: DataTypes.INTEGER,
        allowNull: false,
    },
    anfitrion_nombre: {
        type: DataTypes.STRING(160),
        allowNull: false,
    },
    tema: {
        type: DataTypes.STRING(180),
        allowNull: false,
    },
    preguntas_count: {
        type: DataTypes.INTEGER,
        allowNull: false,
        defaultValue: 5,
        validate: {
            min: 3,
            max: 15,
        },
    },
    max_jugadores: {
        type: DataTypes.INTEGER,
        allowNull: false,
        defaultValue: 4,
        validate: {
            min: 2,
            max: 8,
        },
    },
    participantes: {
        type: DataTypes.JSONB,
        allowNull: false,
        defaultValue: [],
    },
    estado: {
        type: DataTypes.ENUM('waiting', 'playing', 'finished'),
        allowNull: false,
        defaultValue: 'waiting',
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
    tableName: 'salas_trivia',
    timestamps: true,
    indexes: [
        { fields: ['estado'] },
        { fields: ['id_anfitrion'] },
    ],
});

module.exports = TriviaRoom;
