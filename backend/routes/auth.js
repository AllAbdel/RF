const express = require('express');
const router = express.Router();
const multer = require('multer');
const path = require('path');
const { 
  register, 
  login, 
  getProfile,
  verifyEmail,
  resendVerificationEmail,
  requestPasswordReset,
  resetPassword,
  refreshAccessToken,
  logout,
  changePassword
} = require('../controllers/authController');
const { 
  setup2FA, 
  verify2FASetup, 
  disable2FAHandler, 
  regenerateBackupCodes,
  get2FAStatus
} = require('../controllers/twoFactorController');
const { authMiddleware } = require('../middleware/auth');
const { 
  loginLimiter, 
  registerLimiter, 
  passwordResetLimiter,
  emailVerificationLimiter
} = require('../middleware/rateLimiter');

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

router.post('/register', registerLimiter, upload.single('logo'), register);
router.post('/login', loginLimiter, login);
router.get('/profile', authMiddleware, getProfile);

// 🆕 VÉRIFICATION EMAIL
router.post('/verify-email', verifyEmail);
router.post('/resend-verification', emailVerificationLimiter, resendVerificationEmail);

// 🆕 RÉINITIALISATION MOT DE PASSE
router.post('/request-password-reset', passwordResetLimiter, requestPasswordReset);
router.post('/reset-password', resetPassword);
router.post('/change-password', authMiddleware, changePassword);

// 🆕 GESTION TOKENS
router.post('/refresh-token', refreshAccessToken);
router.post('/logout', authMiddleware, logout);

// 🆕 2FA (TWO-FACTOR AUTHENTICATION)
router.post('/2fa/setup', authMiddleware, setup2FA);
router.post('/2fa/verify-setup', authMiddleware, verify2FASetup);
router.post('/2fa/disable', authMiddleware, disable2FAHandler);
router.post('/2fa/regenerate-backup-codes', authMiddleware, regenerateBackupCodes);
router.get('/2fa/status', authMiddleware, get2FAStatus);

module.exports = router;