const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');

const Rol = sequelize.define('roles', {
    id_rol: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true,
    },
    nombre_rol: {
        type: DataTypes.STRING(50),
        allowNull: false,
        unique: true,
        validate: {
            isIn: [['estudiante', 'docente', 'admin']],
        },
    },
    descripcion: {
        type: DataTypes.TEXT,
        allowNull: true,
    },
}, {
    tableName: 'roles',
    timestamps: false,
});

module.exports = Rol;