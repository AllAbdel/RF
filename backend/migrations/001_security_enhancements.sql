-- Migration pour les améliorations de sécurité
-- Date: 2025-12-09

USE car_rental;

-- 1. Ajouter colonnes pour vérification email
ALTER TABLE users 
ADD COLUMN email_verified BOOLEAN DEFAULT FALSE AFTER email,
ADD COLUMN verification_token VARCHAR(255) NULL AFTER email_verified,
ADD COLUMN verification_token_expires DATETIME NULL AFTER verification_token;

-- 2. Ajouter colonnes pour réinitialisation mot de passe
ALTER TABLE users 
ADD COLUMN reset_password_token VARCHAR(255) NULL AFTER verification_token_expires,
ADD COLUMN reset_password_expires DATETIME NULL AFTER reset_password_token;

-- 3. Ajouter colonnes pour 2FA (TOTP)
ALTER TABLE users 
ADD COLUMN twofa_secret VARCHAR(255) NULL AFTER reset_password_expires,
ADD COLUMN twofa_enabled BOOLEAN DEFAULT FALSE AFTER twofa_secret,
ADD COLUMN twofa_backup_codes TEXT NULL AFTER twofa_enabled;

-- 4. Créer table pour historique des mots de passe
CREATE TABLE IF NOT EXISTS password_history (
  id INT PRIMARY KEY AUTO_INCREMENT,
  user_id INT NOT NULL,
  password_hash VARCHAR(255) NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  INDEX idx_user_created (user_id, created_at DESC)
);

-- 5. Créer table pour blacklist des tokens JWT
CREATE TABLE IF NOT EXISTS token_blacklist (
  id INT PRIMARY KEY AUTO_INCREMENT,
  token_jti VARCHAR(255) UNIQUE NOT NULL,
  user_id INT NOT NULL,
  expires_at DATETIME NOT NULL,
  blacklisted_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  INDEX idx_jti (token_jti),
  INDEX idx_expires (expires_at)
);

-- 6. Créer table pour refresh tokens
CREATE TABLE IF NOT EXISTS refresh_tokens (
  id INT PRIMARY KEY AUTO_INCREMENT,
  user_id INT NOT NULL,
  token VARCHAR(500) UNIQUE NOT NULL,
  expires_at DATETIME NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  last_used_at TIMESTAMP NULL,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  INDEX idx_token (token),
  INDEX idx_user_expires (user_id, expires_at)
);

-- 7. Créer table pour rate limiting (tentatives de connexion)
CREATE TABLE IF NOT EXISTS login_attempts (
  id INT PRIMARY KEY AUTO_INCREMENT,
  email VARCHAR(255) NOT NULL,
  ip_address VARCHAR(45) NOT NULL,
  attempted_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  success BOOLEAN DEFAULT FALSE,
  INDEX idx_email_time (email, attempted_at DESC),
  INDEX idx_ip_time (ip_address, attempted_at DESC)
);

-- 8. Marquer les utilisateurs existants comme vérifiés (migration)
UPDATE users SET email_verified = TRUE WHERE created_at < NOW();

-- 9. Ajouter index pour améliorer les performances
CREATE INDEX idx_verification_token ON users(verification_token);
CREATE INDEX idx_reset_token ON users(reset_password_token);

-- Note: Exécuter cette migration avec: mysql -u root -p car_rental < migrations/001_security_enhancements.sql
