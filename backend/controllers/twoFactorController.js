const db = require('../config/database');
const {
  generate2FASecret,
  generateQRCode,
  verify2FAToken,
  generateBackupCodes,
  hashBackupCodes,
  enable2FA,
  disable2FA,
  is2FAEnabled
} = require('../utils/twoFactorAuth');
const { send2FAEnabledEmail } = require('../services/emailService');

/**
 * 🆕 SETUP 2FA - Générer le secret et QR code
 */
const setup2FA = async (req, res) => {
  try {
    const userId = req.user.id;

    // Vérifier si 2FA déjà activée
    const isEnabled = await is2FAEnabled(db, userId);
    if (isEnabled) {
      return res.status(400).json({ 
        error: 'La 2FA est déjà activée',
        message: 'Désactivez d\'abord la 2FA avant de la reconfigurer.'
      });
    }

    // Générer le secret
    const { secret, otpauth_url } = generate2FASecret(req.user.email);

    // Générer le QR code
    const qrCode = await generateQRCode(otpauth_url);

    // Stocker temporairement le secret (pas encore activé)
    await db.query(
      'UPDATE users SET twofa_secret = ? WHERE id = ?',
      [secret, userId]
    );

    res.json({
      message: 'Scannez ce QR code avec votre application d\'authentification',
      secret, // Pour saisie manuelle si besoin
      qrCode, // Data URL de l'image QR
      setupComplete: false
    });
  } catch (error) {
    console.error('Erreur setup 2FA:', error);
    res.status(500).json({ error: 'Erreur lors de la configuration 2FA' });
  }
};

/**
 * 🆕 VÉRIFIER ET ACTIVER 2FA
 */
const verify2FASetup = async (req, res) => {
  try {
    const { token } = req.body;
    const userId = req.user.id;

    if (!token) {
      return res.status(400).json({ error: 'Code de vérification requis' });
    }

    // Récupérer le secret
    const [users] = await db.query(
      'SELECT twofa_secret, email, first_name FROM users WHERE id = ?',
      [userId]
    );

    if (users.length === 0) {
      return res.status(404).json({ error: 'Utilisateur non trouvé' });
    }

    const user = users[0];

    if (!user.twofa_secret) {
      return res.status(400).json({ 
        error: 'Configuration 2FA non initiée',
        message: 'Appelez d\'abord /setup-2fa'
      });
    }

    // Vérifier le code
    const isValid = verify2FAToken(user.twofa_secret, token);
    if (!isValid) {
      return res.status(401).json({ 
        error: 'Code invalide',
        message: 'Le code saisi est incorrect. Réessayez.'
      });
    }

    // Générer les codes de secours
    const backupCodes = generateBackupCodes(8);
    const hashedCodes = await hashBackupCodes(backupCodes);

    // Activer la 2FA
    await enable2FA(db, userId, user.twofa_secret, JSON.stringify(hashedCodes));

    // Envoyer email de confirmation
    await send2FAEnabledEmail(user.email, user.first_name);

    res.json({
      message: '2FA activée avec succès !',
      success: true,
      backupCodes, // IMPORTANT : L'utilisateur doit les sauvegarder
      warning: 'Sauvegardez ces codes de secours en lieu sûr. Ils ne seront plus affichés.'
    });
  } catch (error) {
    console.error('Erreur vérification 2FA:', error);
    res.status(500).json({ error: 'Erreur lors de la vérification 2FA' });
  }
};

/**
 * 🆕 DÉSACTIVER 2FA
 */
