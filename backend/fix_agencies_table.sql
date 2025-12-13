-- Ajouter la colonne logo à la table agencies
ALTER TABLE agencies ADD COLUMN IF NOT EXISTS logo VARCHAR(255) NULL AFTER email;

-- Vérifier la structure
DESCRIBE agencies;
