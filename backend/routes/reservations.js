const express = require('express');
const router = express.Router();
const {
  createReservation,
  getClientReservations,
  getAgencyReservations,
  updateReservationStatus,
  cancelReservation,
  updateReservation
} = require('../controllers/reservationController');
const { authMiddleware, isClient, isAgencyMember } = require('../middleware/auth');

router.post('/', authMiddleware, isClient, createReservation);
router.get('/client', authMiddleware, isClient, getClientReservations);
router.get('/agency', authMiddleware, isAgencyMember, getAgencyReservations);
router.put('/:id/status', authMiddleware, isAgencyMember, updateReservationStatus);
router.put('/:id/cancel', authMiddleware, isClient, cancelReservation);
router.put('/:id', authMiddleware, isClient, updateReservation);

module.exports = router;
