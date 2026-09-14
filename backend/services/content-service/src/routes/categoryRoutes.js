const express = require('express');
const router = express.Router();
const CategoryController = require('../controllers/categoryController');
const { verifyToken, isTeacher } = require('../middlewares/authMiddleware');

/**
 * GET /api/content/categories
 * Listar todas las categorías
 */
router.get('/', CategoryController.list);

/**
 * GET /api/content/tags
 * Listar todos los tags
 */
router.get('/tags', CategoryController.listTags);

/**
 * GET /api/content/tags/search
 * Buscar tags por nombre
 */
router.get('/tags/search', CategoryController.searchTags);

/**
 * POST /api/content/tags
 * Crear un nuevo tag (solo docentes)
 */
router.post('/tags', verifyToken, isTeacher, CategoryController.createTag);

module.exports = router;