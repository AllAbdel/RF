const speakeasy = require('speakeasy');
const QRCode = require('qrcode');
const crypto = require('crypto');

/**
 * Générer un secret 2FA pour un utilisateur
 */
const generate2FASecret = (userEmail, appName = 'RentFlow') => {
  const secret = speakeasy.generateSecret({
    name: `${appName} (${userEmail})`,
    length: 32
  });
  
  return {
    secret: secret.base32,
    otpauth_url: secret.otpauth_url
  };
};

/**
 * Générer un QR code pour la configuration 2FA
 */
const generateQRCode = async (otpauth_url) => {
  try {
    const qrCodeDataURL = await QRCode.toDataURL(otpauth_url);
    return qrCodeDataURL;
  } catch (error) {
    console.error('Erreur génération QR code:', error);
    throw new Error('Impossible de générer le QR code');
  }
};

/**
 * Vérifier un code TOTP
 */
const verify2FAToken = (secret, token) => {
  return speakeasy.totp.verify({
    secret: secret,
    encoding: 'base32',
    token: token,
    window: 2 // Accepte les codes dans une fenêtre de ±2 (60 secondes)
  });
};

/**
 * Générer des codes de secours (backup codes)
 * 8 codes de 8 caractères chacun
 */
const generateBackupCodes = (count = 8) => {
  const codes = [];
  
  for (let i = 0; i < count; i++) {
    const code = crypto.randomBytes(4).toString('hex').toUpperCase();
    // Format: XXXX-XXXX
    const formattedCode = `${code.slice(0, 4)}-${code.slice(4, 8)}`;
    codes.push(formattedCode);
  }
  
  return codes;
};

/**
 * Hasher les codes de secours avant stockage
 */
const hashBackupCodes = async (codes) => {
  const bcrypt = require('bcryptjs');
  const hashedCodes = [];
  
  for (const code of codes) {
    const hash = await bcrypt.hash(code, 10);
    hashedCodes.push(hash);
  }
  
  return hashedCodes;
};

/**
 * Vérifier un code de secours
 */
const verifyBackupCode = async (code, hashedCodes) => {
  const bcrypt = require('bcryptjs');
  
  if (!hashedCodes || hashedCodes.length === 0) {
    return { valid: false, remainingCodes: 0 };
  }
  
  // hashedCodes est stocké en JSON
  const codes = typeof hashedCodes === 'string' ? JSON.parse(hashedCodes) : hashedCodes;
  
  for (let i = 0; i < codes.length; i++) {
    const isValid = await bcrypt.compare(code, codes[i]);
    if (isValid) {
      // Retirer le code utilisé
      codes.splice(i, 1);
      return {
        valid: true,
        remainingCodes: codes.length,
        updatedCodes: JSON.stringify(codes)
      };
    }
  }
  
  return { valid: false, remainingCodes: codes.length };
};

/**
 * Activer la 2FA pour un utilisateur
 */
const enable2FA = async (db, userId, secret, backupCodes) => {
  try {
    await db.query(
      `UPDATE users 
       SET twofa_secret = ?, 
           twofa_enabled = TRUE, 
           twofa_backup_codes = ? 
       WHERE id = ?`,
      [secret, backupCodes, userId]
    );
    
    return true;
  } catch (error) {
    console.error('Erreur activation 2FA:', error);
    throw error;
  }
};

/**
 * Désactiver la 2FA pour un utilisateur
 */
const disable2FA = async (db, userId) => {
  try {
    await db.query(
      `UPDATE users 
       SET twofa_secret = NULL, 
           twofa_enabled = FALSE, 
           twofa_backup_codes = NULL 
       WHERE id = ?`,
      [userId]
    );
    
    return true;
  } catch (error) {
    console.error('Erreur désactivation 2FA:', error);
    throw error;
  }
};

/**
 * Vérifier si un utilisateur a la 2FA activée
 */
const is2FAEnabled = async (db, userId) => {
  try {
    const [results] = await db.query(
      'SELECT twofa_enabled FROM users WHERE id = ?',
      [userId]
    );
    
    return results.length > 0 && results[0].twofa_enabled === 1;
  } catch (error) {
    console.error('Erreur vérification 2FA:', error);
    return false;
  }
};

/**
 * Récupérer le secret 2FA d'un utilisateur
 */
const get2FASecret = async (db, userId) => {
  try {
    const [results] = await db.query(
      'SELECT twofa_secret, twofa_backup_codes FROM users WHERE id = ?',
      [userId]
    );
    
    if (results.length === 0) {
      return null;
    }
    
    return {
      secret: results[0].twofa_secret,
      backupCodes: results[0].twofa_backup_codes
    };
  } catch (error) {
    console.error('Erreur récupération secret 2FA:', error);
    return null;
  }
};

/**
 * Mettre à jour les codes de secours après utilisation
 */
const updateBackupCodes = async (db, userId, updatedCodes) => {
  try {
    await db.query(
      'UPDATE users SET twofa_backup_codes = ? WHERE id = ?',
      [updatedCodes, userId]
    );
    
    return true;
  } catch (error) {
    console.error('Erreur mise à jour codes secours:', error);
    return false;
  }
};

/**
 * Vérifier l'authentification 2FA (TOTP ou backup code)
 */
const verify2FAAuthentication = async (db, userId, code) => {
  try {
    const data = await get2FASecret(db, userId);
    
    if (!data) {
      return { valid: false, message: '2FA non configurée' };
    }
    
    // Essayer d'abord avec TOTP
    const totpValid = verify2FAToken(data.secret, code);
    if (totpValid) {
      return { valid: true, method: 'totp' };
    }
    
    // Si TOTP échoue, essayer avec backup code
    const backupResult = await verifyBackupCode(code, data.backupCodes);
    if (backupResult.valid) {
      // Mettre à jour les codes de secours
      await updateBackupCodes(db, userId, backupResult.updatedCodes);
      
      return {
        valid: true,
        method: 'backup',
        remainingCodes: backupResult.remainingCodes,
        warning: backupResult.remainingCodes === 0 ? 'Plus de codes de secours disponibles' : null
      };
    }
    
    return { valid: false, message: 'Code invalide' };
  } catch (error) {
    console.error('Erreur vérification 2FA:', error);
    return { valid: false, message: 'Erreur de vérification' };
  }
};

module.exports = {
  generate2FASecret,
  generateQRCode,
  verify2FAToken,
  generateBackupCodes,
  hashBackupCodes,
  verifyBackupCode,
  enable2FA,
  disable2FA,
  is2FAEnabled,
  get2FASecret,
  updateBackupCodes,
  verify2FAAuthentication
};
