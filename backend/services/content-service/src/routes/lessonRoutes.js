const express = require('express');
const router = express.Router();
const LessonController = require('../controllers/lessonController');
const { verifyToken, isTeacher, isAuthenticated } = require('../middlewares/authMiddleware');
const { authorizeLessonRead } = require('../middlewares/lessonAccessMiddleware');

router.get('/', verifyToken, isAuthenticated, authorizeLessonRead, LessonController.list);
router.post('/', verifyToken, isTeacher, LessonController.create);

router.get('/:id', verifyToken, isAuthenticated, authorizeLessonRead, LessonController.getById);
router.put('/:id', verifyToken, isTeacher, LessonController.update);
router.delete('/:id', verifyToken, isTeacher, LessonController.delete);

router.post('/:id/start', verifyToken, isAuthenticated, authorizeLessonRead, LessonController.start);
router.post('/:id/time', verifyToken, isAuthenticated, authorizeLessonRead, LessonController.trackTime);
router.post('/:id/complete', verifyToken, isAuthenticated, authorizeLessonRead, LessonController.complete);
router.get('/:id/summary', verifyToken, isAuthenticated, authorizeLessonRead, LessonController.summary);
router.get('/:id/solution', verifyToken, isAuthenticated, authorizeLessonRead, LessonController.solution);
router.get('/:id/concept-map', verifyToken, isAuthenticated, authorizeLessonRead, LessonController.conceptMap);
router.get('/:id/material', verifyToken, isAuthenticated, authorizeLessonRead, LessonController.downloadMaterial);

module.exports = router;
