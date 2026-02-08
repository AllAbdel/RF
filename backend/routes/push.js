const express = require('express');
const router = express.Router();
const { authMiddleware } = require('../middleware/auth');
const {
  getVapidPublicKey,
  subscribe,
  unsubscribe,
  testNotification,
  getSubscriptionStatus
} = require('../controllers/pushController');

// Route publique pour récupérer la clé VAPID
router.get('/vapid-public-key', getVapidPublicKey);

// Routes authentifiées
router.use(authMiddleware);

// GET /api/push/status - Vérifier le statut d'abonnement
router.get('/status', getSubscriptionStatus);

// POST /api/push/subscribe - S'abonner aux notifications
router.post('/subscribe', subscribe);

// POST /api/push/unsubscribe - Se désabonner
router.post('/unsubscribe', unsubscribe);

// POST /api/push/test - Tester l'envoi
router.post('/test', testNotification);

module.exports = router;
