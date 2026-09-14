const express = require('express');
const router = express.Router();
const MessageController = require('../controllers/messageController');
const { verifyToken } = require('../middlewares/authMiddleware');
const { verifyMemberOfCommunity } = require('../middlewares/roleMiddleware');

router.get('/:id/messages', verifyToken, verifyMemberOfCommunity, MessageController.getMessages);
router.post('/:id/messages', verifyToken, verifyMemberOfCommunity, MessageController.sendMessage);
router.delete('/:id/messages/:messageId', verifyToken, MessageController.deleteMessage);

module.exports = router;