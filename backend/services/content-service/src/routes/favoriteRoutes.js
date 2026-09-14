const express = require('express');
const router = express.Router();
const FavoriteController = require('../controllers/favoriteController');
const { verifyToken, isAuthenticated } = require('../middlewares/authMiddleware');

/**
 * GET /api/content/favorites
 */
router.get('/', verifyToken, isAuthenticated, FavoriteController.list);

/**
 * GET /api/content/favorites/check/:id
 */
router.get('/check/:id', verifyToken, isAuthenticated, FavoriteController.check);

/**
 * POST /api/content/favorites/:id
 */
router.post('/:id', verifyToken, isAuthenticated, FavoriteController.add);

/**
 * DELETE /api/content/favorites/:id
 */
router.delete('/:id', verifyToken, isAuthenticated, FavoriteController.remove);

module.exports = router;
