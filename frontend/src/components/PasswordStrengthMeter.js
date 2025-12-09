import React from 'react';
import '../styles/PasswordStrength.css';

const PasswordStrengthMeter = ({ password, onStrengthChange }) => {
  // Calculer la force du mot de passe
  const calculateStrength = (pwd) => {
    if (!pwd) return { score: 0, level: 'none', errors: [] };

    let score = 0;
    const errors = [];

    // Longueur minimum (8 caractères)
    if (pwd.length < 8) {
      errors.push('Au moins 8 caractères requis');
    } else {
      score += 20;
      if (pwd.length >= 12) score += 10;
      if (pwd.length >= 16) score += 10;
    }

    // Majuscules
    if (!/[A-Z]/.test(pwd)) {
      errors.push('Au moins une majuscule requise');
    } else {
      score += 15;
    }

    // Minuscules
    if (!/[a-z]/.test(pwd)) {
      errors.push('Au moins une minuscule requise');
    } else {
      score += 15;
    }

    // Chiffres
    if (!/[0-9]/.test(pwd)) {
      errors.push('Au moins un chiffre requis');
    } else {
      score += 15;
    }

    // Caractères spéciaux
    if (!/[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(pwd)) {
      errors.push('Au moins un caractère spécial requis (!@#$%^&*...)');
    } else {
      score += 15;
    }

    // Bonus diversité
    const uniqueChars = new Set(pwd).size;
    if (uniqueChars > 8) score += 10;

    // Déterminer le niveau
    let level;
    if (score < 40) level = 'weak';
    else if (score < 60) level = 'medium';
    else if (score < 80) level = 'strong';
    else level = 'very-strong';

    return { score, level, errors, valid: errors.length === 0 };
  };

  const strength = calculateStrength(password);

  // Notifier le parent du changement de force
  React.useEffect(() => {
    if (onStrengthChange) {
      onStrengthChange(strength);
    }
  }, [password]);

  if (!password) return null;

  const getLevelText = () => {
    switch (strength.level) {
      case 'weak': return 'Faible';
      case 'medium': return 'Moyen';
      case 'strong': return 'Fort';
      case 'very-strong': return 'Très Fort';
      default: return '';
    }
  };

  const getLevelColor = () => {
    switch (strength.level) {
      case 'weak': return '#e74c3c';
      case 'medium': return '#f39c12';
      case 'strong': return '#3498db';
      case 'very-strong': return '#2ecc71';
      default: return '#ccc';
    }
  };

  return (
    <div className="password-strength-meter">
      <div className="strength-bar-container">
        <div 
          className={`strength-bar strength-${strength.level}`}
          style={{ width: `${strength.score}%`, backgroundColor: getLevelColor() }}
        />
      </div>
      
      <div className="strength-info">
        <span className={`strength-level level-${strength.level}`}>
          {getLevelText()} ({strength.score}/100)
        </span>
      </div>

      {strength.errors.length > 0 && (
        <ul className="strength-errors">
          {strength.errors.map((error, index) => (
            <li key={index}>❌ {error}</li>
          ))}
        </ul>
      )}

      {strength.valid && (
        <div className="strength-valid">
          ✅ Mot de passe valide !
        </div>
      )}
    </div>
  );
};

export default PasswordStrengthMeter;
