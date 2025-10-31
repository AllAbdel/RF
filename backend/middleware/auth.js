const jwt = require('jsonwebtoken');

const authMiddleware = async (req, res, next) => {
  try {
    const token = req.headers.authorization?.split(' ')[1];
    
    if (!token) {
      return res.status(401).json({ error: 'Token manquant' });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.user = decoded;
    next();
  } catch (error) {
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
