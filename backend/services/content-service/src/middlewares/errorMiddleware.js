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

    // Error de clave foránea
    if (err.name === 'SequelizeForeignKeyConstraintError') {
        return res.status(400).json({
            success: false,
            message: 'Referencia inválida',
        });
    }

    // Error de Multer (upload de archivos)
    if (err.name === 'MulterError') {
        if (err.code === 'LIMIT_FILE_SIZE') {
            return res.status(400).json({
                success: false,
                message: 'El archivo excede el tamaño máximo permitido (50MB)',
            });
        }
        if (err.code === 'LIMIT_UNEXPECTED_FILE') {
            return res.status(400).json({
                success: false,
                message: 'Archivo no esperado',
            });
        }
        return res.status(400).json({
            success: false,
            message: 'Error al subir archivo',
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
        path: req.path,
    });
};

module.exports = {
    errorHandler,
    notFound,
};