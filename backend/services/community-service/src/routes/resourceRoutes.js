const express = require('express');
const router = express.Router();
const ResourceController = require('../controllers/resourceController');
const { verifyToken } = require('../middlewares/authMiddleware');
const { verifyRole, verifyTeacherOfCommunity, verifyMemberOfCommunity } = require('../middlewares/roleMiddleware');
const { uploadSingle } = require('../middlewares/uploadMiddleware');

router.post('/:id/resources', verifyToken, verifyRole('docente'), verifyTeacherOfCommunity, uploadSingle, ResourceController.upload);
router.get('/:id/resources', verifyToken, verifyMemberOfCommunity, ResourceController.list);
router.get('/:id/resources/:resourceId/download', verifyToken, verifyMemberOfCommunity, ResourceController.download);
router.delete('/:id/resources/:resourceId', verifyToken, verifyTeacherOfCommunity, ResourceController.delete);

module.exports = router;
