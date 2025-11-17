-- Migration pour ajouter la date de naissance et la date d'obtention du permis
-- Date: 2025-11-17

USE car_rental;

-- Ajouter les colonnes birth_date et license_date à la table users
ALTER TABLE users
ADD COLUMN birth_date DATE NULL AFTER phone,
ADD COLUMN license_date DATE NULL AFTER birth_date;

-- Ajouter des commentaires pour documentation
ALTER TABLE users 
MODIFY COLUMN birth_date DATE NULL COMMENT 'Date de naissance de l\'utilisateur',
MODIFY COLUMN license_date DATE NULL COMMENT 'Date d\'obtention du permis de conduire';