const disable2FAHandler = async (req, res) => {
  try {
    const { password, token } = req.body;
    const userId = req.user.id;

    if (!password || !token) {
      return res.status(400).json({ 
        error: 'Mot de passe et code 2FA requis',
        message: 'Pour désactiver la 2FA, vous devez fournir votre mot de passe et un code 2FA valide.'
      });
    }

    // Récupérer l'utilisateur
    const [users] = await db.query('SELECT * FROM users WHERE id = ?', [userId]);
    if (users.length === 0) {
      return res.status(404).json({ error: 'Utilisateur non trouvé' });
    }

    const user = users[0];

    // Vérifier le mot de passe
    const bcrypt = require('bcryptjs');
    const isValidPassword = await bcrypt.compare(password, user.password);
    if (!isValidPassword) {
      return res.status(401).json({ error: 'Mot de passe incorrect' });
    }

    // Vérifier le code 2FA
    const isValid = verify2FAToken(user.twofa_secret, token);
    if (!isValid) {
      return res.status(401).json({ error: 'Code 2FA invalide' });
    }

    // Désactiver la 2FA
    await disable2FA(db, userId);

    res.json({
      message: '2FA désactivée avec succès',
      success: true
    });
  } catch (error) {
    console.error('Erreur désactivation 2FA:', error);
    res.status(500).json({ error: 'Erreur lors de la désactivation 2FA' });
  }
};

/**
 * 🆕 GÉNÉRER NOUVEAUX CODES DE SECOURS
 */
const regenerateBackupCodes = async (req, res) => {
  try {
    const { password } = req.body;
    const userId = req.user.id;

    if (!password) {
      return res.status(400).json({ error: 'Mot de passe requis' });
    }

    // Récupérer l'utilisateur
    const [users] = await db.query('SELECT * FROM users WHERE id = ?', [userId]);
    if (users.length === 0) {
      return res.status(404).json({ error: 'Utilisateur non trouvé' });
    }

    const user = users[0];

    // Vérifier le mot de passe
    const bcrypt = require('bcryptjs');
    const isValidPassword = await bcrypt.compare(password, user.password);
    if (!isValidPassword) {
      return res.status(401).json({ error: 'Mot de passe incorrect' });
    }

    // Vérifier que 2FA est activée
    if (!user.twofa_enabled) {
      return res.status(400).json({ 
        error: '2FA non activée',
        message: 'Activez d\'abord la 2FA avant de générer des codes de secours.'
      });
    }

    // Générer nouveaux codes
    const backupCodes = generateBackupCodes(8);
    const hashedCodes = await hashBackupCodes(backupCodes);

    // Mettre à jour
    await db.query(
      'UPDATE users SET twofa_backup_codes = ? WHERE id = ?',
      [JSON.stringify(hashedCodes), userId]
    );

    res.json({
      message: 'Nouveaux codes de secours générés',
      backupCodes,
      warning: 'Les anciens codes ne sont plus valides. Sauvegardez ces nouveaux codes.'
    });
  } catch (error) {
    console.error('Erreur régénération codes:', error);
    res.status(500).json({ error: 'Erreur lors de la régénération des codes' });
  }
};

/**
 * 🆕 VÉRIFIER STATUT 2FA
 */
const get2FAStatus = async (req, res) => {
  try {
    const userId = req.user.id;

    const [users] = await db.query(
      'SELECT twofa_enabled, twofa_backup_codes FROM users WHERE id = ?',
      [userId]
    );

    if (users.length === 0) {
      return res.status(404).json({ error: 'Utilisateur non trouvé' });
    }

    const user = users[0];
    
    // Compter les codes de secours restants
    let remainingCodes = 0;
    if (user.twofa_backup_codes) {
      try {
        const codes = JSON.parse(user.twofa_backup_codes);
        remainingCodes = codes.length;
      } catch (e) {
        remainingCodes = 0;
      }
    }

    res.json({
      enabled: user.twofa_enabled === 1,
      remainingBackupCodes: remainingCodes,
      warningLowCodes: remainingCodes < 3 && remainingCodes > 0
    });
  } catch (error) {
    console.error('Erreur statut 2FA:', error);
    res.status(500).json({ error: 'Erreur lors de la récupération du statut 2FA' });
  }
};

module.exports = {
  setup2FA,
  verify2FASetup,
  disable2FAHandler,
  regenerateBackupCodes,
  get2FAStatus
};
