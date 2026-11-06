/**
 * Middleware global de manejo de errores
 */
const errorHandler = (err, req, res, next) => {
    console.error('Auth request failed', { name: err.name, code: err.original?.code });

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
    const status = err.status || err.statusCode || 500;
    res.status(status).json({
        success: false,
        message: status >= 500 ? 'Servicio temporalmente no disponible' : err.message || 'Solicitud inválida',
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
