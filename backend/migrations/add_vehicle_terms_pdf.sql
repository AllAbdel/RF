-- Migration: Ajout du champ PDF pour les conditions d'utilisation des véhicules
-- Date: 2025-12-08

USE car_rental;

-- Ajouter la colonne pour le chemin du PDF des conditions d'utilisation
ALTER TABLE vehicles 
ADD COLUMN terms_pdf VARCHAR(500) NULL 
AFTER description;

-- Note: Cette colonne stockera le chemin relatif du fichier PDF uploadé
-- Format attendu: 'uploads/vehicles/terms/vehicle_123_terms.pdf'
