const bcrypt = require('bcryptjs');

/**
 * Valider la force du mot de passe
 * Exigences:
 * - Minimum 8 caractères
 * - Au moins une majuscule
 * - Au moins une minuscule
 * - Au moins un chiffre
 * - Au moins un caractère spécial
 */
const validatePasswordStrength = (password) => {
  const errors = [];
  
  if (!password || password.length < 8) {
    errors.push('Le mot de passe doit contenir au moins 8 caractères');
  }
  
  if (!/[A-Z]/.test(password)) {
    errors.push('Le mot de passe doit contenir au moins une majuscule');
  }
  
  if (!/[a-z]/.test(password)) {
    errors.push('Le mot de passe doit contenir au moins une minuscule');
  }
  
  if (!/[0-9]/.test(password)) {
    errors.push('Le mot de passe doit contenir au moins un chiffre');
  }
  
  if (!/[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(password)) {
    errors.push('Le mot de passe doit contenir au moins un caractère spécial (!@#$%^&*...)');
  }
  
  return {
    isValid: errors.length === 0,
    errors,
    strength: calculatePasswordStrength(password)
  };
};

/**
 * Calculer le score de force du mot de passe (0-100)
 */
const calculatePasswordStrength = (password) => {
  if (!password) return 0;
  
  let score = 0;
  
  // Longueur (max 40 points)
  score += Math.min(password.length * 4, 40);
  
  // Majuscules (10 points)
  if (/[A-Z]/.test(password)) score += 10;
  
  // Minuscules (10 points)
  if (/[a-z]/.test(password)) score += 10;
  
  // Chiffres (10 points)
  if (/[0-9]/.test(password)) score += 10;
  
  // Caractères spéciaux (10 points)
  if (/[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(password)) score += 10;
  
  // Diversité de caractères (10 points)
  const uniqueChars = new Set(password).size;
  if (uniqueChars >= 8) score += 10;
  
  // Pas de séquences évidentes (-10 points)
  if (/123|abc|qwerty|password|azerty/i.test(password)) score -= 10;
  
  return Math.max(0, Math.min(100, score));
};

/**
 * Obtenir le niveau de force en texte
 */
const getPasswordStrengthLevel = (score) => {
  if (score < 40) return { level: 'weak', text: 'Faible', color: '#ff4444' };
  if (score < 60) return { level: 'medium', text: 'Moyen', color: '#ffa500' };
  if (score < 80) return { level: 'strong', text: 'Fort', color: '#4CAF50' };
  return { level: 'very-strong', text: 'Très fort', color: '#00c853' };
};

/**
 * Vérifier si le mot de passe a été utilisé récemment
 */
const checkPasswordHistory = async (db, userId, newPassword, historyLimit = 5) => {
  try {
    const [history] = await db.query(
      `SELECT password_hash FROM password_history 
       WHERE user_id = ? 
       ORDER BY created_at DESC 
       LIMIT ?`,
      [userId, historyLimit]
    );
    
    for (const record of history) {
      const isReused = await bcrypt.compare(newPassword, record.password_hash);
      if (isReused) {
        return {
          isReused: true,
          message: `Ce mot de passe a été utilisé récemment. Veuillez en choisir un autre.`
        };
      }
    }
    
    return { isReused: false };
  } catch (error) {
    console.error('Erreur vérification historique mots de passe:', error);
    // En cas d'erreur, on laisse passer pour ne pas bloquer l'utilisateur
    return { isReused: false };
  }
};

/**
 * Ajouter le mot de passe à l'historique
 */
const addToPasswordHistory = async (db, userId, passwordHash) => {
  try {
    await db.query(
      'INSERT INTO password_history (user_id, password_hash) VALUES (?, ?)',
      [userId, passwordHash]
    );
    
    // Garder seulement les 5 derniers mots de passe
    await db.query(
      `DELETE FROM password_history 
       WHERE user_id = ? 
       AND id NOT IN (
         SELECT id FROM (
           SELECT id FROM password_history 
           WHERE user_id = ? 
           ORDER BY created_at DESC 
           LIMIT 5
         ) tmp
       )`,
      [userId, userId]
    );
  } catch (error) {
    console.error('Erreur ajout historique mot de passe:', error);
  }
};

/**
 * Générer un mot de passe aléatoire fort
 */
const generateStrongPassword = (length = 16) => {
  const lowercase = 'abcdefghijklmnopqrstuvwxyz';
  const uppercase = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
  const numbers = '0123456789';
  const special = '!@#$%^&*()_+-=[]{}|;:,.<>?';
  
  const allChars = lowercase + uppercase + numbers + special;
  
  let password = '';
  
  // Garantir au moins un de chaque type
  password += lowercase[Math.floor(Math.random() * lowercase.length)];
  password += uppercase[Math.floor(Math.random() * uppercase.length)];
  password += numbers[Math.floor(Math.random() * numbers.length)];
  password += special[Math.floor(Math.random() * special.length)];
  
  // Remplir le reste
  for (let i = password.length; i < length; i++) {
    password += allChars[Math.floor(Math.random() * allChars.length)];
  }
  
  // Mélanger
  return password.split('').sort(() => Math.random() - 0.5).join('');
};

module.exports = {
  validatePasswordStrength,
  calculatePasswordStrength,
  getPasswordStrengthLevel,
  checkPasswordHistory,
  addToPasswordHistory,
  generateStrongPassword
};
