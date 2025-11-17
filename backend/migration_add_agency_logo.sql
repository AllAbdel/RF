-- Migration pour ajouter la colonne logo à la table agencies
USE car_rental;

ALTER TABLE agencies ADD COLUMN logo VARCHAR(500) NULL AFTER email;
