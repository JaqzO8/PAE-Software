const express = require('express');
const router = express.Router();
const LessonController = require('../controllers/lessonController');
const { verifyToken, isTeacher, isAuthenticated } = require('../middlewares/authMiddleware');

router.get('/', verifyToken, isAuthenticated, LessonController.list);
router.post('/', verifyToken, isTeacher, LessonController.create);

router.get('/:id', verifyToken, isAuthenticated, LessonController.getById);
router.put('/:id', verifyToken, isTeacher, LessonController.update);
router.delete('/:id', verifyToken, isTeacher, LessonController.delete);

router.post('/:id/start', verifyToken, isAuthenticated, LessonController.start);
router.post('/:id/time', verifyToken, isAuthenticated, LessonController.trackTime);
router.post('/:id/complete', verifyToken, isAuthenticated, LessonController.complete);
router.get('/:id/summary', verifyToken, isAuthenticated, LessonController.summary);
router.get('/:id/solution', verifyToken, isAuthenticated, LessonController.solution);
router.get('/:id/concept-map', verifyToken, isAuthenticated, LessonController.conceptMap);
router.get('/:id/material', verifyToken, isAuthenticated, LessonController.downloadMaterial);

module.exports = router;
