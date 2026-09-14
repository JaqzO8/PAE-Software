const express = require('express');
const router = express.Router();
const CommunityController = require('../controllers/communityController');
const { verifyToken } = require('../middlewares/authMiddleware');
const { verifyRole, verifyTeacherOfCommunity } = require('../middlewares/roleMiddleware');

router.post('/create', verifyToken, verifyRole('docente'), CommunityController.create);
router.get('/my-communities', verifyToken, CommunityController.getMyCommunities);
router.get('/explore', verifyToken, CommunityController.explore);
router.get('/:id', verifyToken, CommunityController.getDetail);
router.post('/:id/join', verifyToken, CommunityController.join);
router.post('/:id/leave', verifyToken, CommunityController.leave);
router.delete('/:id', verifyToken, verifyTeacherOfCommunity, CommunityController.delete);
router.post('/:id/kick/:userId', verifyToken, verifyTeacherOfCommunity, CommunityController.kickMember);

module.exports = router;