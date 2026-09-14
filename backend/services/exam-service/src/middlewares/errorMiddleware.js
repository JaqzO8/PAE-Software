const notFound = (req, res) => {
    res.status(404).json({
        success: false,
        message: 'Ruta no encontrada',
        path: req.originalUrl,
    });
};

const errorHandler = (error, req, res, next) => {
    console.error('Error en exam-service:', error);
    res.status(error.status || 500).json({
        success: false,
        message: error.message || 'Error interno del servidor',
    });
};

module.exports = {
    notFound,
    errorHandler,
};
