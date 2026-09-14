const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');

const ReporteComunidad = sequelize.define('reportes_comunidad', {
    id_reporte: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true,
    },
    comunidad_id: {
        type: DataTypes.INTEGER,
        allowNull: false,
        references: {
            model: 'comunidades',
            key: 'id_comunidad',
        },
    },
    usuario_reporta_id: {
        type: DataTypes.INTEGER,
        allowNull: false,
        comment: 'Usuario que hace el reporte',
    },
    tipo_reporte: {
        type: DataTypes.STRING(50),
        allowNull: false,
        validate: {
            isIn: [['spam', 'acoso', 'contenido_inapropiado', 'otro']],
        },
    },
    motivo: {
        type: DataTypes.TEXT,
        allowNull: false,
    },
    estado: {
        type: DataTypes.STRING(20),
        defaultValue: 'pendiente',
        validate: {
            isIn: [['pendiente', 'en_revision', 'resuelto', 'descartado']],
        },
    },
    fecha_reporte: {
        type: DataTypes.DATE,
        defaultValue: DataTypes.NOW,
        allowNull: false,
    },
}, {
    tableName: 'reportes_comunidad',
    timestamps: false,
    indexes: [
        { fields: ['comunidad_id'] },
        { fields: ['usuario_reporta_id'] },
        { fields: ['estado'] },
    ],
});

module.exports = ReporteComunidad;