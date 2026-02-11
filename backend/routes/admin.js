const express = require('express');
const router = express.Router();
const multer = require('multer');
const path = require('path');
const { authMiddleware, isSiteAdmin } = require('../middleware/auth');
const {
  getAgencyRequests,
  approveAgencyRequest,
  rejectAgencyRequest,
  getSiteStats,
  getMyAgencyRequest,
  submitAgencyRequest
} = require('../controllers/siteAdminController');

// Configuration upload pour les logos d'agence (demande de création)
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, 'uploads/agencies/');
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, 'agency-logo-' + uniqueSuffix + path.extname(file.originalname));
  }
});

const upload = multer({
  storage: storage,
  limits: { fileSize: 5 * 1024 * 1024 },
  fileFilter: (req, file, cb) => {
    const allowedTypes = /jpeg|jpg|png|webp/;
    const extname = allowedTypes.test(path.extname(file.originalname).toLowerCase());
    const mimetype = allowedTypes.test(file.mimetype);
    if (mimetype && extname) {
      return cb(null, true);
    }
    cb(new Error('Seules les images sont autorisées'));
  }
});

// Routes admin du site (protégées par isSiteAdmin)
router.get('/stats', authMiddleware, isSiteAdmin, getSiteStats);
router.get('/agency-requests', authMiddleware, isSiteAdmin, getAgencyRequests);
router.post('/agency-requests/:request_id/approve', authMiddleware, isSiteAdmin, approveAgencyRequest);
router.post('/agency-requests/:request_id/reject', authMiddleware, isSiteAdmin, rejectAgencyRequest);

// Routes utilisateur (soumettre/voir sa demande)
router.get('/my-agency-request', authMiddleware, getMyAgencyRequest);
router.post('/agency-request', authMiddleware, upload.single('logo'), submitAgencyRequest);

module.exports = router;
