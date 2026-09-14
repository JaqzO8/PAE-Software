const express = require('express');
const router = express.Router();
const ResourceController = require('../controllers/resourceController');
const { verifyToken, isTeacher, isAuthenticated } = require('../middlewares/authMiddleware');
const { uploadSingle } = require('../middlewares/uploadMiddleware');

/**
 * GET /api/content/resources
 * Listar recursos de un repositorio
 */
router.get('/', ResourceController.list);

/**
 * POST /api/content/resources
 * Crear un nuevo recurso (solo docentes)
 */
router.post(
    '/',
    verifyToken,
    isTeacher,
    uploadSingle('file'),
    ResourceController.create
);

/**
 * GET /api/content/resources/:id/file
 * Descargar archivo local autenticado
 */
router.get(
    '/:id/file',
    verifyToken,
    isAuthenticated,
    ResourceController.streamFile
);

/**
 * GET /api/content/resources/:id
 * Obtener un recurso por ID
 */
router.get('/:id', ResourceController.getById);

/**
 * POST /api/content/resources/:id/download
 * Registrar y preparar descarga
 */
router.post(
    '/:id/download',
    verifyToken,
    isAuthenticated,
    ResourceController.download
);

/**
 * PUT /api/content/resources/:id
 * Actualizar recurso (solo docente dueno)
 */
router.put(
    '/:id',
    verifyToken,
    isTeacher,
    uploadSingle('file'),
    ResourceController.update
);

/**
 * DELETE /api/content/resources/:id
 * Eliminar recurso (solo docente dueno)
 */
router.delete(
    '/:id',
    verifyToken,
    isTeacher,
    ResourceController.delete
);

module.exports = router;
