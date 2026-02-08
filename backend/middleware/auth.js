const jwt = require('jsonwebtoken');
const db = require('../config/database');

// Utiliser un getter pour éviter les problèmes de cache de constantes
const getJwtSecret = () => process.env.JWT_SECRET || 'dev-secret-key-change-in-production';

/**
 * Middleware d'authentification simplifié et robuste
 */
const authMiddleware = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ error: 'Token manquant' });
    }

    const token = authHeader.split(' ')[1];
    
    // Vérifier et décoder le token
    const decoded = jwt.verify(token, getJwtSecret());
    
    // Attacher l'utilisateur à la requête
    req.user = decoded;
    next();
  } catch (error) {
    console.log('❌ Auth error:', error.name, '-', error.message);
    
    if (error.name === 'TokenExpiredError') {
      return res.status(401).json({ 
        error: 'Token expiré',
        message: 'Votre session a expiré. Veuillez vous reconnecter.'
      });
    }
    
    if (error.name === 'JsonWebTokenError') {
      return res.status(401).json({ 
        error: 'Token invalide',
        message: 'Token de session invalide.'
      });
    }
    
    return res.status(401).json({ error: 'Erreur d\'authentification' });
  }
};

/**
 * Vérifie que l'utilisateur est un membre d'agence
 */
const isAgencyMember = (req, res, next) => {
  if (req.user.user_type !== 'agency_member') {
    return res.status(403).json({ error: 'Accès réservé aux membres d\'agences' });
  }
  next();
};

/**
 * Vérifie que l'utilisateur est un client
 */
const isClient = (req, res, next) => {
  if (req.user.user_type !== 'client') {
    return res.status(403).json({ error: 'Accès réservé aux clients' });
  }
  next();
};

/**
 * Vérifie que l'utilisateur est admin ou super_admin
 */
const isAgencyAdmin = (req, res, next) => {
  if (req.user.user_type !== 'agency_member' || 
      (req.user.role !== 'admin' && req.user.role !== 'super_admin')) {
    return res.status(403).json({ error: 'Accès réservé aux administrateurs' });
  }
  next();
};

/**
 * Vérifie que l'utilisateur est super_admin
 */
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
