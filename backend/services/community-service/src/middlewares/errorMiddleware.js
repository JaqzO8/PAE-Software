/**
 * Middleware global de manejo de errores
 */
const multer = require('multer');

const errorHandler = (err, req, res, next) => {
    console.error('❌ Error:', err);

    // Error de Multer (archivos)
    if (err instanceof multer.MulterError) {
        if (err.code === 'LIMIT_FILE_SIZE') {
            return res.status(400).json({
                success: false,
                message: 'El archivo es demasiado grande. Máximo 10MB.',
            });
        }
        return res.status(400).json({
            success: false,
            message: `Error al subir archivo: ${err.message}`,
        });
    }

    // Error de validación de Sequelize
    if (err.name === 'SequelizeValidationError') {
        return res.status(400).json({
            success: false,
            message: 'Error de validación',
            errors: err.errors.map(e => ({
                field: e.path,
                message: e.message,
            })),
        });
    }

    // Error de unicidad de Sequelize
    if (err.name === 'SequelizeUniqueConstraintError') {
        return res.status(409).json({
            success: false,
            message: 'El registro ya existe',
            field: err.errors[0]?.path,
        });
    }

    // Error por defecto
    res.status(err.status || 500).json({
        success: false,
        message: err.message || 'Error interno del servidor',
    });
};

/**
 * Middleware para rutas no encontradas
 */
const notFound = (req, res) => {
    res.status(404).json({
        success: false,
        message: 'Ruta no encontrada',
    });
};

module.exports = {
    errorHandler,
    notFound,
};
