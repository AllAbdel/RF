const rateLimit = require('express-rate-limit');
const logger = require('../utils/logger');

// Mode développement : limites plus souples
const isDevelopment = process.env.NODE_ENV === 'development';

/**
 * Rate limiter pour les tentatives de connexion
 * Dev: 100 tentatives par 15 min | Prod: 5 tentatives par 15 minutes
 */
const loginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: isDevelopment ? 100 : 5,
  message: {
    error: 'Trop de tentatives de connexion. Veuillez réessayer dans 15 minutes.',
    remainingTime: '15 minutes'
  },
  standardHeaders: true,
  legacyHeaders: false,
  skipSuccessfulRequests: false,
  skip: (req) => isDevelopment, // Désactiver complètement en dev
  handler: (req, res) => {
    const resetTime = new Date(Date.now() + 15 * 60 * 1000);
    res.status(429).json({
      error: 'Trop de tentatives de connexion',
      message: 'Vous avez dépassé le nombre maximum de tentatives de connexion (5 en 15 minutes)',
      resetTime: resetTime.toISOString(),
      retryAfter: '15 minutes'
    });
  }
});

/**
 * Rate limiter pour l'inscription
 * Dev: Désactivé | Prod: 3 inscriptions par heure par IP
 */
const registerLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 heure
  max: isDevelopment ? 1000 : 3,
  skip: (req) => isDevelopment, // Désactiver en dev
  message: {
    error: 'Trop d\'inscriptions. Veuillez réessayer dans 1 heure.'
  },
  handler: (req, res) => {
    res.status(429).json({
      error: 'Trop d\'inscriptions',
      message: 'Vous avez dépassé le nombre maximum d\'inscriptions (3 par heure)',
      retryAfter: '1 heure'
    });
  }
});

/**
 * Rate limiter pour la réinitialisation de mot de passe
 * Dev: Désactivé | Prod: Max 3 demandes par heure par IP
 */
const passwordResetLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 heure
  max: isDevelopment ? 1000 : 3,
  skip: (req) => isDevelopment,
  message: {
    error: 'Trop de demandes de réinitialisation. Veuillez réessayer dans 1 heure.'
  },
  handler: (req, res) => {
    res.status(429).json({
      error: 'Trop de demandes',
      message: 'Vous avez dépassé le nombre maximum de demandes de réinitialisation (3 par heure)',
      retryAfter: '1 heure'
    });
  }
});

/**
 * Rate limiter pour la vérification email
 * Dev: Désactivé | Prod: Max 5 renvois par heure
 */
const emailVerificationLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 heure
  max: isDevelopment ? 1000 : 5,
  skip: (req) => isDevelopment,
  message: {
    error: 'Trop de demandes de vérification. Veuillez réessayer dans 1 heure.'
  },
  handler: (req, res) => {
    res.status(429).json({
      error: 'Trop de demandes',
      message: 'Vous avez dépassé le nombre maximum de demandes de vérification (5 par heure)',
      retryAfter: '1 heure'
    });
  }
});

/**
 * Rate limiter général pour les API sensibles
 * Dev: 1000 requêtes | Prod: Max 100 requêtes par 15 minutes
 */
const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: isDevelopment ? 1000 : 100,
  skip: (req) => isDevelopment,
  message: {
    error: 'Trop de requêtes. Veuillez ralentir.'
  },
  handler: (req, res) => {
    res.status(429).json({
      error: 'Trop de requêtes',
      message: 'Vous avez dépassé le nombre maximum de requêtes (100 en 15 minutes)',
      retryAfter: '15 minutes'
    });
  }
});

/**
 * Rate limiter strict pour les opérations sensibles (upload, delete)
 * Dev: 500 requêtes | Prod: Max 20 requêtes par 15 minutes
 */
const strictApiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: isDevelopment ? 500 : 20,
  skip: (req) => isDevelopment,
  message: {
    error: 'Trop de requêtes sensibles. Veuillez réessayer plus tard.'
  },
  handler: (req, res) => {
    res.status(429).json({
      error: 'Limite atteinte',
      message: 'Vous avez dépassé le nombre maximum d\'opérations sensibles (20 en 15 minutes)',
      retryAfter: '15 minutes'
    });
  }
});

/**
 * Enregistrer les tentatives de connexion dans la base de données
 * Pour analyse et détection de patterns suspects
 */
const logLoginAttempt = async (db, email, ipAddress, success) => {
  try {
    await db.query(
      'INSERT INTO login_attempts (email, ip_address, success) VALUES (?, ?, ?)',
      [email, ipAddress, success]
    );
    
    // Nettoyer les anciennes entrées (>30 jours)
    await db.query(
      'DELETE FROM login_attempts WHERE attempted_at < DATE_SUB(NOW(), INTERVAL 30 DAY)'
    );
  } catch (error) {
    logger.error('Erreur log tentative connexion', { error: error.message });
  }
};

/**
 * Vérifier si une IP ou un email a trop de tentatives échouées
 */
const checkSuspiciousActivity = async (db, email, ipAddress) => {
  try {
    // Vérifier les tentatives échouées dans les 30 dernières minutes
    const [results] = await db.query(
      `SELECT COUNT(*) as failed_count 
       FROM login_attempts 
       WHERE (email = ? OR ip_address = ?) 
       AND success = 0 
       AND attempted_at > DATE_SUB(NOW(), INTERVAL 30 MINUTE)`,
      [email, ipAddress]
    );
    
    const failedCount = results[0]?.failed_count || 0;
    
    // Plus de 10 tentatives échouées = activité suspecte
    if (failedCount >= 10) {
      return {
        isSuspicious: true,
        message: 'Activité suspecte détectée. Compte temporairement bloqué.',
        failedAttempts: failedCount
      };
    }
    
    return { isSuspicious: false, failedAttempts: failedCount };
  } catch (error) {
    logger.error('Erreur vérification activité suspecte', { error: error.message });
    return { isSuspicious: false, failedAttempts: 0 };
  }
};

module.exports = {
  loginLimiter,
  registerLimiter,
  passwordResetLimiter,
  emailVerificationLimiter,
  apiLimiter,
  strictApiLimiter,
  logLoginAttempt,
  checkSuspiciousActivity
};
