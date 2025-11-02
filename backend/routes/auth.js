const express = require('express');
const router = express.Router();
const multer = require('multer');
const path = require('path');
const { register, login, getProfile } = require('../controllers/authController');
const { authMiddleware } = require('../middleware/auth');

// Configuration upload pour les logos d'agence
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
    } else {
      cb(new Error('Seules les images sont autorisées'));
    }
  }
});

router.post('/register', upload.single('logo'), register);
router.post('/login', login);
router.get('/profile', authMiddleware, getProfile);

module.exports = router;