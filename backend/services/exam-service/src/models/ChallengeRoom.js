const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');

const ChallengeRoom = sequelize.define('salas_desafio', {
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
    dificultad: {
        type: DataTypes.ENUM('facil', 'medio', 'dificil'),
        allowNull: false,
        defaultValue: 'medio',
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
    tableName: 'salas_desafio',
    timestamps: true,
    indexes: [
        { fields: ['estado'] },
        { fields: ['id_anfitrion'] },
        { fields: ['dificultad'] },
    ],
});

module.exports = ChallengeRoom;
