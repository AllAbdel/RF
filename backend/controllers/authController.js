const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const db = require('../config/database');
const { validatePasswordStrength, checkPasswordHistory, addToPasswordHistory } = require('../utils/passwordValidator');
const { 
  generateAccessToken, 
  generateRefreshToken, 
  verifyRefreshToken,
  storeRefreshToken, 
  validateRefreshToken,
  revokeRefreshToken,
  revokeAllUserRefreshTokens,
  blacklistToken,
  isTokenBlacklisted,
  generateVerificationToken,
  generateResetToken,
  getExpirationDate
} = require('../utils/tokenManager');
const { 
  sendVerificationEmail, 
  sendPasswordResetEmail, 
  sendPasswordResetConfirmation 
} = require('../services/emailService');
const { logLoginAttempt, checkSuspiciousActivity } = require('../middleware/rateLimiter');

const register = async (req, res) => {
  try {
    const { email, password, first_name, last_name, phone, birth_date, license_date, user_type, agency_name, pending_agency_join } = req.body;

    // Vérifier si l'utilisateur existe déjà
    const [existingUser] = await db.query('SELECT id FROM users WHERE email = ?', [email]);
    if (existingUser.length > 0) {
      return res.status(400).json({ error: 'Cet email est déjà utilisé' });
    }

    // 🆕 VALIDATION FORCE DU MOT DE PASSE
    const passwordValidation = validatePasswordStrength(password);
    if (!passwordValidation.isValid) {
      return res.status(400).json({ 
        error: 'Mot de passe trop faible',
        details: passwordValidation.errors,
        strength: passwordValidation.strength
      });
    }

    // Validation pour les clients : âge minimum et permis (sauf si c'est une demande d'adhésion à une agence)
    if (user_type === 'client' && pending_agency_join !== 'true') {
      if (!birth_date || !license_date) {
        return res.status(400).json({ error: 'La date de naissance et la date d\'obtention du permis sont obligatoires pour les clients' });
      }

      const today = new Date();
      const birthDateObj = new Date(birth_date);
      const licenseDateObj = new Date(license_date);
      
      // Calculer l'âge
      let age = today.getFullYear() - birthDateObj.getFullYear();
      const monthDiff = today.getMonth() - birthDateObj.getMonth();
      if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDateObj.getDate())) {
        age--;
      }

      // Vérifier l'âge minimum (18 ans)
      if (age < 18) {
        return res.status(400).json({ error: 'Vous devez avoir au moins 18 ans pour vous inscrire' });
      }

      // Vérifier que la date du permis n'est pas dans le futur
      if (licenseDateObj > today) {
        return res.status(400).json({ error: 'La date d\'obtention du permis ne peut pas être dans le futur' });
      }

      // Vérifier que la date du permis est après la date de naissance
      if (licenseDateObj <= birthDateObj) {
        return res.status(400).json({ error: 'La date d\'obtention du permis doit être après votre date de naissance' });
      }
    }

    // Hasher le mot de passe
    const hashedPassword = await bcrypt.hash(password, 10);

    let agencyId = null;

    // Si c'est un membre d'agence, créer l'agence
    if (user_type === 'agency_member') {
      const logoPath = req.file ? `/uploads/agencies/${req.file.filename}` : null;
      const [agencyResult] = await db.query(
        'INSERT INTO agencies (name, email, logo) VALUES (?, ?, ?)',
        [agency_name, email, logoPath]
      );
      agencyId = agencyResult.insertId;
    }

    // 🆕 GÉNÉRATION TOKEN DE VÉRIFICATION EMAIL
    const verificationToken = generateVerificationToken();
    const verificationExpires = getExpirationDate(24); // Expire dans 24h
    
    // En développement, on vérifie automatiquement l'email
    const isDevelopment = process.env.NODE_ENV !== 'production';
    const emailVerified = isDevelopment ? true : false;

    // Créer l'utilisateur
    const [result] = await db.query(
      `INSERT INTO users (
        email, password, first_name, last_name, phone, birth_date, license_date, 
        user_type, agency_id, role, email_verified, verification_token, verification_token_expires
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        email, hashedPassword, first_name, last_name, phone, 
        birth_date || null, license_date || null, user_type, agencyId, 
        user_type === 'agency_member' ? 'super_admin' : 'member',
        emailVerified, verificationToken, verificationExpires
      ]
    );

    const userId = result.insertId;

    // 🆕 AJOUTER MOT DE PASSE À L'HISTORIQUE
    await addToPasswordHistory(db, userId, hashedPassword);

    // 🆕 ENVOYER EMAIL DE VÉRIFICATION (uniquement en production)
    if (!isDevelopment) {
      try {
        await sendVerificationEmail(email, first_name, verificationToken);
        console.log(`✅ Email de vérification envoyé à ${email}`);
      } catch (emailError) {
        console.error('⚠️ Erreur envoi email vérification:', emailError);
      }
    } else {
      console.log(`🔧 MODE DEV: Email auto-vérifié pour ${email}`);
    }

    // 🆕 GÉNÉRER ACCESS TOKEN ET REFRESH TOKEN
    const user = {
      id: userId,
      email,
      user_type,
      agency_id: agencyId,
      role: user_type === 'agency_member' ? 'super_admin' : 'member'
    };
    
    const accessToken = generateAccessToken(user);
    const refreshToken = generateRefreshToken(userId);
    
    // Stocker le refresh token
    await storeRefreshToken(db, userId, refreshToken);

    res.status(201).json({
      message: isDevelopment 
        ? 'Inscription réussie ! Vous pouvez maintenant vous connecter.'
        : 'Inscription réussie ! Veuillez vérifier votre email pour activer votre compte.',
      accessToken,
      refreshToken,
      emailVerificationRequired: !isDevelopment,
      user: {
        id: userId,
        email,
        first_name,
        last_name,
        user_type,
        agency_id: agencyId,
        role: user.role,
        email_verified: emailVerified
      }
    });
  } catch (error) {
    console.error('Erreur inscription:', error);
    res.status(500).json({ error: 'Erreur lors de l\'inscription' });
  }
};

const login = async (req, res) => {
  try {
    const { email, password, user_type, twofa_code } = req.body;
    const ipAddress = req.ip || req.connection.remoteAddress;

    // 🆕 VÉRIFIER ACTIVITÉ SUSPECTE
    const suspiciousCheck = await checkSuspiciousActivity(db, email, ipAddress);
    if (suspiciousCheck.isSuspicious) {
      return res.status(429).json({ 
        error: 'Compte temporairement bloqué',
        message: suspiciousCheck.message,
        failedAttempts: suspiciousCheck.failedAttempts
      });
    }

    // Récupérer l'utilisateur
    const [users] = await db.query(
      'SELECT * FROM users WHERE email = ? AND user_type = ?',
      [email, user_type]
    );

    if (users.length === 0) {
      // 🆕 LOGGER TENTATIVE ÉCHOUÉE
      await logLoginAttempt(db, email, ipAddress, false);
      return res.status(401).json({ error: 'Email ou mot de passe incorrect' });
    }

    const user = users[0];

    // Vérifier le mot de passe
    const isValidPassword = await bcrypt.compare(password, user.password);
    if (!isValidPassword) {
      // 🆕 LOGGER TENTATIVE ÉCHOUÉE
      await logLoginAttempt(db, email, ipAddress, false);
      return res.status(401).json({ error: 'Email ou mot de passe incorrect' });
    }

    // 🆕 VÉRIFIER SI EMAIL EST VÉRIFIÉ
    if (!user.email_verified) {
      return res.status(403).json({ 
        error: 'Email non vérifié',
        message: 'Veuillez vérifier votre email avant de vous connecter.',
        requiresEmailVerification: true
      });
    }

    // 🆕 VÉRIFIER 2FA SI ACTIVÉ
    if (user.twofa_enabled) {
      if (!twofa_code) {
        return res.status(200).json({
          requires2FA: true,
          message: 'Code d\'authentification requis',
          userId: user.id // Pour la prochaine étape
        });
      }

      // Vérifier le code 2FA
      const { verify2FAAuthentication } = require('../utils/twoFactorAuth');
      const verification = await verify2FAAuthentication(db, user.id, twofa_code);
      
      if (!verification.valid) {
        await logLoginAttempt(db, email, ipAddress, false);
        return res.status(401).json({ 
          error: 'Code 2FA invalide',
          message: verification.message
        });
      }

      // Si code backup utilisé, prévenir l'utilisateur
      if (verification.method === 'backup' && verification.remainingCodes < 3) {
        console.log(`⚠️ Utilisateur ${user.id} a ${verification.remainingCodes} codes de secours restants`);
      }
    }

    // 🆕 LOGGER CONNEXION RÉUSSIE
    await logLoginAttempt(db, email, ipAddress, true);

    // 🆕 GÉNÉRER ACCESS TOKEN ET REFRESH TOKEN
    const accessToken = generateAccessToken(user);
    const refreshToken = generateRefreshToken(user.id);
    
    // Stocker le refresh token
    await storeRefreshToken(db, user.id, refreshToken);

    res.json({
      message: 'Connexion réussie',
      accessToken,
      refreshToken,
      user: {
        id: user.id,
        email: user.email,
        first_name: user.first_name,
        last_name: user.last_name,
        user_type: user.user_type,
        agency_id: user.agency_id,
        role: user.role,
        twofa_enabled: user.twofa_enabled
      }
    });
  } catch (error) {
    console.error('Erreur connexion:', error);
    res.status(500).json({ error: 'Erreur lors de la connexion' });
  }
};

const getProfile = async (req, res) => {
  try {
    const [users] = await db.query(
      `SELECT u.*, a.name as agency_name 
       FROM users u 
       LEFT JOIN agencies a ON u.agency_id = a.id 
       WHERE u.id = ?`,
      [req.user.id]
    );

    if (users.length === 0) {
      return res.status(404).json({ error: 'Utilisateur non trouvé' });
    }

    const user = users[0];
    delete user.password;
    delete user.twofa_secret;
    delete user.twofa_backup_codes;

    res.json({ user });
  } catch (error) {
    console.error('Erreur récupération profil:', error);
    res.status(500).json({ error: 'Erreur lors de la récupération du profil' });
  }
};

// 🆕 VÉRIFICATION EMAIL
const verifyEmail = async (req, res) => {
  try {
    const { token } = req.body;

    if (!token) {
      return res.status(400).json({ error: 'Token de vérification manquant' });
    }

    // Trouver l'utilisateur avec ce token
    const [users] = await db.query(
      'SELECT * FROM users WHERE verification_token = ? AND verification_token_expires > NOW()',
      [token]
    );

    if (users.length === 0) {
      return res.status(400).json({ 
        error: 'Token invalide ou expiré',
        message: 'Le lien de vérification est invalide ou a expiré. Demandez un nouveau lien.'
      });
    }

    const user = users[0];

    // Marquer l'email comme vérifié
    await db.query(
      'UPDATE users SET email_verified = TRUE, verification_token = NULL, verification_token_expires = NULL WHERE id = ?',
      [user.id]
    );

    res.json({ 
      message: 'Email vérifié avec succès !',
      success: true
    });
  } catch (error) {
    console.error('Erreur vérification email:', error);
    res.status(500).json({ error: 'Erreur lors de la vérification de l\'email' });
  }
};

// 🆕 RENVOYER EMAIL DE VÉRIFICATION
const resendVerificationEmail = async (req, res) => {
  try {
    const { email } = req.body;

    const [users] = await db.query('SELECT * FROM users WHERE email = ?', [email]);

    if (users.length === 0) {
      return res.status(404).json({ error: 'Utilisateur non trouvé' });
    }

    const user = users[0];

    if (user.email_verified) {
      return res.status(400).json({ 
        error: 'Email déjà vérifié',
        message: 'Votre email a déjà été vérifié.'
      });
    }

    // Générer nouveau token
    const verificationToken = generateVerificationToken();
    const verificationExpires = getExpirationDate(24);

    await db.query(
      'UPDATE users SET verification_token = ?, verification_token_expires = ? WHERE id = ?',
      [verificationToken, verificationExpires, user.id]
    );

    // Envoyer l'email
    await sendVerificationEmail(email, user.first_name, verificationToken);

    res.json({ 
      message: 'Email de vérification renvoyé',
      success: true
    });
  } catch (error) {
    console.error('Erreur renvoi email:', error);
    res.status(500).json({ error: 'Erreur lors du renvoi de l\'email' });
  }
};

// 🆕 DEMANDE DE RÉINITIALISATION MOT DE PASSE
const requestPasswordReset = async (req, res) => {
  try {
    const { email } = req.body;

    const [users] = await db.query('SELECT * FROM users WHERE email = ?', [email]);

    if (users.length === 0) {
      // Ne pas révéler si l'email existe ou non (sécurité)
      return res.json({ 
        message: 'Si cet email existe, un lien de réinitialisation a été envoyé.',
        success: true
      });
    }

    const user = users[0];

    // Générer token de réinitialisation
    const resetToken = generateResetToken();
    const resetExpires = getExpirationDate(1); // Expire dans 1h

    await db.query(
      'UPDATE users SET reset_password_token = ?, reset_password_expires = ? WHERE id = ?',
      [resetToken, resetExpires, user.id]
    );

    // Envoyer l'email
    await sendPasswordResetEmail(email, user.first_name, resetToken);

    res.json({ 
      message: 'Si cet email existe, un lien de réinitialisation a été envoyé.',
      success: true
    });
  } catch (error) {
    console.error('Erreur demande réinitialisation:', error);
    res.status(500).json({ error: 'Erreur lors de la demande de réinitialisation' });
  }
};

// 🆕 RÉINITIALISER MOT DE PASSE
const resetPassword = async (req, res) => {
  try {
    const { token, newPassword } = req.body;

    if (!token || !newPassword) {
      return res.status(400).json({ error: 'Token et nouveau mot de passe requis' });
    }

    // Valider le nouveau mot de passe
    const passwordValidation = validatePasswordStrength(newPassword);
    if (!passwordValidation.isValid) {
      return res.status(400).json({ 
        error: 'Mot de passe trop faible',
        details: passwordValidation.errors
      });
    }

    // Trouver l'utilisateur avec ce token
    const [users] = await db.query(
      'SELECT * FROM users WHERE reset_password_token = ? AND reset_password_expires > NOW()',
      [token]
    );

    if (users.length === 0) {
      return res.status(400).json({ 
        error: 'Token invalide ou expiré',
        message: 'Le lien de réinitialisation est invalide ou a expiré.'
      });
    }

    const user = users[0];

    // Vérifier l'historique des mots de passe
    const historyCheck = await checkPasswordHistory(db, user.id, newPassword);
    if (historyCheck.isReused) {
      return res.status(400).json({ 
        error: 'Mot de passe déjà utilisé',
        message: historyCheck.message
      });
    }

    // Hasher le nouveau mot de passe
    const hashedPassword = await bcrypt.hash(newPassword, 10);

    // Mettre à jour le mot de passe
    await db.query(
      'UPDATE users SET password = ?, reset_password_token = NULL, reset_password_expires = NULL WHERE id = ?',
      [hashedPassword, user.id]
    );

    // Ajouter à l'historique
    await addToPasswordHistory(db, user.id, hashedPassword);

    // Révoquer tous les tokens existants (sécurité)
    await revokeAllUserRefreshTokens(db, user.id);

    // Envoyer email de confirmation
    await sendPasswordResetConfirmation(user.email, user.first_name);

    res.json({ 
      message: 'Mot de passe réinitialisé avec succès',
      success: true
    });
  } catch (error) {
    console.error('Erreur réinitialisation mot de passe:', error);
    res.status(500).json({ error: 'Erreur lors de la réinitialisation du mot de passe' });
  }
};

// 🆕 REFRESH ACCESS TOKEN
const refreshAccessToken = async (req, res) => {
  try {
    const { refreshToken } = req.body;

    if (!refreshToken) {
      return res.status(400).json({ error: 'Refresh token manquant' });
    }

    // Vérifier le refresh token
    const decoded = verifyRefreshToken(refreshToken);
    
    // Valider dans la BDD
    const validation = await validateRefreshToken(db, refreshToken);
    if (!validation.valid) {
      return res.status(401).json({ error: validation.message });
    }

    // Récupérer l'utilisateur
    const [users] = await db.query('SELECT * FROM users WHERE id = ?', [decoded.id]);
    if (users.length === 0) {
      return res.status(404).json({ error: 'Utilisateur non trouvé' });
    }

    const user = users[0];

    // Générer nouveau access token
    const newAccessToken = generateAccessToken(user);

    res.json({ 
      accessToken: newAccessToken,
      message: 'Token rafraîchi avec succès'
    });
  } catch (error) {
    console.error('Erreur refresh token:', error);
    res.status(401).json({ error: 'Refresh token invalide ou expiré' });
  }
};

// 🆕 LOGOUT (CÔTÉ SERVEUR)
const logout = async (req, res) => {
  try {
    const { refreshToken } = req.body;
    const accessToken = req.headers.authorization?.split(' ')[1];

    // Révoquer le refresh token
    if (refreshToken) {
      await revokeRefreshToken(db, refreshToken);
    }

    // Blacklister l'access token
    if (accessToken) {
      await blacklistToken(db, accessToken);
    }

    res.json({ 
      message: 'Déconnexion réussie',
      success: true
    });
  } catch (error) {
    console.error('Erreur logout:', error);
    res.status(500).json({ error: 'Erreur lors de la déconnexion' });
  }
};

// 🆕 CHANGER MOT DE PASSE (utilisateur connecté)
const changePassword = async (req, res) => {
  try {
    const { currentPassword, newPassword } = req.body;
    const userId = req.user.id;

    if (!currentPassword || !newPassword) {
      return res.status(400).json({ error: 'Mot de passe actuel et nouveau requis' });
    }

    // Récupérer l'utilisateur
    const [users] = await db.query('SELECT * FROM users WHERE id = ?', [userId]);
    if (users.length === 0) {
      return res.status(404).json({ error: 'Utilisateur non trouvé' });
    }

    const user = users[0];

    // Vérifier le mot de passe actuel
    const isValidPassword = await bcrypt.compare(currentPassword, user.password);
    if (!isValidPassword) {
      return res.status(401).json({ error: 'Mot de passe actuel incorrect' });
    }

    // Valider le nouveau mot de passe
    const passwordValidation = validatePasswordStrength(newPassword);
    if (!passwordValidation.isValid) {
      return res.status(400).json({ 
        error: 'Mot de passe trop faible',
        details: passwordValidation.errors
      });
    }

    // Vérifier l'historique
    const historyCheck = await checkPasswordHistory(db, userId, newPassword);
    if (historyCheck.isReused) {
      return res.status(400).json({ 
        error: 'Mot de passe déjà utilisé',
        message: historyCheck.message
      });
    }

    // Hasher le nouveau mot de passe
    const hashedPassword = await bcrypt.hash(newPassword, 10);

    // Mettre à jour
    await db.query('UPDATE users SET password = ? WHERE id = ?', [hashedPassword, userId]);

    // Ajouter à l'historique
    await addToPasswordHistory(db, userId, hashedPassword);

    // Révoquer tous les tokens (forcer reconnexion)
    await revokeAllUserRefreshTokens(db, userId);

    // Envoyer email de confirmation
    await sendPasswordResetConfirmation(user.email, user.first_name);

    res.json({ 
      message: 'Mot de passe changé avec succès',
      success: true,
      requiresRelogin: true
    });
  } catch (error) {
    console.error('Erreur changement mot de passe:', error);
    res.status(500).json({ error: 'Erreur lors du changement de mot de passe' });
  }
};

module.exports = {
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
};
