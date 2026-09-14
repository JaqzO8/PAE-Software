const express = require('express');
const router = express.Router();
const ResourceController = require('../controllers/resourceController');
const { verifyToken } = require('../middlewares/authMiddleware');
const { verifyRole, verifyTeacherOfCommunity } = require('../middlewares/roleMiddleware');
const { uploadSingle } = require('../middlewares/uploadMiddleware');

router.post('/:id/resources', verifyToken, verifyRole('docente'), uploadSingle, ResourceController.upload);
router.get('/:id/resources', verifyToken, ResourceController.list);
router.delete('/:id/resources/:resourceId', verifyToken, verifyTeacherOfCommunity, ResourceController.delete);

module.exports = router;