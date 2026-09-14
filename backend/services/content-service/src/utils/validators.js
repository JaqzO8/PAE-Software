const { body, validationResult } = require('express-validator');

// Validaciones para crear repositorio
const validateRepository = [
    body('nombre')
        .trim()
        .notEmpty().withMessage('El nombre es requerido')
        .isLength({ min: 3, max: 200 }).withMessage('El nombre debe tener entre 3 y 200 caracteres'),

    body('descripcion')
        .optional()
        .trim()
        .isLength({ max: 1000 }).withMessage('La descripción no puede exceder 1000 caracteres'),

    body('publico')
        .optional()
        .isBoolean().withMessage('El campo público debe ser booleano'),
];

// Validaciones para crear recurso
const validateResource = [
    body('id_repositorio')
        .notEmpty().withMessage('El ID del repositorio es requerido')
        .isInt().withMessage('El ID del repositorio debe ser un número'),

    body('titulo')
        .trim()
        .notEmpty().withMessage('El título es requerido')
        .isLength({ min: 3, max: 200 }).withMessage('El título debe tener entre 3 y 200 caracteres'),

    body('descripcion')
        .optional()
        .trim()
        .isLength({ max: 1000 }).withMessage('La descripción no puede exceder 1000 caracteres'),

    body('tipo_recurso')
        .notEmpty().withMessage('El tipo de recurso es requerido')
        .isLength({ max: 50 }).withMessage('El tipo de recurso no puede exceder 50 caracteres'),

    body('url_externa')
        .optional()
        .isURL().withMessage('Debe ser una URL válida'),
];

// Middleware para manejar errores de validación
const handleValidationErrors = (req, res, next) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        return res.status(400).json({
            success: false,
            errors: errors.array().map(err => ({
                field: err.path,
                message: err.msg,
            })),
        });
    }
    next();
};

module.exports = {
    validateRepository,
    validateResource,
    handleValidationErrors,
};