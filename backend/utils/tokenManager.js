const jwt = require('jsonwebtoken');
const crypto = require('crypto');
const { v4: uuidv4 } = require('uuid');

// Utiliser des getters pour éviter les problèmes de cache de constantes
const getJwtSecret = () => process.env.JWT_SECRET || 'dev-secret-key-change-in-production';
const getJwtRefreshSecret = () => process.env.JWT_REFRESH_SECRET || 'dev-refresh-secret-key';

// Durées d'expiration
const ACCESS_TOKEN_EXPIRY = '24h'; // Réduit de 7j à 24h
const REFRESH_TOKEN_EXPIRY = '7d'; // Refresh token valide 7 jours

/**
 * Générer un access token JWT (24h)
 */
const generateAccessToken = (user) => {
  const payload = {
    id: user.id,
    email: user.email,
    user_type: user.user_type,
    agency_id: user.agency_id,
    role: user.role,
    jti: uuidv4() // JWT ID unique pour blacklist
  };
  
  return jwt.sign(payload, getJwtSecret(), { 
    expiresIn: ACCESS_TOKEN_EXPIRY 
  });
};

/**
 * Générer un refresh token (7 jours)
 */
const generateRefreshToken = (userId) => {
  const payload = {
    id: userId,
    type: 'refresh',
    jti: uuidv4()
  };
  
  return jwt.sign(payload, getJwtRefreshSecret(), { 
    expiresIn: REFRESH_TOKEN_EXPIRY 
  });
};

/**
 * Vérifier et décoder un access token
 */
const verifyAccessToken = (token) => {
  try {
    return jwt.verify(token, getJwtSecret());
  } catch (error) {
    if (error.name === 'TokenExpiredError') {
      throw new Error('Token expiré');
    }
    throw new Error('Token invalide');
  }
};

/**
 * Vérifier et décoder un refresh token
 */
const verifyRefreshToken = (token) => {
  try {
    return jwt.verify(token, getJwtRefreshSecret());
  } catch (error) {
    if (error.name === 'TokenExpiredError') {
      throw new Error('Refresh token expiré');
    }
    throw new Error('Refresh token invalide');
  }
};

/**
 * Stocker un refresh token dans la BDD
 */
const storeRefreshToken = async (db, userId, token) => {
  const decoded = jwt.decode(token);
  const expiresAt = new Date(decoded.exp * 1000);
  
  await db.query(
    'INSERT INTO refresh_tokens (user_id, token, expires_at) VALUES (?, ?, ?)',
    [userId, token, expiresAt]
  );
};

/**
 * Vérifier si un refresh token existe et est valide
 */
const validateRefreshToken = async (db, token) => {
  const [results] = await db.query(
    'SELECT * FROM refresh_tokens WHERE token = ? AND expires_at > NOW()',
    [token]
  );
  
  if (results.length === 0) {
    return { valid: false, message: 'Refresh token invalide ou expiré' };
  }
  
  // Mettre à jour last_used_at
  await db.query(
    'UPDATE refresh_tokens SET last_used_at = NOW() WHERE token = ?',
    [token]
  );
  
  return { valid: true, userId: results[0].user_id };
};

/**
 * Révoquer un refresh token
 */
const revokeRefreshToken = async (db, token) => {
  await db.query('DELETE FROM refresh_tokens WHERE token = ?', [token]);
};

/**
 * Révoquer tous les refresh tokens d'un utilisateur
 */
const revokeAllUserRefreshTokens = async (db, userId) => {
  await db.query('DELETE FROM refresh_tokens WHERE user_id = ?', [userId]);
};

/**
 * Ajouter un token à la blacklist
 */
const blacklistToken = async (db, token) => {
  try {
    const decoded = jwt.decode(token);
    if (!decoded || !decoded.jti) {
      return false;
    }
    
    const expiresAt = new Date(decoded.exp * 1000);
    
    await db.query(
      'INSERT INTO token_blacklist (token_jti, user_id, expires_at) VALUES (?, ?, ?)',
      [decoded.jti, decoded.id, expiresAt]
    );
    
    // Nettoyer les tokens expirés
    await db.query('DELETE FROM token_blacklist WHERE expires_at < NOW()');
    
    return true;
  } catch (error) {
    console.error('Erreur blacklist token:', error);
    return false;
  }
};

/**
 * Vérifier si un token est blacklisté
 */
const isTokenBlacklisted = async (db, tokenJti) => {
  const [results] = await db.query(
    'SELECT id FROM token_blacklist WHERE token_jti = ? AND expires_at > NOW()',
    [tokenJti]
  );
  
  return results.length > 0;
};

/**
 * Générer un token de vérification email (random)
 */
const generateVerificationToken = () => {
  return crypto.randomBytes(32).toString('hex');
};

/**
 * Générer un token de réinitialisation (random)
 */
const generateResetToken = () => {
  return crypto.randomBytes(32).toString('hex');
};

/**
 * Calculer la date d'expiration (+ heures)
 */
const getExpirationDate = (hours) => {
  const date = new Date();
  date.setHours(date.getHours() + hours);
  return date;
};

/**
 * Nettoyer les tokens expirés (à exécuter périodiquement)
 */
const cleanupExpiredTokens = async (db) => {
  try {
    // Nettoyer blacklist
    await db.query('DELETE FROM token_blacklist WHERE expires_at < NOW()');
    
    // Nettoyer refresh tokens
    await db.query('DELETE FROM refresh_tokens WHERE expires_at < NOW()');
    
    // Nettoyer verification tokens
    await db.query(
      'UPDATE users SET verification_token = NULL, verification_token_expires = NULL WHERE verification_token_expires < NOW()'
    );
    
    // Nettoyer reset tokens (si les colonnes existent)
    // Note: Les colonnes reset_password_token et reset_password_expires n'existent pas encore
    // await db.query(
    //   'UPDATE users SET reset_password_token = NULL, reset_password_expires = NULL WHERE reset_password_expires < NOW()'
    // );
    
    console.log('✅ Tokens expirés nettoyés');
  } catch (error) {
    console.error('❌ Erreur nettoyage tokens:', error);
  }
};

module.exports = {
  generateAccessToken,
  generateRefreshToken,
  verifyAccessToken,
  verifyRefreshToken,
  storeRefreshToken,
  validateRefreshToken,
  revokeRefreshToken,
  revokeAllUserRefreshTokens,
  blacklistToken,
  isTokenBlacklisted,
  generateVerificationToken,
  generateResetToken,
  getExpirationDate,
  cleanupExpiredTokens,
  ACCESS_TOKEN_EXPIRY,
  REFRESH_TOKEN_EXPIRY
};
