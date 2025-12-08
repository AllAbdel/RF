-- Migration: Amélioration du profil des agences
-- Date: 2025-12-08
-- Ajout de liens de paiement, logo personnalisé, et conditions PDF

USE car_rental;

-- Ajouter les colonnes pour le profil complet de l'agence
ALTER TABLE agencies 
ADD COLUMN logo VARCHAR(500) NULL AFTER name,
ADD COLUMN description TEXT NULL AFTER address,
ADD COLUMN payment_link_paypal VARCHAR(500) NULL AFTER description,
ADD COLUMN payment_link_stripe VARCHAR(500) NULL AFTER payment_link_paypal,
ADD COLUMN payment_link_other VARCHAR(500) NULL AFTER payment_link_stripe,
ADD COLUMN rental_conditions_pdf VARCHAR(500) NULL AFTER payment_link_other,
ADD COLUMN website VARCHAR(255) NULL AFTER rental_conditions_pdf;

-- Index pour améliorer les performances des recherches
CREATE INDEX idx_agency_name ON agencies(name);

-- Note: 
-- logo: Chemin vers le fichier logo de l'agence
-- description: Présentation de l'agence
-- payment_link_*: Liens vers les plateformes de paiement
-- rental_conditions_pdf: Alternative PDF aux conditions texte
-- website: Site web de l'agence
