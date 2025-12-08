-- Configuration initiale : 2 clients, 2 agences avec 3 membres chacune

-- Mot de passe hashé : "password123" (bcrypt)
SET @password_hash = '$2a$10$rZ5YhkW8xqGqN0pF3z1ZQOYvP8kT5sGZzT0kF5zYxGqN0pF3z1ZQO';

-- 1. Créer les 2 agences
INSERT INTO agencies (name, address, phone, email, rental_conditions, logo) VALUES
('Agence Premium Cars', '123 Avenue des Champs-Élysées, 75008 Paris', '01 42 56 78 90', 'contact@premiumcars.fr', 'Location de véhicules haut de gamme', NULL),
('Agence EcoDrive', '45 Rue de la République, 69002 Lyon', '04 78 90 12 34', 'info@ecodrive.fr', 'Location de véhicules écologiques et électriques', NULL);

-- 2. Créer les 2 clients
INSERT INTO users (email, password, first_name, last_name, phone, user_type, role) VALUES
('client1@email.com', @password_hash, 'Thomas', 'Martin', '06 12 34 56 78', 'client', 'member'),
('client2@email.com', @password_hash, 'Sophie', 'Bernard', '06 23 45 67 89', 'client', 'member');

-- 3. Créer les membres de l'Agence Premium Cars (ID 1)
INSERT INTO users (email, password, first_name, last_name, phone, user_type, agency_id, role) VALUES
('superadmin1@premiumcars.fr', @password_hash, 'Jean', 'Dupont', '06 34 56 78 90', 'agency_member', 1, 'super_admin'),
('admin1@premiumcars.fr', @password_hash, 'Marie', 'Lefebvre', '06 45 67 89 01', 'agency_member', 1, 'admin'),
('membre1@premiumcars.fr', @password_hash, 'Pierre', 'Durand', '06 56 78 90 12', 'agency_member', 1, 'member');

-- 4. Créer les membres de l'Agence EcoDrive (ID 2)
INSERT INTO users (email, password, first_name, last_name, phone, user_type, agency_id, role) VALUES
('superadmin2@ecodrive.fr', @password_hash, 'Claire', 'Moreau', '06 67 89 01 23', 'agency_member', 2, 'super_admin'),
('admin2@ecodrive.fr', @password_hash, 'Lucas', 'Simon', '06 78 90 12 34', 'agency_member', 2, 'admin'),
('membre2@ecodrive.fr', @password_hash, 'Emma', 'Laurent', '06 89 01 23 45', 'agency_member', 2, 'member');

-- Afficher les résultats
SELECT 'Agences créées:' as info;
SELECT id, name, email FROM agencies;

SELECT 'Clients créés:' as info;
SELECT id, email, first_name, last_name FROM users WHERE user_type = 'client';

SELECT 'Membres Agence Premium Cars:' as info;
SELECT id, email, first_name, last_name, role FROM users WHERE agency_id = 1;

SELECT 'Membres Agence EcoDrive:' as info;
SELECT id, email, first_name, last_name, role FROM users WHERE agency_id = 2;
