-- Script de correction de la base de données
USE car_rental;

-- 1. Ajouter la colonne logo si elle n'existe pas
ALTER TABLE agencies ADD COLUMN IF NOT EXISTS logo VARCHAR(500) NULL AFTER email;

-- 2. Créer la table agency_join_requests si elle n'existe pas
CREATE TABLE IF NOT EXISTS agency_join_requests (
  id INT PRIMARY KEY AUTO_INCREMENT,
  user_id INT NOT NULL,
  agency_id INT NOT NULL,
  status ENUM('pending', 'accepted', 'rejected') DEFAULT 'pending',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  FOREIGN KEY (agency_id) REFERENCES agencies(id) ON DELETE CASCADE,
  UNIQUE KEY unique_user_agency (user_id, agency_id)
);

-- 3. Ajouter les index si ils n'existent pas
CREATE INDEX IF NOT EXISTS idx_status ON agency_join_requests(status);
CREATE INDEX IF NOT EXISTS idx_agency_status ON agency_join_requests(agency_id, status);

-- 4. Nettoyer les utilisateurs créés par erreur comme "clients" qui devraient être en attente d'adhésion
-- Ces utilisateurs ont un user_type='client' mais pas de birth_date/license_date
UPDATE users 
SET user_type = 'client' 
WHERE user_type = 'client' 
  AND birth_date IS NULL 
  AND license_date IS NULL
  AND agency_id IS NULL;

-- Vérification : Afficher les agences existantes
SELECT id, name, email, logo FROM agencies;

-- Vérification : Afficher les demandes d'adhésion en attente
SELECT jr.id, jr.status, u.email, u.first_name, u.last_name, a.name as agency_name
FROM agency_join_requests jr
JOIN users u ON jr.user_id = u.id
JOIN agencies a ON jr.agency_id = a.id
WHERE jr.status = 'pending';
