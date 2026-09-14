const express = require('express');
const router = express.Router();
const PlanningController = require('../controllers/planningController');
const { verifyToken, isAuthenticated, isTeacher } = require('../middlewares/authMiddleware');

router.get('/', verifyToken, isAuthenticated, PlanningController.getOverview);
router.put('/preferences', verifyToken, isAuthenticated, PlanningController.updatePreference);
router.post('/reminders/generate', verifyToken, isAuthenticated, PlanningController.generateReminders);
router.patch('/reminders/:id/status', verifyToken, isAuthenticated, PlanningController.updateReminderStatus);
router.put('/settings', verifyToken, isTeacher, PlanningController.updateSettings);

module.exports = router;
