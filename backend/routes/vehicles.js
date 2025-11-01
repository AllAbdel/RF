const express = require('express');
const router = express.Router();
const {
  getAllVehicles,
  getVehicleById,
  createVehicle,
  updateVehicle,
  deleteVehicle,
  getAgencyVehicles,
  checkAvailability
} = require('../controllers/vehicleController');
const { authMiddleware, isAgencyMember } = require('../middleware/auth');
const upload = require('../middleware/upload');

router.get('/', getAllVehicles);
router.get('/agency', authMiddleware, isAgencyMember, getAgencyVehicles);
router.get('/:id', getVehicleById);
router.get('/:id/availability', checkAvailability);
router.post('/', authMiddleware, isAgencyMember, upload.array('images', 10), createVehicle);
router.put('/:id', authMiddleware, isAgencyMember, updateVehicle);
router.delete('/:id', authMiddleware, isAgencyMember, deleteVehicle);

module.exports = router;
