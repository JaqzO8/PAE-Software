/**
 * Middleware global de manejo de errores
 */
const errorHandler = (err, req, res, next) => {
    console.error('❌ Error:', err);

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