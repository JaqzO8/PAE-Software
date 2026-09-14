// backend/services/content-service/src/routes/statsRoutes.js
const express = require('express');
const router = express.Router();
const StatsController = require('../controllers/statsController');
const { verifyToken, isAuthenticated, isTeacher } = require('../middlewares/authMiddleware');

/**
 * GET /api/content/stats/student
 * Estadísticas del estudiante
 */
router.get('/student', verifyToken, isAuthenticated, StatsController.getStudentStats);

/**
 * GET /api/content/stats/teacher
 * Estadísticas del docente
 */
router.get('/teacher', verifyToken, isTeacher, StatsController.getTeacherStats);
router.get('/study-settings', verifyToken, isTeacher, StatsController.getStudySettings);
router.put('/study-settings', verifyToken, isTeacher, StatsController.updateStudySettings);

module.exports = router;
