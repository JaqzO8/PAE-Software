const express = require('express');
const router = express.Router();
const RepositoryController = require('../controllers/repositoryController');
const RatingController = require('../controllers/ratingController');
const { verifyToken, isTeacher, isAuthenticated } = require('../middlewares/authMiddleware');
const { uploadCover } = require('../middlewares/uploadMiddleware');

// ========================================
// RUTAS PÚBLICAS (sin autenticación)
// ========================================

/**
 * GET /api/content/repositories/explore
 * Explorar repositorios con filtros
 */
router.get('/explore', RepositoryController.explore);

/**
 * GET /api/content/repositories/popular
 * Repositorios más solicitados (RQ74)
 */
router.get('/popular', RepositoryController.getPopular);

/**
 * GET /api/content/repositories/destacados
 * Repositorios destacados
 */
router.get('/destacados', RepositoryController.getFeatured);

// ========================================
// RUTAS PROTEGIDAS (requieren autenticación)
// ========================================

/**
 * GET /api/content/repositories/my
 * Mis repositorios (solo docentes) - RQ13
 * ⚠️ IMPORTANTE: Esta ruta debe ir ANTES de /:id
 */
router.get('/my', verifyToken, isTeacher, RepositoryController.myRepositories);

/**
 * POST /api/content/repositories
 * Crear repositorio (solo docentes) - RQ13
 */
router.post(
    '/',
    verifyToken,
    isTeacher,
    uploadCover,
    RepositoryController.create
);

/**
 * GET /api/content/repositories/:id
 * Obtener detalles de un repositorio
 * ⚠️ Esta ruta debe ir DESPUÉS de /my para evitar que "my" sea interpretado como ID
 */
router.get('/:id', RepositoryController.getById);

/**
 * PUT /api/content/repositories/:id
 * Actualizar repositorio (solo docente dueño)
 */
router.put(
    '/:id',
    verifyToken,
    isTeacher,
    uploadCover,
    RepositoryController.update
);

/**
 * DELETE /api/content/repositories/:id
 * Eliminar repositorio (solo docente dueño)
 */
router.delete(
    '/:id',
    verifyToken,
    isTeacher,
    RepositoryController.delete
);

// ========================================
// RUTAS DE CALIFICACIONES (1-10)
// ========================================

/**
 * GET /api/content/repositories/:id/ratings
 * Ver todas las calificaciones
 */
router.get('/:id/ratings', RatingController.getRepositoryRatings);

/**
 * GET /api/content/repositories/:id/my-rating
 * Ver mi calificación
 */
router.get(
    '/:id/my-rating',
    verifyToken,
    isAuthenticated,
    RatingController.getMyRating
);

/**
 * POST /api/content/repositories/:id/rate
 * Calificar repositorio (1-10)
 */
router.post(
    '/:id/rate',
    verifyToken,
    isAuthenticated,
    RatingController.rateRepository
);

/**
 * DELETE /api/content/repositories/:id/rate
 * Eliminar mi calificación
 */
router.delete(
    '/:id/rate',
    verifyToken,
    isAuthenticated,
    RatingController.deleteRating
);

module.exports = router;