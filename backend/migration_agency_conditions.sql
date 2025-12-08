-- Migration pour ajouter les conditions des agences
USE car_rental;

-- Ajouter la colonne pour les conditions/règles de location de l'agence
ALTER TABLE agencies 
ADD COLUMN rental_conditions TEXT NULL AFTER address;

-- Exemple de conditions par défaut pour les agences existantes
UPDATE agencies 
SET rental_conditions = 'Le véhicule doit être rendu avec le plein de carburant.\nLe véhicule doit être propre à l\'intérieur et à l\'extérieur.\nTout retard sera facturé au tarif horaire en vigueur.\nLes dommages doivent être signalés immédiatement.'
WHERE rental_conditions IS NULL;
