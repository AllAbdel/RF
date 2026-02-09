const express = require('express');
const router = express.Router();
const path = require('path');
const {
  getAllVehicles,
  getVehicleById,
  createVehicle,
  updateVehicle,
  deleteVehicle,
  getAgencyVehicles,
  checkAvailability,
  getVehicleLocations
} = require('../controllers/vehicleController');
const { authMiddleware, isAgencyMember } = require('../middleware/auth');
const { uploadVehicleImages, uploadVehicleTermsPdf } = require('../middleware/upload');

// Middleware pour gérer à la fois images et PDF
const multer = require('multer');
const uploadVehicleFiles = multer({
  storage: multer.diskStorage({
    destination: (req, file, cb) => {
      if (file.fieldname === 'terms_pdf') {
        cb(null, path.join(__dirname, '..', 'uploads', 'vehicles', 'terms'));
      } else {
        cb(null, path.join(__dirname, '..', 'uploads', 'vehicles'));
      }
    },
    filename: (req, file, cb) => {
      const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
      const prefix = file.fieldname === 'terms_pdf' ? 'terms-' : 'vehicle-';
      cb(null, prefix + uniqueSuffix + path.extname(file.originalname));
    }
  }),
  limits: { fileSize: 10 * 1024 * 1024 },
  fileFilter: (req, file, cb) => {
    console.log('📁 Multer processing file:', file.fieldname, file.originalname);
    cb(null, true);
  }
}).fields([
  { name: 'images', maxCount: 10 },
  { name: 'terms_pdf', maxCount: 1 }
]);

// Wrapper pour capturer les erreurs multer
const handleUpload = (req, res, next) => {
  uploadVehicleFiles(req, res, (err) => {
    if (err) {
      console.error('❌ Multer error:', err);
      return res.status(400).json({ error: 'Erreur upload: ' + err.message });
    }
    next();
  });
};

router.get('/', getAllVehicles);
router.get('/locations', getVehicleLocations);
router.get('/agency', authMiddleware, isAgencyMember, getAgencyVehicles);
router.get('/:id', getVehicleById);
router.get('/:id/availability', checkAvailability);
router.post('/', authMiddleware, isAgencyMember, handleUpload, createVehicle);
router.put('/:id', authMiddleware, isAgencyMember, handleUpload, updateVehicle);
router.delete('/:id', authMiddleware, isAgencyMember, deleteVehicle);

module.exports = router;
