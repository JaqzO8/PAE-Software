const express = require('express');
const router = express.Router();
const MessageController = require('../controllers/messagesHttp');
const rateLimit = require('express-rate-limit');
const messageLimit = rateLimit({ windowMs: 60_000, max: 40, keyGenerator: req => String(req.user.id), message: { success: false, message: 'Espera un momento antes de enviar más mensajes' } });
const { verifyToken } = require('../middlewares/authMiddleware');
const { verifyMemberOfCommunity } = require('../middlewares/roleMiddleware');

router.get('/:id/messages', verifyToken, verifyMemberOfCommunity, MessageController.getMessages);
router.post('/:id/messages', verifyToken, verifyMemberOfCommunity, messageLimit, MessageController.sendMessage);
router.patch('/:id/messages/:messageId', verifyToken, verifyMemberOfCommunity, messageLimit, MessageController.editMessage);
router.delete('/:id/messages/:messageId', verifyToken, verifyMemberOfCommunity, MessageController.deleteMessage);

module.exports = router;
