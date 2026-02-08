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
 * Vérifie que l'utilisateur est un membre d'agence et enrichit avec les données DB
 */
const isAgencyMember = async (req, res, next) => {
  try {
    if (req.user.user_type !== 'agency_member') {
      return res.status(403).json({ error: 'Accès réservé aux membres d\'agences' });
    }
    
    // Récupérer les données à jour depuis la DB (agency_id peut avoir changé après join)
    const [users] = await db.query(
      'SELECT id, agency_id, role FROM users WHERE id = ?',
      [req.user.id]
    );
    
    if (users.length === 0) {
      return res.status(401).json({ error: 'Utilisateur non trouvé' });
    }
    
    // Mettre à jour les données dans req.user avec les valeurs actuelles de la DB
    req.user.agency_id = users[0].agency_id;
    req.user.role = users[0].role;
    
    if (!req.user.agency_id) {
      return res.status(403).json({ error: 'Vous n\'êtes pas encore associé à une agence' });
    }
    
    next();
  } catch (error) {
    console.error('❌ isAgencyMember error:', error);
    return res.status(500).json({ error: 'Erreur vérification membre agence' });
  }
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
