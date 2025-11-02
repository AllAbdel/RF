const express = require('express');
const router = express.Router();
const multer = require('multer');
const path = require('path');
const {
  getOrCreateConversation,
  getConversations,
  getMessages,
  sendMessage
} = require('../controllers/messageController');
const { authMiddleware } = require('../middleware/auth');

// Configuration upload pour les fichiers de messagerie
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, 'uploads/messages/');
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, 'message-' + uniqueSuffix + path.extname(file.originalname));
  }
});

const upload = multer({
  storage: storage,
  limits: { fileSize: 10 * 1024 * 1024 }, // 10MB max
  fileFilter: (req, file, cb) => {
    // Accepter tous types de fichiers
    cb(null, true);
  }
});

router.post('/conversation', authMiddleware, getOrCreateConversation);
router.get('/conversations', authMiddleware, getConversations);
router.get('/conversation/:conversation_id', authMiddleware, getMessages);
router.post('/send', authMiddleware, upload.single('file'), sendMessage);

module.exports = router;