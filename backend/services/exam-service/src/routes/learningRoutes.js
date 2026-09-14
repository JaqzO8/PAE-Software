const express = require('express');
const router = express.Router();
const LearningController = require('../controllers/learningController');
const GamificationController = require('../controllers/gamificationController');
const { verifyToken, isTeacher } = require('../middlewares/authMiddleware');

router.get('/universities', verifyToken, LearningController.getUniversities);
router.post('/simulacro/start', verifyToken, LearningController.startSimulacro);
router.post('/simulacro/submit', verifyToken, LearningController.submitSimulacro);
router.get('/simulacro/results', verifyToken, LearningController.getMyResults);
router.get('/analytics/summary', verifyToken, LearningController.getLearningAnalytics);
router.get('/analytics/settings', verifyToken, isTeacher, LearningController.getAnalyticsSettings);
router.put('/analytics/settings', verifyToken, isTeacher, LearningController.updateAnalyticsSettings);
router.get('/achievements', verifyToken, LearningController.listAchievements);
router.get('/notifications', verifyToken, LearningController.listNotifications);
router.patch('/notifications/:id/read', verifyToken, LearningController.markNotificationRead);

router.get('/gamification/summary', verifyToken, GamificationController.getSummary);
router.get('/gamification/leaderboard', verifyToken, GamificationController.getLeaderboard);
router.post('/gamification/onboarding/:stepId/complete', verifyToken, GamificationController.completeOnboardingStep);
router.get('/gamification/settings', verifyToken, isTeacher, GamificationController.getSettings);
router.put('/gamification/settings', verifyToken, isTeacher, GamificationController.updateSettings);

router.get('/questions', verifyToken, LearningController.listQuestions);
router.post('/questions', verifyToken, isTeacher, LearningController.createQuestion);
router.post('/questions/import', verifyToken, isTeacher, LearningController.importQuestions);
router.get('/questions/export', verifyToken, isTeacher, LearningController.exportQuestions);
router.get('/questions/saved', verifyToken, LearningController.listSavedQuestions);
router.post('/questions/:id/save', verifyToken, LearningController.saveQuestion);
router.delete('/questions/:id/save', verifyToken, LearningController.deleteSavedQuestion);

router.get('/reviews/open', verifyToken, isTeacher, LearningController.listOpenAnswerReviews);
router.post('/reviews/:attemptId/questions/:questionId', verifyToken, isTeacher, LearningController.reviewOpenAnswer);

router.get('/challenges/rooms', verifyToken, LearningController.listChallengeRooms);
router.post('/challenges/rooms', verifyToken, LearningController.createChallengeRoom);
router.post('/challenges/rooms/:id/join', verifyToken, LearningController.joinChallengeRoom);
router.post('/challenges/rooms/:id/leave', verifyToken, LearningController.leaveChallengeRoom);
router.get('/challenges/rooms/:id/match', verifyToken, LearningController.getChallengeMatch);
router.post('/challenges/rooms/:id/match/start', verifyToken, LearningController.startChallengeMatch);
router.post('/challenges/rooms/:id/match/answer', verifyToken, LearningController.answerChallengeQuestion);
router.post('/challenges/rooms/:id/match/next', verifyToken, LearningController.nextChallengeQuestion);

router.get('/trivia/daily', verifyToken, LearningController.getDailyTrivia);
router.get('/trivia/rooms', verifyToken, LearningController.listTriviaRooms);
router.post('/trivia/rooms', verifyToken, LearningController.createTriviaRoom);
router.post('/trivia/rooms/:id/join', verifyToken, LearningController.joinTriviaRoom);
router.get('/trivia/rooms/:id/match', verifyToken, LearningController.getTriviaMatch);
router.post('/trivia/rooms/:id/match/start', verifyToken, LearningController.startTriviaMatch);
router.post('/trivia/rooms/:id/match/answer', verifyToken, LearningController.answerTriviaQuestion);
router.post('/trivia/rooms/:id/match/next', verifyToken, LearningController.nextTriviaQuestion);

module.exports = router;
