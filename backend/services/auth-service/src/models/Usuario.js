const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');
const bcrypt = require('bcryptjs');
const { v4: uuidv4 } = require('uuid');
const Rol = require('./Rol');

const Usuario = sequelize.define('usuarios', {
    id_usuario: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true,
    },
    identificador_unico: {
        type: DataTypes.STRING(50),
        allowNull: false,
        unique: true,
        defaultValue: () => `USR-${uuidv4().substring(0, 8).toUpperCase()}`,
    },
    email: {
        type: DataTypes.STRING(100),
        allowNull: false,
        unique: true,
        validate: {
            isEmail: {
                msg: 'Debe ser un email válido',
            },
        },
        set(value) {
            this.setDataValue('email', value.toLowerCase().trim());
        },
    },
    password_hash: {
        type: DataTypes.STRING(255),
        allowNull: false,
    },
    nombres: {
        type: DataTypes.STRING(100),
        allowNull: false,
        validate: {
            len: {
                args: [2, 100],
                msg: 'Los nombres deben tener entre 2 y 100 caracteres',
            },
        },
    },
    apellidos: {
        type: DataTypes.STRING(100),
        allowNull: false,
        validate: {
            len: {
                args: [2, 100],
                msg: 'Los apellidos deben tener entre 2 y 100 caracteres',
            },
        },
    },
    carrera_interes: {
        type: DataTypes.STRING(100),
        allowNull: true,
    },
    institucion: {
        type: DataTypes.STRING(200),
        allowNull: true,
    },
    bio: {
        type: DataTypes.TEXT,
        allowNull: true,
    },
    avatar: {
        type: DataTypes.STRING(255),
        allowNull: true,
    },
    rol_id: {
        type: DataTypes.INTEGER,
        allowNull: false,
        references: {
            model: 'roles',
            key: 'id_rol',
        },
    },
    fecha_registro: {
        type: DataTypes.DATE,
        allowNull: false,
        defaultValue: DataTypes.NOW,
    },
    primer_ingreso: {
        type: DataTypes.BOOLEAN,
        allowNull: false,
        defaultValue: true,
    },
    activo: {
        type: DataTypes.BOOLEAN,
        allowNull: false,
        defaultValue: true,
    },
}, {
    tableName: 'usuarios',
    timestamps: false,
    indexes: [
        { fields: ['identificador_unico'] },
        { fields: ['email'] },
        { fields: ['rol_id'] },
        { fields: ['nombres'] },
        { fields: ['apellidos'] },
    ],
});

// Relaciones
Usuario.belongsTo(Rol, { foreignKey: 'rol_id', as: 'rol' });

// Hooks
Usuario.beforeCreate(async (usuario) => {
    if (usuario.password_hash) {
        const salt = await bcrypt.genSalt(10);
        usuario.password_hash = await bcrypt.hash(usuario.password_hash, salt);
    }
});

Usuario.beforeUpdate(async (usuario) => {
    if (usuario.changed('password_hash')) {
        const salt = await bcrypt.genSalt(10);
        usuario.password_hash = await bcrypt.hash(usuario.password_hash, salt);
    }
});

// Métodos de instancia
Usuario.prototype.validarPassword = async function (password) {
    return await bcrypt.compare(password, this.password_hash);
};

Usuario.prototype.toJSON = function () {
    const values = { ...this.get() };
    delete values.password_hash;
    return values;
};

module.exports = Usuario;