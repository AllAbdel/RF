const jwt = require('jsonwebtoken');
const db = require('../config/database');
const { isTokenBlacklisted } = require('../utils/tokenManager');

const authMiddleware = async (req, res, next) => {
  try {
    const token = req.headers.authorization?.split(' ')[1];
    
    if (!token) {
      return res.status(401).json({ error: 'Token manquant' });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    
    // 🆕 VÉRIFIER SI TOKEN EST BLACKLISTÉ
    if (decoded.jti) {
      const isBlacklisted = await isTokenBlacklisted(db, decoded.jti);
      if (isBlacklisted) {
        return res.status(401).json({ 
          error: 'Token révoqué',
          message: 'Votre session a expiré. Veuillez vous reconnecter.'
        });
      }
    }
    
    // 🆕 VÉRIFIER SI EMAIL EST VÉRIFIÉ (optionnel selon routes)
    if (req.path !== '/verify-email' && req.path !== '/resend-verification') {
      const [users] = await db.query('SELECT email_verified FROM users WHERE id = ?', [decoded.id]);
      if (users.length > 0 && !users[0].email_verified) {
        // On laisse passer mais on signale (certaines routes peuvent vouloir bloquer)
        req.user = { ...decoded, emailVerified: false };
        return next();
      }
    }
    
    req.user = decoded;
    next();
  } catch (error) {
    if (error.name === 'TokenExpiredError') {
      return res.status(401).json({ 
        error: 'Token expiré',
        message: 'Votre session a expiré. Veuillez vous reconnecter.'
      });
    }
    return res.status(401).json({ error: 'Token invalide' });
  }
};

const isAgencyMember = (req, res, next) => {
  if (req.user.user_type !== 'agency_member') {
    return res.status(403).json({ error: 'Accès réservé aux membres d\'agences' });
  }
  next();
};

const isClient = (req, res, next) => {
  if (req.user.user_type !== 'client') {
    return res.status(403).json({ error: 'Accès réservé aux clients' });
  }
  next();
};

const isAgencyAdmin = (req, res, next) => {
  if (req.user.user_type !== 'agency_member' || 
      (req.user.role !== 'admin' && req.user.role !== 'super_admin')) {
    return res.status(403).json({ error: 'Accès réservé aux administrateurs' });
  }
  next();
};

const isSuperAdmin = (req, res, next) => {
  if (req.user.user_type !== 'agency_member' || req.user.role !== 'super_admin') {
    return res.status(403).json({ error: 'Accès réservé aux super administrateurs' });
  }
  next();
};

module.exports = {
  authMiddleware,
  isAgencyMember,
  isClient,
  isAgencyAdmin,
  isSuperAdmin
};
