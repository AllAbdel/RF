const express = require('express');
const router = express.Router();
const {
  createReview,
  getVehicleReviews,
  getNotifications,
  markNotificationAsRead,
  markAllNotificationsAsRead,
  getUnreadCount
} = require('../controllers/reviewController');
const { authMiddleware, isClient } = require('../middleware/auth');

// Routes des avis
router.post('/review', authMiddleware, isClient, createReview);
router.get('/reviews/:vehicle_id', getVehicleReviews);

// Routes des notifications
router.get('/notifications', authMiddleware, getNotifications);
router.get('/notifications/unread-count', authMiddleware, getUnreadCount);
router.put('/notifications/:id/read', authMiddleware, markNotificationAsRead);
router.put('/notifications/read-all', authMiddleware, markAllNotificationsAsRead);

module.exports = router;
