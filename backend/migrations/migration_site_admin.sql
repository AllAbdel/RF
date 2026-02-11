-- Migration: Ajout du système d'administration du site et demandes de création d'agence
-- Date: 2026-02-11

-- 1. Modifier l'ENUM user_type pour ajouter 'site_admin'
ALTER TABLE users MODIFY COLUMN user_type ENUM('client', 'agency_member', 'site_admin') NOT NULL;

-- 2. Créer la table des demandes de création d'agence
CREATE TABLE IF NOT EXISTS agency_creation_requests (
  id INT PRIMARY KEY AUTO_INCREMENT,
  user_id INT NOT NULL,
  agency_name VARCHAR(255) NOT NULL,
  agency_email VARCHAR(255),
  agency_phone VARCHAR(20),
  agency_address TEXT,
  agency_description TEXT,
  logo_path VARCHAR(500),
  status ENUM('pending', 'approved', 'rejected') DEFAULT 'pending',
  admin_notes TEXT,
  reviewed_by INT NULL,
  reviewed_at TIMESTAMP NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  FOREIGN KEY (reviewed_by) REFERENCES users(id) ON DELETE SET NULL
);

-- 3. Créer le compte admin du site
-- Mot de passe: Admin@2026! (hashé avec bcrypt)
-- À CHANGER EN PRODUCTION !
INSERT INTO users (email, password, first_name, last_name, user_type, role, email_verified)
VALUES (
  'admin@rentflow.fr',
  '$2a$10$placeholder',
  'Admin',
  'Rentflow',
  'site_admin',
  'super_admin',
  TRUE
);
