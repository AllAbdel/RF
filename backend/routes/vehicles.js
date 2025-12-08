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
const { uploadVehicleImages, uploadVehicleTermsPdf } = require('../middleware/upload');

// Middleware pour gérer à la fois images et PDF
const multer = require('multer');
const uploadVehicleFiles = multer({
  storage: multer.diskStorage({
    destination: (req, file, cb) => {
      if (file.fieldname === 'terms_pdf') {
        cb(null, 'uploads/vehicles/terms/');
      } else {
        cb(null, 'uploads/vehicles/');
      }
    },
    filename: (req, file, cb) => {
      const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
      const prefix = file.fieldname === 'terms_pdf' ? 'terms-' : 'vehicle-';
      cb(null, prefix + uniqueSuffix + require('path').extname(file.originalname));
    }
  }),
  limits: { fileSize: 10 * 1024 * 1024 }
}).fields([
  { name: 'images', maxCount: 10 },
  { name: 'terms_pdf', maxCount: 1 }
]);

router.get('/', getAllVehicles);
router.get('/agency', authMiddleware, isAgencyMember, getAgencyVehicles);
router.get('/:id', getVehicleById);
router.get('/:id/availability', checkAvailability);
router.post('/', authMiddleware, isAgencyMember, uploadVehicleFiles, createVehicle);
router.put('/:id', authMiddleware, isAgencyMember, uploadVehicleFiles, updateVehicle);
router.delete('/:id', authMiddleware, isAgencyMember, deleteVehicle);

module.exports = router;
