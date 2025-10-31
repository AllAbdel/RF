const express = require('express');
const router = express.Router();
const {
  getOrCreateConversation,
  getConversations,
  getMessages,
  sendMessage
} = require('../controllers/messageController');
const { authMiddleware } = require('../middleware/auth');

router.post('/conversation', authMiddleware, getOrCreateConversation);
router.get('/conversations', authMiddleware, getConversations);
router.get('/conversation/:conversation_id', authMiddleware, getMessages);
router.post('/send', authMiddleware, sendMessage);

module.exports = router;
