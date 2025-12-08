-- Migration pour ajouter les adresses de récupération et dépôt des véhicules
USE car_rental;

-- Ajouter les colonnes pour les adresses de récupération et dépôt
ALTER TABLE vehicles 
ADD COLUMN pickup_address TEXT NULL AFTER location,
ADD COLUMN return_address TEXT NULL AFTER pickup_address;

-- Note: La colonne 'location' existante peut servir comme adresse par défaut
-- Si pickup_address ou return_address sont NULL, on utilisera 'location'
